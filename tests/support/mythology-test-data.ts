import type {
  CreateMythologyPayload,
  MythologyCategory,
  MythologyEntity,
  MythologySortDirection,
  PatchMythologyPayload,
} from '../../src/api/mythology';

type InvalidCreateMythologyCase = {
  name: string;
  payload: CreateMythologyPayload;
};

const createEntitySuffix = (): string => {
  // Генерация уникального suffix делает фабрики безопасными для повторных прогонов.
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

// as const фиксирует литералы как readonly tuple, а satisfies дополнительно проверяет,
// что список реально соответствует доменному типу MythologyCategory.
export const mythologyCategories = ['gods', 'heroes', 'creatures'] as const satisfies readonly MythologyCategory[];
// Возможные направления сортировки для read-тестов.
export const mythologySortDirections =
  ['asc', 'desc'] as const satisfies readonly MythologySortDirection[];
// Системные сущности, которые обычный пользователь не должен модифицировать.
export const protectedSystemEntityIds = [1, 31] as const;
// Заведомо отсутствующий id для 404-сценариев.
export const notFoundMythologyEntityId = 999_999_999;

// Сервер может вернуть category как произвольную строку, но в request мы обязаны отправлять только допустимый union.
const toRequestCategory = (value: string): MythologyCategory =>
  mythologyCategories.find((category) => category === value) ?? 'heroes';

// Базовая фабрика валидного payload для create-сценариев.
export const createMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload => ({
  name: `Playwright entity ${createEntitySuffix()}`,
  category: 'heroes',
  desc: 'Created by Playwright API tests.',
  // overrides + spread-оператор создают паттерн test data factory:
  // базовые валидные данные задаются по умолчанию, а в тесте меняются только нужные поля.
  ...overrides,
});

export const createReplacementMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload =>
  // Отдельная фабрика replacement payload делает PUT-сценарии нагляднее.
  createMythologyPayload({
    category: 'gods',
    desc: 'Replaced by Playwright put test.',
    name: `Playwright replacement ${createEntitySuffix()}`,
    ...overrides,
  });

export const createPatchMythologyPayload = (
  overrides: PatchMythologyPayload = {},
): PatchMythologyPayload => ({
  desc: 'Updated by Playwright patch test.',
  // Для PATCH особенно удобно иметь фабрику с дефолтным валидным кусочком данных.
  ...overrides,
});

export const createIncompletePutPayload = (
  entity: MythologyEntity,
): Pick<CreateMythologyPayload, 'name' | 'category'> => ({
  // Pick<T, K> позволяет вернуть только часть структуры и тем самым смоделировать невалидный PUT.
  name: entity.name,
  category: toRequestCategory(entity.category),
});

// Negative cases задаются как данные, а не как копипаста тестов — это основа data-driven подхода.
export const invalidCreateMythologyCases: InvalidCreateMythologyCase[] = [
  {
    name: 'empty name',
    payload: createMythologyPayload({
      desc: 'Missing name should trigger validation error.',
      name: '',
    }),
  },
];
