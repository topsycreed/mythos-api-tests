import {
  createUniqueCredentialsFromEnv,
  loginUser,
  registerUser,
  type LoginResponseBody,
  type RegisterResponseBody,
} from '../../src/api/auth';
import { expect, test } from '../fixtures/api-test';
import {
  expectJsonContentType,
  expectLoginResponseContract,
  expectRegisterResponseContract,
} from '../support/contract-assertions';

// Auth endpoint чувствителен к burst-запросам, поэтому внутри файла тесты выполняются последовательно.
test.describe.configure({ mode: 'serial' });

test('POST /register creates a new user', { tag: '@auth' }, async ({ request, debugApiCall }) => {
  // test.step делает прогон читабельнее в list reporter, html report и trace.
  const credentials = await test.step('Generate unique credentials', async () =>
    createUniqueCredentialsFromEnv(),
  );

  const response = await test.step('Register a new user', async () =>
    debugApiCall(
      {
        label: 'Register a new user',
        request: {
          method: 'POST',
          url: 'register',
          body: credentials,
        },
      },
      () => registerUser(request, credentials),
    ),
  );

  await expect(response).toBeOK();
  // Сначала проверяем transport-level контракт: статус и content-type.
  expect(response.status()).toBe(201);
  expectJsonContentType(response);

  const body = await test.step(
    'Read registration response body',
    async () => (await response.json()) as RegisterResponseBody,
  );

  // Потом уже business/contract-level контракт тела ответа.
  expectRegisterResponseContract(body);
});

test('POST /login returns a JWT token for a registered user', { tag: '@auth' }, async ({
  request,
  debugApiCall,
}) => {
  const credentials = await test.step('Generate unique credentials', async () =>
    createUniqueCredentialsFromEnv(),
  );

  const registerResponse = await test.step('Register the user before login', async () =>
    debugApiCall(
      {
        label: 'Register the user before login',
        request: {
          method: 'POST',
          url: 'register',
          body: credentials,
        },
      },
      () => registerUser(request, credentials),
    ),
  );
  await expect(registerResponse).toBeOK();

  // Логин здесь использует только что зарегистрированного пользователя, чтобы проверить полный auth flow end-to-end.
  const loginResponse = await test.step('Log in with the registered user', async () =>
    debugApiCall(
      {
        label: 'Log in with the registered user',
        request: {
          method: 'POST',
          url: 'login',
          body: credentials,
        },
      },
      () => loginUser(request, credentials),
    ),
  );

  await expect(loginResponse).toBeOK();
  expectJsonContentType(loginResponse);

  const body = await test.step(
    'Read login response body',
    async () => (await loginResponse.json()) as LoginResponseBody,
  );

  expectLoginResponseContract(body);
});
