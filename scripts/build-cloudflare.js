const { spawnSync } = require('node:child_process');
const path = require('node:path');

const isProduction = process.env.WORKERS_CI_BRANCH === 'main';
const sourceVariable = isProduction
  ? 'NEXT_PUBLIC_API_URL_PROD'
  : 'NEXT_PUBLIC_API_URL_DEV';
const apiUrl = process.env[sourceVariable];

if (!apiUrl) {
  console.error(`Missing required build variable: ${sourceVariable}`);
  process.exit(1);
}

const cli = path.join(
  process.cwd(),
  'node_modules',
  '@opennextjs',
  'cloudflare',
  'dist',
  'cli',
  'index.js'
);

const result = spawnSync(process.execPath, [cli, 'build'], {
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error('Unable to start the OpenNext build.');
  process.exit(1);
}

process.exit(result.status ?? 1);
