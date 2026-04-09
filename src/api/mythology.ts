import type { APIRequestContext, APIResponse } from '@playwright/test';

export type MythologyCategory = 'gods' | 'heroes' | 'creatures';

export type MythologyEntity = {
  id: number;
  name: string;
  category: MythologyCategory;
  desc: string;
  img?: string;
};

export type CreateMythologyPayload = Omit<MythologyEntity, 'id'>;
export type UpdateMythologyPayload = CreateMythologyPayload;
export type PatchMythologyPayload = Partial<CreateMythologyPayload>;

const createEntitySuffix = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

export const createMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload => ({
  name: `Playwright entity ${createEntitySuffix()}`,
  category: 'heroes',
  desc: 'Created by Playwright API tests.',
  ...overrides,
});

const createAuthHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

export const getMythologyById = (
  request: APIRequestContext,
  id: number,
): Promise<APIResponse> => request.get(`mythology/${id}`);

export const createMythologyEntity = (
  request: APIRequestContext,
  token: string,
  payload: CreateMythologyPayload,
): Promise<APIResponse> =>
  request.post('mythology', {
    data: payload,
    headers: createAuthHeaders(token),
  });

export const replaceMythologyEntity = (
  request: APIRequestContext,
  token: string,
  id: number,
  payload: UpdateMythologyPayload,
): Promise<APIResponse> =>
  request.put(`mythology/${id}`, {
    data: payload,
    headers: createAuthHeaders(token),
  });

export const patchMythologyEntity = (
  request: APIRequestContext,
  token: string,
  id: number,
  payload: PatchMythologyPayload,
): Promise<APIResponse> =>
  request.patch(`mythology/${id}`, {
    data: payload,
    headers: createAuthHeaders(token),
  });

export const deleteMythologyEntity = (
  request: APIRequestContext,
  token: string,
  id: number,
): Promise<APIResponse> =>
  request.delete(`mythology/${id}`, {
    headers: createAuthHeaders(token),
  });
