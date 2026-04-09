import { expect, test } from '@playwright/test';

import { createAuthSession } from '../../src/api/auth';
import {
  createMythologyEntity,
  deleteMythologyEntity,
  getMythologyById,
  patchMythologyEntity,
  replaceMythologyEntity,
  type MythologyEntity,
} from '../../src/api/mythology';
import {
  createMythologyPayload,
  createPatchMythologyPayload,
  createReplacementMythologyPayload,
} from '../support/mythology-test-data';

test('POST /mythology creates a new entity', { tag: '@crud' }, async ({ request }) => {
  const { token } = await test.step('Create an authenticated session', async () => createAuthSession(request));
  const payload = createMythologyPayload();

  const response = await test.step('Create a mythology entity', async () =>
    createMythologyEntity(request, token, payload),
  );

  await expect(response).toBeOK();
  expect(response.status()).toBe(201);

  const createdEntity = await test.step(
    'Read created entity response',
    async () => (await response.json()) as MythologyEntity,
  );

  expect(createdEntity.id).toEqual(expect.any(Number));
  expect(createdEntity).toMatchObject(payload);

  const deleteResponse = await test.step('Clean up the created entity', async () =>
    deleteMythologyEntity(request, token, createdEntity.id),
  );
  expect(deleteResponse.status()).toBe(204);
});

test('PATCH /mythology/{id} updates selected fields', { tag: '@crud' }, async ({ request }) => {
  const { token } = await test.step('Create an authenticated session', async () => createAuthSession(request));
  const createdEntityResponse = await test.step('Create entity for patch test', async () =>
    createMythologyEntity(request, token, createMythologyPayload()),
  );
  await expect(createdEntityResponse).toBeOK();

  const createdEntity = (await createdEntityResponse.json()) as MythologyEntity;
  const patchPayload = createPatchMythologyPayload();

  try {
    const patchResponse = await test.step('Patch selected fields', async () =>
      patchMythologyEntity(request, token, createdEntity.id, patchPayload),
    );

    await expect(patchResponse).toBeOK();
    expect(patchResponse.status()).toBe(200);

    const getResponse = await test.step('Fetch entity after patch', async () =>
      getMythologyById(request, createdEntity.id),
    );
    await expect(getResponse).toBeOK();

    const updatedEntity = (await getResponse.json()) as MythologyEntity;

    expect(updatedEntity.id).toBe(createdEntity.id);
    expect(updatedEntity.name).toBe(createdEntity.name);
    expect(updatedEntity.category).toBe(createdEntity.category);
    expect(updatedEntity.desc).toBe(patchPayload.desc);
  } finally {
    await deleteMythologyEntity(request, token, createdEntity.id);
  }
});

test('PUT /mythology/{id} replaces entity fields', { tag: '@crud' }, async ({ request }) => {
  const { token } = await test.step('Create an authenticated session', async () => createAuthSession(request));
  const createdEntityResponse = await test.step('Create entity for put test', async () =>
    createMythologyEntity(request, token, createMythologyPayload()),
  );
  await expect(createdEntityResponse).toBeOK();

  const createdEntity = (await createdEntityResponse.json()) as MythologyEntity;
  const replacementPayload = createReplacementMythologyPayload();

  try {
    const putResponse = await test.step('Replace all entity fields', async () =>
      replaceMythologyEntity(request, token, createdEntity.id, replacementPayload),
    );

    await expect(putResponse).toBeOK();
    expect(putResponse.status()).toBe(200);

    const getResponse = await test.step('Fetch entity after put', async () =>
      getMythologyById(request, createdEntity.id),
    );
    await expect(getResponse).toBeOK();

    const updatedEntity = (await getResponse.json()) as MythologyEntity;

    expect(updatedEntity.id).toBe(createdEntity.id);
    expect(updatedEntity).toMatchObject(replacementPayload);
  } finally {
    await deleteMythologyEntity(request, token, createdEntity.id);
  }
});

test('DELETE /mythology/{id} removes a created entity', { tag: '@crud' }, async ({ request }) => {
  const { token } = await test.step('Create an authenticated session', async () => createAuthSession(request));
  const createdEntityResponse = await test.step('Create entity for delete test', async () =>
    createMythologyEntity(request, token, createMythologyPayload()),
  );
  await expect(createdEntityResponse).toBeOK();

  const createdEntity = (await createdEntityResponse.json()) as MythologyEntity;

  const deleteResponse = await test.step('Delete the created entity', async () =>
    deleteMythologyEntity(request, token, createdEntity.id),
  );

  expect(deleteResponse.status()).toBe(204);

  const getResponse = await test.step('Verify entity is no longer available', async () =>
    getMythologyById(request, createdEntity.id),
  );

  expect(getResponse.status()).toBe(404);
});
