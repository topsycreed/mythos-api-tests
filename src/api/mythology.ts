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

const createAuthHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

export const getMythologyById = (
  request: APIRequestContext,
  id: number,
): Promise<APIResponse> => request.get(`mythology/${id}`);

export const createMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  payload: CreateMythologyPayload,
): Promise<APIResponse> =>
  request.post('mythology', {
    data: payload,
  });

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

export const replaceMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  id: number,
  payload: UpdateMythologyPayload,
): Promise<APIResponse> =>
  request.put(`mythology/${id}`, {
    data: payload,
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

export const patchMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  id: number,
  payload: PatchMythologyPayload,
): Promise<APIResponse> =>
  request.patch(`mythology/${id}`, {
    data: payload,
  });

export const deleteMythologyEntity = (
  request: APIRequestContext,
  token: string,
  id: number,
): Promise<APIResponse> =>
  request.delete(`mythology/${id}`, {
    headers: createAuthHeaders(token),
  });

export const deleteMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  id: number,
): Promise<APIResponse> => request.delete(`mythology/${id}`);
