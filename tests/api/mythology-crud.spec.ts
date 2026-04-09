import {
  createMythologyEntity,
  deleteMythologyEntity,
  getMythologyById,
  patchMythologyEntity,
  replaceMythologyEntity,
  type MythologyEntity,
} from '../../src/api/mythology';
import { expect, test } from '../fixtures/api-test';
import {
  createMythologyPayload,
  createPatchMythologyPayload,
  createReplacementMythologyPayload,
} from '../support/mythology-test-data';
import {
  expectJsonContentType,
  expectMythologyEntityContract,
} from '../support/contract-assertions';

test.describe.configure({ mode: 'serial' });

test('POST /mythology creates a new entity', { tag: '@crud' }, async ({
  request,
  authToken,
  mythologyEntityManager,
}) => {
  const payload = createMythologyPayload();

  const response = await test.step('Create a mythology entity', async () =>
    createMythologyEntity(request, authToken, payload),
  );

  await expect(response).toBeOK();
  expect(response.status()).toBe(201);
  expectJsonContentType(response);

  const createdEntity = await test.step(
    'Read created entity response',
    async () => (await response.json()) as MythologyEntity,
  );

  mythologyEntityManager.track(createdEntity.id);

  expectMythologyEntityContract(createdEntity);
  expect(createdEntity.id).toEqual(expect.any(Number));
  expect(createdEntity).toMatchObject(payload);
});

test('PATCH /mythology/{id} updates selected fields', { tag: '@crud' }, async ({
  request,
  authToken,
  mythologyEntityManager,
}) => {
  const createdEntity = await test.step('Create entity for patch test', async () =>
    mythologyEntityManager.create(),
  );
  const patchPayload = createPatchMythologyPayload();

  const patchResponse = await test.step('Patch selected fields', async () =>
    patchMythologyEntity(request, authToken, createdEntity.id, patchPayload),
  );

  await expect(patchResponse).toBeOK();
  expect(patchResponse.status()).toBe(200);

  const getResponse = await test.step('Fetch entity after patch', async () =>
    getMythologyById(request, createdEntity.id),
  );
  await expect(getResponse).toBeOK();
  expectJsonContentType(getResponse);

  const updatedEntity = (await getResponse.json()) as MythologyEntity;

  expectMythologyEntityContract(updatedEntity);
  expect(updatedEntity.id).toBe(createdEntity.id);
  expect(updatedEntity.name).toBe(createdEntity.name);
  expect(updatedEntity.category).toBe(createdEntity.category);
  expect(updatedEntity.desc).toBe(patchPayload.desc);
});

test('PUT /mythology/{id} replaces entity fields', { tag: '@crud' }, async ({
  request,
  authToken,
  mythologyEntityManager,
}) => {
  const createdEntity = await test.step('Create entity for put test', async () =>
    mythologyEntityManager.create(),
  );
  const replacementPayload = createReplacementMythologyPayload();

  const putResponse = await test.step('Replace all entity fields', async () =>
    replaceMythologyEntity(request, authToken, createdEntity.id, replacementPayload),
  );

  await expect(putResponse).toBeOK();
  expect(putResponse.status()).toBe(200);

  const getResponse = await test.step('Fetch entity after put', async () =>
    getMythologyById(request, createdEntity.id),
  );
  await expect(getResponse).toBeOK();
  expectJsonContentType(getResponse);

  const updatedEntity = (await getResponse.json()) as MythologyEntity;

  expectMythologyEntityContract(updatedEntity);
  expect(updatedEntity.id).toBe(createdEntity.id);
  expect(updatedEntity).toMatchObject(replacementPayload);
});

test('DELETE /mythology/{id} removes a created entity', { tag: '@crud' }, async ({
  request,
  authToken,
  mythologyEntityManager,
}) => {
  const createdEntity = await test.step('Create entity for delete test', async () =>
    mythologyEntityManager.create(),
  );

  const deleteResponse = await test.step('Delete the created entity', async () =>
    deleteMythologyEntity(request, authToken, createdEntity.id),
  );

  expect(deleteResponse.status()).toBe(204);

  const getResponse = await test.step('Verify entity is no longer available', async () =>
    getMythologyById(request, createdEntity.id),
  );

  expect(getResponse.status()).toBe(404);
});
