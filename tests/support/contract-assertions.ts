import { expect, type APIResponse } from '@playwright/test';

import {
  type LoginResponseBody,
  type RegisterResponseBody,
} from '../../src/api/auth';
import { type MythologyEntity } from '../../src/api/mythology';

type ApiErrorBody = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  success?: boolean;
};

function expectNonEmptyString(value: unknown): asserts value is string {
  expect(value).toEqual(expect.any(String));
  expect((value as string).length).toBeGreaterThan(0);
}

export function expectJsonContentType(response: APIResponse): void {
  expect(response.headers()['content-type']).toContain('application/json');
}

export function expectMythologyEntityContract(
  entity: unknown,
): asserts entity is MythologyEntity {
  expect(entity).toEqual(expect.any(Object));

  const candidate = entity as MythologyEntity;

  expect(candidate.id).toEqual(expect.any(Number));
  expectNonEmptyString(candidate.name);
  expectNonEmptyString(candidate.category);
  expectNonEmptyString(candidate.desc);

  if (candidate.img !== undefined && candidate.img !== null) {
    expect(candidate.img).toEqual(expect.any(String));
  }
}

export function expectMythologyEntityListContract(
  body: unknown,
): asserts body is MythologyEntity[] {
  expect(Array.isArray(body)).toBe(true);

  for (const entity of body as MythologyEntity[]) {
    expectMythologyEntityContract(entity);
  }
}

export function expectRegisterResponseContract(
  body: unknown,
): asserts body is RegisterResponseBody {
  expect(body).toEqual(expect.any(Object));

  const candidate = body as RegisterResponseBody;
  expectNonEmptyString(candidate.message);
}

export function expectLoginResponseContract(
  body: unknown,
): asserts body is LoginResponseBody {
  expect(body).toEqual(expect.any(Object));

  const candidate = body as LoginResponseBody;
  expectNonEmptyString(candidate.token);
  expect(candidate.token.split('.')).toHaveLength(3);
}

export function expectApiErrorBodyContract(
  body: unknown,
  expectedStatus: number,
  expectedError?: string,
  expectedMessage?: string | RegExp
): asserts body is ApiErrorBody {
  expect(body).toEqual(expect.any(Object));
  const candidate = body as ApiErrorBody;

  if (candidate.statusCode !== undefined) {
    expect(candidate.statusCode).toBe(expectedStatus);
  }
  if (expectedError) {
    expect(candidate.error).toBe(expectedError);
  }
  if (expectedMessage) {
    if (expectedMessage instanceof RegExp) {
      expect(candidate.message).toMatch(expectedMessage);
    } else {
      expect(candidate.message).toContain(expectedMessage);
    }
  }
}

export function expectApiErrorMethodNotAllowed(
  body: unknown,
): asserts body is ApiErrorBody {
  expectApiErrorBodyContract(body, 405, "Метод POST не поддерживается. Используйте GET, PUT, PATCH или DELETE.");

  const candidate = body as ApiErrorBody;

  if (candidate.success !== undefined) {
    expect(candidate.success, '405 response success flag should be false').toBe(false);
  }
}


