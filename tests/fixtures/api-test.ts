import { expect, request as playwrightRequest, test as base } from '@playwright/test';

import { createAuthSession, type AuthSession } from '../../src/api/auth';
import { env } from '../../src/config/env';
import {
  createMythologyEntity,
  deleteMythologyEntity,
  type CreateMythologyPayload,
  type MythologyEntity,
} from '../../src/api/mythology';
import { createMythologyPayload } from '../support/mythology-test-data';

type MythologyEntityManager = {
  create: (overrides?: Partial<CreateMythologyPayload>) => Promise<MythologyEntity>;
  track: (id: number) => void;
};

type ApiFixtures = {
  authToken: string;
  mythologyEntityManager: MythologyEntityManager;
};

type ApiWorkerFixtures = {
  authSession: AuthSession;
};

const requireBaseUrl = (): string => {
  if (!env.baseUrl) {
    throw new Error('Missing required environment variable: BASE_URL');
  }

  return env.baseUrl;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  authSession: [
    async ({}, use) => {
      const authRequest = await playwrightRequest.newContext({
        baseURL: requireBaseUrl(),
      });

      try {
        const session = await createAuthSession(authRequest);
        await use(session);
      } finally {
        await authRequest.dispose();
      }
    },
    { scope: 'worker' },
  ],

  authToken: async ({ authSession }, use) => {
    await use(authSession.token);
  },

  mythologyEntityManager: async ({ request, authToken }, use) => {
    const trackedEntityIds = new Set<number>();

    const manager: MythologyEntityManager = {
      create: async (overrides = {}) => {
        const response = await createMythologyEntity(
          request,
          authToken,
          createMythologyPayload(overrides),
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

    for (const entityId of Array.from(trackedEntityIds).reverse()) {
      const response = await deleteMythologyEntity(request, authToken, entityId);

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
