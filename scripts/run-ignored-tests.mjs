import { spawnSync } from 'node:child_process';

// На Windows npx запускается через npx.cmd, поэтому runner делает кроссплатформенный выбор команды.
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// spawnSync удобен для маленького utility-скрипта:
// мы блокируемся до завершения дочернего процесса и потом возвращаем его exit code наверх.
const result = spawnSync(npxCommand, ['playwright', 'test', '--grep', '@ignore'], {
  cwd: process.cwd(),
  env: {
    // Клонируем текущее окружение и точечно включаем ignored tests.
    ...process.env,
    PW_INCLUDE_IGNORE: '1',
  },
  shell: false,
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  // Важно вернуть тот же код завершения, чтобы npm и CI корректно поняли, что тест упал.
  process.exit(result.status);
}

process.exit(1);
