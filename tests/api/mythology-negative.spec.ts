import {
  createIncompletePutPayload,
  createMythologyPayload,
  invalidCreateMythologyCases,
  protectedSystemEntityIds,
} from '../support/mythology-test-data';
import {
  expectApiErrorBodyContract,
  expectApiErrorMethodNotAllowed,
  expectJsonContentType,
} from '../support/contract-assertions';
import { MythologyApiClient } from '../../src/api/MythologyApiClient';
import { expect, test } from '../fixtures/api-test';

test.describe.configure({ mode: 'serial' });

test.describe('Mythology Security & Validation (Negative Cases)', () => {

  const nonExistentId = 999111;

  const unauthorizedMutationCases = [
    { name: 'POST', run: (client: MythologyApiClient) => client.create(createMythologyPayload()) },
    { name: 'PUT', run: (client: MythologyApiClient) => client.update(protectedSystemEntityIds[0]!, createMythologyPayload()) },
    { name: 'PATCH', run: (client: MythologyApiClient) => client.patch(protectedSystemEntityIds[15]!, { desc: 'Unauthorized' }) },
    { name: 'DELETE', run: (client: MythologyApiClient) => client.delete(protectedSystemEntityIds[protectedSystemEntityIds.length - 1]!) },
  ];

  const nonExistentCases = [
    { method: 'PUT', run: (c: MythologyApiClient, id: number) => c.update(id, createMythologyPayload()) },
    { method: 'PATCH', run: (c: MythologyApiClient, id: number) => c.patch(id, { desc: 'Void' }) },
    { method: 'DELETE', run: (c: MythologyApiClient, id: number) => c.delete(id) },
  ];

  /**
   *  Unauthorized access (401)
   */
  for (const { name, run } of unauthorizedMutationCases) {
    test(`${name} /mythology returns 401 without JWT token`, { tag: '@negative' }, async ({ request, debugApiCall }) => {
      const noAuthClient = new MythologyApiClient(request);
      const response = await debugApiCall(
        { label: `Unauthorized ${name} attempt`, request: { method: name, url: 'mythology' } },
        () => run(noAuthClient)
      );
      const body = await response.json();

      expect(response.status()).toBe(401);
      expectJsonContentType(response);
      expectApiErrorBodyContract(body, 401, 'Доступ запрещен. Нужен токен.');
    });
  }

  /**
   * Non-existent entities (404)
   */
  for (const { method, run } of nonExistentCases) {
    test(`${method} /mythology/{id} returns 404 for non-existent entity`, { tag: '@negative' }, async ({ mythologyApiClient, debugApiCall }) => {
      const response = await debugApiCall(
        { label: `${method} non-existent`, request: { method, url: `mythology/${nonExistentId}` } },
        () => run(mythologyApiClient, nonExistentId)
      );
      const body = await response.json();
      expect(response.status()).toBe(404);
      expectApiErrorBodyContract(body, 404, "Персонаж не найден");
    });
  }

  /**
   * Payload Validation (400)
   */
  test('PUT /mythology/{id} returns 400 when full payload is not provided', { tag: '@negative' }, async ({ mythologyApiClient, mythologyEntityManager, debugApiCall }) => {
    const entity = await mythologyEntityManager.create();
    const incompletePayload = createIncompletePutPayload(entity);

    const response = await debugApiCall(
      { label: 'Send incomplete PUT payload', request: { method: 'PUT', url: `mythology/${entity.id}`, body: incompletePayload } },
      () => mythologyApiClient.update(entity.id, incompletePayload)
    );
    const body = await response.json();
    expect(response.status()).toBe(400);
    expectApiErrorBodyContract(body, 400, "Для PUT запроса необходимо передать все поля: name, category, desc.");
  });

  /**
   * Method Not Allowed (405)
   */
  test('POST /mythology/{id} returns 405 Method Not Allowed', { tag: '@negative' }, async ({ mythologyApiClient, mythologyEntityManager, debugApiCall }) => {
    const entity = await mythologyEntityManager.create();
    const response = await debugApiCall(
      { label: 'Send not Allowed method', request: { method: 'POST', url: `mythology/${entity.id}`, body: { name: 'Invalid' } } },
      () => mythologyApiClient.postToItem(entity.id, { name: 'I should fail' })
    );
    expect(response.status()).toBe(405);
    expectApiErrorMethodNotAllowed(await response.json());
  });

  /**
   * Protected Entities (403)
   */
  for (const id of protectedSystemEntityIds) {
    test(`Update/Delete returns 403 for protected entity ${id}`, { tag: '@negative' }, async ({ mythologyApiClient, debugApiCall }) => {
      const putRes = await debugApiCall(
        { label: `Try to replace protected ${id}`, request: { method: 'PUT', url: `mythology/${id}` } },
        () => mythologyApiClient.update(id, createMythologyPayload())
      );
      expect(putRes.status()).toBe(403);
      expectApiErrorBodyContract(await putRes.json(), 403, "Запрещено! Базовые персонажи (ID 1-31) доступны только для чтения.");

      const delRes = await debugApiCall(
        { label: `Try to delete protected ${id}`, request: { method: 'DELETE', url: `mythology/${id}` } },
        () => mythologyApiClient.delete(id)
      );
      expect(delRes.status()).toBe(403);
      expectApiErrorBodyContract(await delRes.json(), 403, "Запрещено! Базовые персонажи (ID 1-31) доступны только для чтения.");
    });
  }

  /**
   * Expanded Data-Driven Validation
   */
  test.describe('Expanded Data-Driven Validation', () => {
    for (const { name, payload, expectedStatus, expectedMessage } of invalidCreateMythologyCases) {
      test(`POST /mythology returns ${expectedStatus} for ${name}`, { tag: '@negative' }, async ({ mythologyApiClient }) => {
        const response = await mythologyApiClient.create(payload);
        const body = await response.json();
        expect(response.status()).toBe(expectedStatus);
        expectApiErrorBodyContract(body, expectedStatus, expectedMessage);
      });
    }
  });

  /**
   * Improved Scenarios
   */
  test.describe('Improved Scenarios', () => {
    test('Combined query parameters and contract check', { tag: '@negative' }, async ({ mythologyApiClient }) => {
      const response = await mythologyApiClient.get({ category: 'gods', sort: 'desc' });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(Array.isArray(body)).toBeTruthy();

      body.forEach((item: any) => {
        expect(item.category).toBe('gods');
        expect(item).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          category: 'gods'
        });
      });
    });

    test('Sorting validation (DESC)', { tag: '@negative' }, async ({ mythologyApiClient }) => {
      const response = await mythologyApiClient.get({ sort: 'desc' });
      const body = await response.json();

      const names = body
        .map((item: any) => item.name.toLowerCase())
        .filter((name: string) => /^[a-zа-я]/.test(name));

      for (let i = 0; i < names.length - 1; i++) {
        const current = names[i];
        const next = names[i + 1];

        const isValidOrder = current.localeCompare(next, 'en') >= 0;

        expect(isValidOrder, `Sort Error: "${current}" should be before "${next}" in DESC order`).toBe(true);
      }
    });
  });

}); 