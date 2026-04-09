import type { APIRequestContext, APIResponse } from '@playwright/test';

import { env } from '../config/env';

export type AuthCredentials = {
  username: string;
  password: string;
};

export type RegisterResponseBody = {
  message: string;
};

export type LoginResponseBody = {
  token: string;
};

export type AuthSession = {
  credentials: AuthCredentials;
  token: string;
};

const requireEnvValue = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const createUsernameSuffix = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

export const getConfiguredCredentials = (): AuthCredentials => ({
  username: requireEnvValue(env.username, 'USERNAME'),
  password: requireEnvValue(env.password, 'PASSWORD'),
});

export const createUniqueCredentialsFromEnv = (): AuthCredentials => {
  const configuredCredentials = getConfiguredCredentials();

  return {
    username: `${configuredCredentials.username}_${createUsernameSuffix()}`,
    password: configuredCredentials.password,
  };
};

export const registerUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  request.post('register', {
    data: credentials,
  });

export const loginUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  request.post('login', {
    data: credentials,
  });

export const createAuthSession = async (request: APIRequestContext): Promise<AuthSession> => {
  const credentials = createUniqueCredentialsFromEnv();

  const registerResponse = await registerUser(request, credentials);

  if (!registerResponse.ok()) {
    throw new Error(`Register failed: ${registerResponse.status()} ${await registerResponse.text()}`);
  }

  const loginResponse = await loginUser(request, credentials);

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
  }

  const body = (await loginResponse.json()) as LoginResponseBody;

  return {
    credentials,
    token: body.token,
  };
};
