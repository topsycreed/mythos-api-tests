import { spawnSync } from 'node:child_process';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCommand, ['playwright', 'test', '--grep', '@ignore'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PW_INCLUDE_IGNORE: '1',
  },
  shell: false,
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
