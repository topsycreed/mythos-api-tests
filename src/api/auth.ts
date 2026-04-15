import type { APIRequestContext, APIResponse } from "@playwright/test";

import { env } from "../config/env";

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

const REGISTER_USERNAME_PREFIX = "playwright_user";
export const DEFAULT_TEST_PASSWORD = "Playwright123!";

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
    .padStart(6, "0");

  return `${timestamp}_${randomPart}`;
};

export const getConfiguredCredentials = (): AuthCredentials => ({
  username: requireEnvValue(env.username, "USERNAME"),
  password: requireEnvValue(env.password, "PASSWORD"),
});

export const createUniqueCredentials = (
  password = DEFAULT_TEST_PASSWORD,
): AuthCredentials => ({
  username: `${REGISTER_USERNAME_PREFIX}_${createUsernameSuffix()}`,
  password,
});

export const createUniqueCredentialsFromEnv = (): AuthCredentials => {
  const password = requireEnvValue(env.password, "PASSWORD");

  return createUniqueCredentials(password);
};

export const registerUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  request.post("register", {
    data: credentials,
  });

export const loginUser = (
  request: APIRequestContext,
  credentials: AuthCredentials,
): Promise<APIResponse> =>
  request.post("login", {
    data: credentials,
  });

export const createAuthSession = async (
  request: APIRequestContext,
): Promise<AuthSession> => {
  const credentials = getConfiguredCredentials();

  const loginResponse = await loginUser(request, credentials);

  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed for configured USERNAME/PASSWORD: ${loginResponse.status()} ${await loginResponse.text()}`,
    );
  }

  const body = (await loginResponse.json()) as LoginResponseBody;

  return {
    credentials,
    token: body.token,
  };
};
