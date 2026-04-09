import type { APIRequestContext, APIResponse } from '@playwright/test';

// Literal union ограничивает допустимые значения category еще на уровне редактора и type-check.
export type MythologyCategory = 'gods' | 'heroes' | 'creatures';
// Категория в list query может быть конкретной или специальной all.
export type MythologyListCategory = MythologyCategory | 'all';
// Направление сортировки для read-сценариев.
export type MythologySortDirection = 'asc' | 'desc';

// Response contract не обязан быть равен request payload:
// например, id приходит только от сервера, а img может быть null.
export type MythologyEntity = {
  id: number;
  name: string;
  category: string;
  desc: string;
  img?: string | null;
};

export type CreateMythologyPayload = {
  name: string;
  category: MythologyCategory;
  desc: string;
  img?: string;
};
// В этом API PUT использует тот же набор полей, что и create.
export type UpdateMythologyPayload = CreateMythologyPayload;
// Partial<T> превращает все поля исходного типа в optional — это идеально для PATCH.
export type PatchMythologyPayload = Partial<CreateMythologyPayload>;

// Хедеры авторизации лучше собирать в одном месте, а не дублировать строку Bearer по всему проекту.
const createAuthHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

export const getMythologyList = (
  request: APIRequestContext,
  query?: {
    category?: MythologyListCategory;
    sort?: MythologySortDirection;
  },
): Promise<APIResponse> =>
  // Query-параметры передаются отдельным объектом params, а не строковой конкатенацией.
  request.get('mythology', {
    params: query,
  });

// Получает конкретную сущность по id.
export const getMythologyById = (
  request: APIRequestContext,
  id: number,
): Promise<APIResponse> => request.get(`mythology/${id}`);

export const createMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  payload: CreateMythologyPayload,
): Promise<APIResponse> =>
  // Separate without-auth helpers полезны для negative tests:
  // так не нужно усложнять основную функцию условным token | undefined.
  request.post('mythology', {
    data: payload,
  });

export const createMythologyEntity = (
  request: APIRequestContext,
  token: string,
  payload: CreateMythologyPayload,
): Promise<APIResponse> =>
  // Авторизованный POST /mythology для happy-path CRUD сценариев.
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
  // PUT в REST-семантике трактуется как полная замена сущности.
  request.put(`mythology/${id}`, {
    data: payload,
    headers: createAuthHeaders(token),
  });

export const replaceMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  id: number,
  payload: UpdateMythologyPayload,
): Promise<APIResponse> =>
  // Версия без токена нужна только для проверки 401 в negative suite.
  request.put(`mythology/${id}`, {
    data: payload,
  });

export const patchMythologyEntity = (
  request: APIRequestContext,
  token: string,
  id: number,
  payload: PatchMythologyPayload,
): Promise<APIResponse> =>
  // PATCH меняет только те поля, которые реально переданы в payload.
  request.patch(`mythology/${id}`, {
    data: payload,
    headers: createAuthHeaders(token),
  });

export const patchMythologyEntityWithoutAuth = (
  request: APIRequestContext,
  id: number,
  payload: PatchMythologyPayload,
): Promise<APIResponse> =>
  // PATCH without auth используется как отдельный negative helper.
  request.patch(`mythology/${id}`, {
    data: payload,
  });

// Авторизованный DELETE helper для cleanup и delete-тестов.
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
