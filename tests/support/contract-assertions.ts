import { expect, type APIResponse } from '@playwright/test';

import {
  type LoginResponseBody,
  type RegisterResponseBody,
} from '../../src/api/auth';
import { type MythologyEntity } from '../../src/api/mythology';

// Error body у разных endpoint может немного отличаться, поэтому контракт описан как мягкий union-like объект.
type ApiErrorBody = {
  error?: string;
  message?: string;
  success?: boolean;
};

// Это assertion function: она не только проверяет значение runtime-ассертом,
// но и сужает тип для TypeScript после вызова.
function expectNonEmptyString(value: unknown): asserts value is string {
  expect(value).toEqual(expect.any(String));
  expect((value as string).length).toBeGreaterThan(0);
}

// Универсальная проверка, что endpoint действительно вернул JSON.
export function expectJsonContentType(response: APIResponse): void {
  expect(response.headers()['content-type']).toContain('application/json');
}

export function expectMythologyEntityContract(
  entity: unknown,
): asserts entity is MythologyEntity {
  // Начинаем с unknown и только потом доказываем форму объекта через runtime-проверки.
  expect(entity).toEqual(expect.any(Object));

  const candidate = entity as MythologyEntity;

  expect(candidate.id).toEqual(expect.any(Number));
  expectNonEmptyString(candidate.name);
  expectNonEmptyString(candidate.category);
  expectNonEmptyString(candidate.desc);

  // img одновременно optional и nullable, поэтому проверка идет только если поле реально пришло строкой.
  if (candidate.img !== undefined && candidate.img !== null) {
    expect(candidate.img).toEqual(expect.any(String));
  }
}

export function expectMythologyEntityListContract(
  body: unknown,
): asserts body is MythologyEntity[] {
  // Сначала убеждаемся, что это массив, потом валидируем каждый элемент.
  expect(Array.isArray(body)).toBe(true);

  for (const entity of body as MythologyEntity[]) {
    expectMythologyEntityContract(entity);
  }
}

export function expectRegisterResponseContract(
  body: unknown,
): asserts body is RegisterResponseBody {
  // Минимальный контракт регистрации — объект с непустым message.
  expect(body).toEqual(expect.any(Object));

  const candidate = body as RegisterResponseBody;
  expectNonEmptyString(candidate.message);
}

export function expectLoginResponseContract(
  body: unknown,
): asserts body is LoginResponseBody {
  // Минимальный контракт логина — объект с непустым token.
  expect(body).toEqual(expect.any(Object));

  const candidate = body as LoginResponseBody;
  expectNonEmptyString(candidate.token);
  // Это простая структурная проверка JWT: header.payload.signature.
  expect(candidate.token.split('.')).toHaveLength(3);
}

export function expectApiErrorBodyContract(
  body: unknown,
): asserts body is ApiErrorBody {
  // Error body тоже часть API-контракта, поэтому валидируется отдельно.
  expect(body).toEqual(expect.any(Object));

  const candidate = body as ApiErrorBody;
  const hasError = typeof candidate.error === 'string' && candidate.error.length > 0;
  const hasMessage = typeof candidate.message === 'string' && candidate.message.length > 0;

  // Для error body нам важно, чтобы был хотя бы один осмысленный текстовый сигнал ошибки.
  expect(hasError || hasMessage).toBe(true);

  if (candidate.success !== undefined) {
    expect(candidate.success).toEqual(expect.any(Boolean));
  }
}
