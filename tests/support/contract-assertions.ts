import { expect, type APIResponse } from '@playwright/test';

import {
  type LoginResponseBody,
  type RegisterResponseBody,
} from '../../src/api/auth';
import { type MythologyEntity } from '../../src/api/mythology';

type ApiErrorBody = {
  error?: string;
  message?: string;
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
): asserts body is ApiErrorBody {
  expect(body).toEqual(expect.any(Object));

  const candidate = body as ApiErrorBody;
  const hasError = typeof candidate.error === 'string' && candidate.error.length > 0;
  const hasMessage = typeof candidate.message === 'string' && candidate.message.length > 0;

  expect(hasError || hasMessage).toBe(true);

  if (candidate.success !== undefined) {
    expect(candidate.success).toEqual(expect.any(Boolean));
  }
}
