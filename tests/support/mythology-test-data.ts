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
  expectedMessage: string
  expectedStatus: number
};

const createEntitySuffix = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

export const mythologyCategories = ['gods', 'heroes', 'creatures'] as const satisfies readonly MythologyCategory[];
export const mythologySortDirections =
  ['asc', 'desc'] as const satisfies readonly MythologySortDirection[];
export const protectedSystemEntityIds = Array.from({ length: 31 }, (_, i) => i + 1);
export const notFoundMythologyEntityId = 999_999_999;

const toRequestCategory = (value: string): MythologyCategory =>
  mythologyCategories.find((category) => category === value) ?? 'heroes';

export const createMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload => ({
  name: `Playwright entity ${createEntitySuffix()}`,
  category: 'heroes',
  desc: 'Created by Playwright API tests.',
  ...overrides,
});

export const createReplacementMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload =>
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
  ...overrides,
});

export const createIncompletePutPayload = (
  entity: MythologyEntity,
): Pick<CreateMythologyPayload, 'name' | 'category'> => ({
  name: entity.name,
  category: toRequestCategory(entity.category),
});


export const invalidCreateMythologyCases: InvalidCreateMythologyCase[] = [
  {
    name: 'Empty name',
    payload: createMythologyPayload({ name: '' }),
    expectedStatus: 400,
    expectedMessage: 'Поля name и category обязательны.',
  },
  {
    name: 'null category',
    payload: createMythologyPayload({ category: null as any }),
    expectedStatus: 400,
    expectedMessage: "Поля name и category обязательны.",
  },
  {
    name: 'Missing name field',
    payload: (() => {
      const p = createMythologyPayload();
      delete (p as any).name;
      return p;
    })(),
    expectedStatus: 400,
    expectedMessage: 'Поля name и category обязательны.',
  },
  {
    name: 'Long name',
    payload: createMythologyPayload({ name: 'A'.repeat(501) }),
    expectedStatus: 500,
    expectedMessage: 'Ошибка при создании записи',
  }
];