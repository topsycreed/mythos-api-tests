import type {
  CreateMythologyPayload,
  MythologyCategory,
  MythologyEntity,
  PatchMythologyPayload,
} from '../../src/api/mythology';

type InvalidCreateMythologyCase = {
  name: string;
  payload: CreateMythologyPayload;
};

const createEntitySuffix = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

export const mythologyCategories = ['gods', 'heroes', 'creatures'] as const satisfies readonly MythologyCategory[];
export const mythologySortDirections = ['asc', 'desc'] as const;
export const protectedSystemEntityIds = [1, 31] as const;

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
  category: entity.category,
});

export const invalidCreateMythologyCases: InvalidCreateMythologyCase[] = [
  {
    name: 'empty name',
    payload: createMythologyPayload({
      desc: 'Missing name should trigger validation error.',
      name: '',
    }),
  },
];
