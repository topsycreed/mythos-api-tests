import { expect, test } from '@playwright/test';

import { createAuthSession } from '../../src/api/auth';
import {
  createMythologyEntity,
  createMythologyEntityWithoutAuth,
  deleteMythologyEntity,
  deleteMythologyEntityWithoutAuth,
  patchMythologyEntity,
  patchMythologyEntityWithoutAuth,
  replaceMythologyEntity,
  replaceMythologyEntityWithoutAuth,
  type MythologyEntity,
} from '../../src/api/mythology';
import {
  createIncompletePutPayload,
  createMythologyPayload,
  protectedSystemEntityIds,
  invalidCreateMythologyCases,
} from '../support/mythology-test-data';
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
  test(testCase.name, async ({ request }) => {
    const response = await testCase.run({ request });

    expect(response.status()).toBe(401);
  });
}

for (const testCase of invalidCreateMythologyCases) {
  test(`POST /mythology returns 400 for ${testCase.name}`, async ({ request }) => {
    const { token } = await createAuthSession(request);

    const response = await createMythologyEntity(request, token, testCase.payload);

    expect(response.status()).toBe(400);
  });
}

test('PUT /mythology/{id} returns 400 when full payload is not provided', async ({ request }) => {
  const { token } = await createAuthSession(request);
  const createdEntityResponse = await createMythologyEntity(request, token, createMythologyPayload());
  await expect(createdEntityResponse).toBeOK();

  const createdEntity = (await createdEntityResponse.json()) as MythologyEntity;

  try {
    const response = await request.put(`mythology/${createdEntity.id}`, {
      data: createIncompletePutPayload(createdEntity),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(400);
  } finally {
    await deleteMythologyEntity(request, token, createdEntity.id);
  }
});

test('PATCH /mythology/{id} returns 400 for an empty request body', async ({ request }) => {
  const { token } = await createAuthSession(request);
  const createdEntityResponse = await createMythologyEntity(request, token, createMythologyPayload());
  await expect(createdEntityResponse).toBeOK();

  const createdEntity = (await createdEntityResponse.json()) as MythologyEntity;

  try {
    const response = await patchMythologyEntity(request, token, createdEntity.id, {});

    expect(response.status()).toBe(400);
  } finally {
    await deleteMythologyEntity(request, token, createdEntity.id);
  }
});

for (const systemEntityId of protectedSystemEntityIds) {
  test(`PUT /mythology/{id} returns 403 for protected system entity ${systemEntityId}`, async ({ request }) => {
    const { token } = await createAuthSession(request);

    const response = await replaceMythologyEntity(request, token, systemEntityId, createMythologyPayload());

    expect(response.status()).toBe(403);
  });

  test(`DELETE /mythology/{id} returns 403 for protected system entity ${systemEntityId}`, async ({ request }) => {
    const { token } = await createAuthSession(request);

    const response = await request.delete(`mythology/${systemEntityId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(403);
  });
}
