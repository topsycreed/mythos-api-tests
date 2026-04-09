import { expect, test } from '@playwright/test';

import { getMythologyById, getMythologyList, type MythologyEntity } from '../../src/api/mythology';
import {
  mythologyCategories,
  notFoundMythologyEntityId,
} from '../support/mythology-test-data';

test(
  'GET /mythology returns successful JSON response',
  { tag: ['@read', '@smoke'] },
  async ({ request }) => {
    const response = await test.step('Fetch mythology list', async () => getMythologyList(request));

    await expect(response).toBeOK();
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await test.step(
      'Read mythology list response',
      async () => (await response.json()) as MythologyEntity[],
    );

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  },
);

for (const category of mythologyCategories) {
  test(
    `GET /mythology?category=${category} returns only ${category}`,
    { tag: '@read' },
    async ({ request }) => {
      const response = await test.step(`Fetch mythology list filtered by ${category}`, async () =>
        getMythologyList(request, { category }),
      );

      await expect(response).toBeOK();

      const body = await test.step(
        'Read filtered mythology list response',
        async () => (await response.json()) as MythologyEntity[],
      );

      expect(Array.isArray(body)).toBe(true);

      for (const entity of body) {
        expect(entity.category).toBe(category);
      }
    },
  );
}

test(
  'GET /mythology?sort=asc and sort=desc return the same entities in opposite order',
  { tag: '@read' },
  async ({ request }) => {
    const ascResponse = await test.step('Fetch mythology list sorted ascending', async () =>
      getMythologyList(request, { sort: 'asc' }),
    );
    const descResponse = await test.step('Fetch mythology list sorted descending', async () =>
      getMythologyList(request, { sort: 'desc' }),
    );

    await expect(ascResponse).toBeOK();
    await expect(descResponse).toBeOK();

    const ascEntities = await test.step(
      'Read ascending mythology list response',
      async () => (await ascResponse.json()) as MythologyEntity[],
    );
    const descEntities = await test.step(
      'Read descending mythology list response',
      async () => (await descResponse.json()) as MythologyEntity[],
    );

    expect(ascEntities.length).toBe(descEntities.length);

    const ascIds = ascEntities.map((entity) => entity.id).sort((left, right) => left - right);
    const descIds = descEntities.map((entity) => entity.id).sort((left, right) => left - right);

    expect(ascIds).toEqual(descIds);

    const ascNames = ascEntities.map((entity) => entity.name);
    const descNames = descEntities.map((entity) => entity.name);

    expect(ascNames).not.toEqual(descNames);
    expect(ascNames.slice(0, 10)).toEqual(descNames.slice(-10).reverse());
  },
);

test('GET /mythology/{id} returns an existing entity', { tag: '@read' }, async ({ request }) => {
  const existingEntity = await test.step('Load mythology list and select an existing entity', async () => {
    const listResponse = await getMythologyList(request);
    await expect(listResponse).toBeOK();

    const entities = (await listResponse.json()) as MythologyEntity[];
    expect(entities.length).toBeGreaterThan(0);

    return entities[0] as MythologyEntity;
  });

  const response = await test.step('Fetch the selected entity by id', async () =>
    getMythologyById(request, existingEntity.id),
  );

  await expect(response).toBeOK();

  const entity = await test.step(
    'Read mythology entity response',
    async () => (await response.json()) as MythologyEntity,
  );

  expect(entity.id).toBe(existingEntity.id);
  expect(entity.name).toBe(existingEntity.name);
  expect(entity.category).toBe(existingEntity.category);
  expect(entity.desc).toBe(existingEntity.desc);
});

test('GET /mythology/{id} returns 404 for a non-existent entity', { tag: '@read' }, async ({ request }) => {
  const response = await test.step('Fetch a non-existent mythology entity by id', async () =>
    getMythologyById(request, notFoundMythologyEntityId),
  );

  expect(response.status()).toBe(404);
});
