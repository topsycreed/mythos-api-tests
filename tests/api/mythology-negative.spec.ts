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
      expectApiErrorBodyContract(body, 401, 'Доступ запрещен. Нужен токен.');;
    });
  }

  /**
   * INVALID PAYLOAD CASES (400 Bad Request)
   */
  for (const testCase of invalidCreateMythologyCases) {
    test(`POST /mythology returns 400 for ${testCase.name}`, { tag: '@negative' }, async ({ mythologyApiClient, debugApiCall }) => {
      const response = await debugApiCall(
        { label: `Submit invalid create payload: ${testCase.name}`, request: { method: 'POST', url: 'mythology', body: testCase.payload } },
        () => mythologyApiClient.create(testCase.payload)
      );

      const body = await response.json();

      expect(response.status()).toBe(400);
      expectApiErrorBodyContract(body, 400, "Поля name и category обязательны.");
    });
  }

  for (const { method, run } of nonExistentCases) {
    test(`${method} /mythology/{id} returns 404 for non-existent entity`, { tag: '@negative' },
      async ({ mythologyApiClient, debugApiCall }) => {
        const response = await debugApiCall(
          { label: `${method} non-existent`, request: { method, url: `mythology/${nonExistentId}` } },
          () => run(mythologyApiClient, nonExistentId)
        );

        const body = await response.json();

        expect(response.status()).toBe(404);
        expectApiErrorBodyContract(body, 404, "Персонаж не найден");
      });
  }

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
   * METHOD NOT ALLOWED (405)
   * Checks that the server rejects invalid HTTP verbs for specific endpoints.
   */

  test('POST /mythology/{id} returns 405 Method Not Allowed', { tag: '@negative' },
    async ({ mythologyApiClient, mythologyEntityManager, debugApiCall }) => {
      const entity = await mythologyEntityManager.create();

      const response = await debugApiCall(
        {
          label: 'Send not Allowed method', request: {
            method: 'POST',
            url: `mythology/${entity.id}`,
            body: { name: 'Invalid' }
          }
        },
        () => mythologyApiClient.postToItem(entity.id, { name: 'I should fail' })
      );

      expect(response.status()).toBe(405);
      expectApiErrorMethodNotAllowed(await response.json());
    });


  /**
   * 3. PROTECTED SYSTEM ENTITIES (403 Forbidden)
   */
  for (const id of protectedSystemEntityIds) {
    test(`Update/Delete returns 403 for protected entity ${id}`, { tag: '@negative' }, async ({ mythologyApiClient, debugApiCall }) => {
      // Test PUT 403
      const putRes = await debugApiCall(
        { label: `Try to replace protected ${id}`, request: { method: 'PUT', url: `mythology/${id}` } },
        () => mythologyApiClient.update(id, createMythologyPayload())
      );
      expect(putRes.status()).toBe(403);
      expectApiErrorBodyContract(await putRes.json(), 403, "Запрещено! Базовые персонажи (ID 1-31) доступны только для чтения.");

      // Test DELETE 403
      const delRes = await debugApiCall(
        { label: `Try to delete protected ${id}`, request: { method: 'DELETE', url: `mythology/${id}` } },
        () => mythologyApiClient.delete(id)
      );
      expect(delRes.status()).toBe(403);
      expectApiErrorBodyContract(await delRes.json(), 403, "Запрещено! Базовые персонажи (ID 1-31) доступны только для чтения.");
    });
  }
});

