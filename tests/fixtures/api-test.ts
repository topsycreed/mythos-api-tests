import { writeFile } from 'node:fs/promises';
import {
  expect,
  // Переименование request в playwrightRequest помогает не путать factory request context
  // с одноименной built-in fixture request внутри самих тестов.
  request as playwrightRequest,
  test as base,
  type APIResponse,
} from '@playwright/test';

import { createAuthSession, type AuthSession } from '../../src/api/auth';
import { env } from '../../src/config/env';
import {
  createMythologyEntity,
  deleteMythologyEntity,
  type CreateMythologyPayload,
  type MythologyEntity,
} from '../../src/api/mythology';
import { createMythologyPayload } from '../support/mythology-test-data';

// Отдельный тип под debug request помогает централизованно описать, что именно логируем.
type ApiRequestDebug = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
};

type ApiCallMetadata = {
  label: string;
  request: ApiRequestDebug;
};

// Этот helper-объект управляет временными сущностями и их cleanup.
type MythologyEntityManager = {
  create: (overrides?: Partial<CreateMythologyPayload>) => Promise<MythologyEntity>;
  track: (id: number) => void;
};

// Higher-order function: оборачивает любой API вызов и добавляет вокруг него debug side effects.
type ApiDebugCall = <T extends APIResponse>(
  metadata: ApiCallMetadata,
  action: () => Promise<T>,
) => Promise<T>;

type ApiFixtures = {
  authToken: string;
  debugApiCall: ApiDebugCall;
  mythologyEntityManager: MythologyEntityManager;
};

// Worker fixtures существуют дольше обычных test fixtures и переиспользуются внутри worker.
type ApiWorkerFixtures = {
  authSession: AuthSession;
};

// Это структура одного обмена request/response для будущего api-debug-log.json.
type ApiExchange = {
  label: string;
  request: ApiRequestDebug;
  response?: {
    body: unknown;
    headers: Record<string, string>;
    ok: boolean;
    status: number;
    url: string;
  };
  error?: {
    message: string;
    stack?: string;
  };
  startedAt: string;
  finishedAt: string;
};

const sensitiveKeys = ['authorization', 'cookie', 'password', 'set-cookie', 'token'];

// Без baseURL нельзя создать отдельный request context для reusable auth flow.
const requireBaseUrl = (): string => {
  if (!env.baseUrl) {
    throw new Error('Missing required environment variable: BASE_URL');
  }

  return env.baseUrl;
};

const isSensitiveKey = (key: string): boolean =>
  sensitiveKeys.some((fragment) => key.toLowerCase().includes(fragment));

const redactSensitive = (value: unknown): unknown => {
  // Рекурсивный обход нужен, потому что чувствительные данные могут лежать глубоко внутри объекта или массива.
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, itemValue]) => [
      key,
      isSensitiveKey(key) ? '***' : redactSensitive(itemValue),
    ]);

    // Object.fromEntries собирает объект обратно после трансформации его пар ключ-значение.
    return Object.fromEntries(entries);
  }

  return value;
};

// Частный случай редактирования чувствительных данных именно в HTTP-заголовках.
const redactHeaders = (
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined => {
  if (!headers) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, isSensitiveKey(key) ? '***' : value]),
  );
};

// Преобразует любой thrown value в единый объект для debug-лога.
const serializeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
};

// Читает тело ответа максимально безопасно для debug flow, даже если контент невалидный или не JSON.
const readResponseBody = async (response: APIResponse): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers()['content-type'] ?? '';

  if (contentType.includes('application/json')) {
    try {
      // Если response действительно JSON, логируем уже распарсенное и отредактированное содержимое.
      return redactSensitive(JSON.parse(text));
    } catch {
      // На случай неконсистентного content-type не ломаем debug flow, а просто возвращаем исходный текст.
      return text;
    }
  }

  return text;
};

// base.extend(...) строит новый typed test object поверх стандартного Playwright test.
export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  authSession: [
    async ({}, use) => {
      const authRequest = await playwrightRequest.newContext({
        baseURL: requireBaseUrl(),
      });

      try {
        // Worker-scoped fixture логинится один раз на worker, а не перед каждым тестом.
        const session = await createAuthSession(authRequest);
        await use(session);
      } finally {
        await authRequest.dispose();
      }
    },
    { scope: 'worker' },
  ],

  authToken: async ({ authSession }, use) => {
    // authToken — это просто удобная проекция session.token для тестов.
    await use(authSession.token);
  },

  debugApiCall: async ({}, use, testInfo) => {
    const apiExchanges: ApiExchange[] = [];

    const debugApiCall: ApiDebugCall = async (metadata, action) => {
      const startedAt = new Date().toISOString();

      try {
        const response = await action();

        apiExchanges.push({
          label: metadata.label,
          request: {
            ...metadata.request,
            body: redactSensitive(metadata.request.body),
            headers: redactHeaders(metadata.request.headers),
          },
          response: {
            body: await readResponseBody(response),
            headers: redactHeaders(response.headers()) ?? {},
            ok: response.ok(),
            status: response.status(),
            url: response.url(),
          },
          finishedAt: new Date().toISOString(),
          startedAt,
        });

        return response;
      } catch (error) {
        apiExchanges.push({
          label: metadata.label,
          request: {
            ...metadata.request,
            body: redactSensitive(metadata.request.body),
            headers: redactHeaders(metadata.request.headers),
          },
          error: serializeError(error),
          finishedAt: new Date().toISOString(),
          startedAt,
        });

        throw error;
      }
    };

    await use(debugApiCall);

    // После завершения теста fixture знает, упал тест или нет, и может прикладывать debug log только по необходимости.
    const shouldAttachDebugLog =
      apiExchanges.length > 0 &&
      (testInfo.errors.length > 0 || testInfo.status !== testInfo.expectedStatus);

    if (shouldAttachDebugLog) {
      // outputPath создает путь внутри папки конкретного теста в outputDir.
      const debugLogPath = testInfo.outputPath('api-debug-log.json');

      await writeFile(debugLogPath, JSON.stringify(apiExchanges, null, 2), 'utf8');
      await testInfo.attach('api-debug-log', {
        path: debugLogPath,
        contentType: 'application/json',
      });
    }
  },

  mythologyEntityManager: async ({ request, authToken, debugApiCall }, use) => {
    // Set защищает от повторного cleanup одного и того же id.
    const trackedEntityIds = new Set<number>();

    const manager: MythologyEntityManager = {
      create: async (overrides = {}) => {
        const payload = createMythologyPayload(overrides);
        const response = await debugApiCall(
          {
            label: 'Create temporary mythology entity',
            request: {
              method: 'POST',
              url: 'mythology',
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
              body: payload,
            },
          },
          () => createMythologyEntity(request, authToken, payload),
        );

        if (!response.ok()) {
          throw new Error(
            `Create mythology entity failed: ${response.status()} ${await response.text()}`,
          );
        }

        const entity = (await response.json()) as MythologyEntity;
        trackedEntityIds.add(entity.id);

        return entity;
      },

      track: (id: number) => {
        trackedEntityIds.add(id);
      },
    };

    await use(manager);

    // Cleanup идет в обратном порядке создания — это безопаснее для цепочек зависимых ресурсов.
    for (const entityId of Array.from(trackedEntityIds).reverse()) {
      const response = await debugApiCall(
        {
          label: `Clean up mythology entity ${entityId}`,
          request: {
            method: 'DELETE',
            url: `mythology/${entityId}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        },
        () => deleteMythologyEntity(request, authToken, entityId),
      );

      if (response.status() === 204 || response.status() === 404) {
        continue;
      }

      throw new Error(
        `Cleanup failed for mythology entity ${entityId}: ${response.status()} ${await response.text()}`,
      );
    }
  },
});

export { expect };
