import {
  createMythologyEntity,
  createMythologyEntityWithoutAuth,
  deleteMythologyEntity,
  deleteMythologyEntityWithoutAuth,
  patchMythologyEntity,
  patchMythologyEntityWithoutAuth,
  replaceMythologyEntity,
  replaceMythologyEntityWithoutAuth,
} from '../../src/api/mythology';
import { expect, test } from '../fixtures/api-test';
import {
  createIncompletePutPayload,
  createMythologyPayload,
  invalidCreateMythologyCases,
  protectedSystemEntityIds,
} from '../support/mythology-test-data';

test.describe.configure({ mode: 'serial' });

const unauthorizedMutationCases = [
  {
    name: 'POST /mythology returns 401 without JWT token',
    run: ({ request }: { request: Parameters<typeof createMythologyEntityWithoutAuth>[0] }) =>
      createMythologyEntityWithoutAuth(request, createMythologyPayload()),
  },
  {
    name: 'PUT /mythology/{id} returns 401 without JWT token',
    run: ({ request }: { request: Parameters<typeof replaceMythologyEntityWithoutAuth>[0] }) =>
      replaceMythologyEntityWithoutAuth(request, protectedSystemEntityIds[0], createMythologyPayload()),
  },
  {
    name: 'PATCH /mythology/{id} returns 401 without JWT token',
    run: ({ request }: { request: Parameters<typeof patchMythologyEntityWithoutAuth>[0] }) =>
      patchMythologyEntityWithoutAuth(request, protectedSystemEntityIds[0], {
        desc: 'Unauthorized patch attempt.',
      }),
  },
  {
    name: 'DELETE /mythology/{id} returns 401 without JWT token',
    run: ({ request }: { request: Parameters<typeof deleteMythologyEntityWithoutAuth>[0] }) =>
      deleteMythologyEntityWithoutAuth(request, protectedSystemEntityIds[0]),
  },
] as const;

for (const testCase of unauthorizedMutationCases) {
  test(testCase.name, { tag: '@negative' }, async ({ request }) => {
    const response = await test.step('Send write request without JWT token', async () =>
      testCase.run({ request }),
    );

    expect(response.status()).toBe(401);
  });
}

for (const testCase of invalidCreateMythologyCases) {
  test(
    `POST /mythology returns 400 for ${testCase.name}`,
    { tag: '@negative' },
    async ({ request, authToken }) => {
      const response = await test.step(`Submit invalid create payload: ${testCase.name}`, async () =>
        createMythologyEntity(request, authToken, testCase.payload),
      );

      expect(response.status()).toBe(400);
    },
  );
}

test(
  'PUT /mythology/{id} returns 400 when full payload is not provided',
  { tag: '@negative' },
  async ({ request, authToken, mythologyEntityManager }) => {
    const createdEntity = await test.step('Create entity for incomplete put test', async () =>
      mythologyEntityManager.create(),
    );

    const response = await test.step('Send put request with incomplete payload', async () =>
      request.put(`mythology/${createdEntity.id}`, {
        data: createIncompletePutPayload(createdEntity),
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }),
    );

    expect(response.status()).toBe(400);
  },
);

test(
  'PATCH /mythology/{id} returns 400 for an empty request body',
  { tag: '@negative' },
  async ({ request, authToken, mythologyEntityManager }) => {
    const createdEntity = await test.step('Create entity for empty patch test', async () =>
      mythologyEntityManager.create(),
    );

    const response = await test.step('Send patch request with empty body', async () =>
      patchMythologyEntity(request, authToken, createdEntity.id, {}),
    );

    expect(response.status()).toBe(400);
  },
);

for (const systemEntityId of protectedSystemEntityIds) {
  test(
    `PUT /mythology/{id} returns 403 for protected system entity ${systemEntityId}`,
    { tag: '@negative' },
    async ({ request, authToken }) => {
      const response = await test.step(`Try to replace protected entity ${systemEntityId}`, async () =>
        replaceMythologyEntity(request, authToken, systemEntityId, createMythologyPayload()),
      );

      expect(response.status()).toBe(403);
    },
  );

  test(
    `DELETE /mythology/{id} returns 403 for protected system entity ${systemEntityId}`,
    { tag: '@negative' },
    async ({ request, authToken }) => {
      const response = await test.step(`Try to delete protected entity ${systemEntityId}`, async () =>
        deleteMythologyEntity(request, authToken, systemEntityId),
      );

      expect(response.status()).toBe(403);
    },
  );
}
