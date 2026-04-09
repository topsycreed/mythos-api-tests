import { getMythologyList, type MythologyEntity } from '../../src/api/mythology';
import { expect, test } from '../fixtures/api-test';
import {
  expectJsonContentType,
  expectMythologyEntityListContract,
} from '../support/contract-assertions';

test(
  'Debug demo intentionally fails and attaches api-debug-log',
  { tag: '@ignore' },
  async ({ request, debugApiCall }) => {
    const response = await test.step('Fetch mythology list for debug demo', async () =>
      debugApiCall(
        {
          label: 'Debug demo: fetch mythology list',
          request: {
            method: 'GET',
            url: 'mythology',
          },
        },
        () => getMythologyList(request),
      ),
    );

    await expect(response).toBeOK();
    expectJsonContentType(response);

    const body = await test.step(
      'Read mythology list response for debug demo',
      async () => (await response.json()) as MythologyEntity[],
    );

    expectMythologyEntityListContract(body);
    expect(
      body.length,
      'Intentional failure: run this spec to verify api-debug-log attachments and reports.',
    ).toBe(0);
  },
);
