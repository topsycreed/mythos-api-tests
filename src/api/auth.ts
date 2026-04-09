import type { APIRequestContext, APIResponse } from '@playwright/test';

import { env } from '../config/env';

// Доменные типы auth-слоя помогают сделать контракт явным еще до реального вызова API.
export type AuthCredentials = {
  username: string;
  password: string;
};

// Тело успешного ответа регистрации.
export type RegisterResponseBody = {
  message: string;
};

// Тело успешного ответа логина.
export type LoginResponseBody = {
  token: string;
};

// Удобный aggregate-тип для уже авторизованной сессии.
export type AuthSession = {
  credentials: AuthCredentials;
  token: string;
};

// Для register-тестов нужен фиксированный безопасный префикс, а не реальные данные из env.
const REGISTER_USERNAME_PREFIX = 'playwright_user';

// fail-fast helper: если обязательной env-переменной нет,
// тесты должны упасть сразу с понятной причиной, а не позже и неявно.
const requireEnvValue = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const createUsernameSuffix = (): string => {
  // Timestamp + случайный хвост снижают риск коллизий при массовом создании тестовых пользователей.
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

// Здесь reusable user берется строго из .env и используется для login-only сценариев.
export const getConfiguredCredentials = (): AuthCredentials => ({
  username: requireEnvValue(env.username, 'USERNAME'),
  password: requireEnvValue(env.password, 'PASSWORD'),
});

// Генерирует уникальные credentials для register-тестов.
export const createUniqueCredentialsFromEnv = (): AuthCredentials => {
  // Для register-тестов пароль можно переиспользовать, а username должен быть уникальным.
  const password = requireEnvValue(env.password, 'PASSWORD');

  return {
    username: `${REGISTER_USERNAME_PREFIX}_${createUsernameSuffix()}`,
    password,
  };
};

export const registerUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  // Playwright сам сериализует объект из data в JSON и выставляет нужный content-type.
  request.post('register', {
    data: credentials,
  });

// Обертка над POST /login.
export const loginUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  request.post('login', {
    data: credentials,
  });

export const createAuthSession = async (request: APIRequestContext): Promise<AuthSession> => {
  // Utility auth flow для protected suites больше не регистрирует новых пользователей,
  // а только логинится существующим reusable user из env.
  const credentials = getConfiguredCredentials();

  const loginResponse = await loginUser(request, credentials);

  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed for configured USERNAME/PASSWORD: ${loginResponse.status()} ${await loginResponse.text()}`,
    );
  }

  // До этого места код знает только то, что transport-level ответ успешен.
  // Теперь можно безопасно парсить бизнес-данные.
  const body = (await loginResponse.json()) as LoginResponseBody;

  return {
    credentials,
    token: body.token,
  };
};
