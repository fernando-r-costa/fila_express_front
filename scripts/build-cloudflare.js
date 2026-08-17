const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const isProduction = process.env.WORKERS_CI_BRANCH === 'main';
const sourceVariable = isProduction
  ? 'NEXT_PUBLIC_API_URL_PROD'
  : 'NEXT_PUBLIC_API_URL_DEV';
const apiUrl = process.env[sourceVariable];

console.log(
  `[build:cloudflare] WORKERS_CI_BRANCH=${process.env.WORKERS_CI_BRANCH ?? '(undefined)'}`
);
console.log(`[build:cloudflare] isProduction=${isProduction}`);
console.log(`[build:cloudflare] sourceVariable=${sourceVariable}`);
console.log(
  `[build:cloudflare] parent NEXT_PUBLIC_API_URL defined=${Boolean(process.env.NEXT_PUBLIC_API_URL)}`
);

if (!apiUrl) {
  console.error(`Missing required build variable: ${sourceVariable}`);
  process.exit(1);
}

let selectedApiUrl;

try {
  selectedApiUrl = new URL(apiUrl);
} catch {
  console.error(`Invalid URL in build variable: ${sourceVariable}`);
  process.exit(1);
}

console.log(
  `[build:cloudflare] selected API hostname=${selectedApiUrl.hostname}`
);
console.log(
  `[build:cloudflare] selected API pathname=${selectedApiUrl.pathname}`
);

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

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const collectJavaScriptFiles = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
};

const clientBundleRoots = [
  path.join(process.cwd(), '.next', 'static'),
  path.join(process.cwd(), '.open-next', 'assets', '_next', 'static'),
];
const clientBundleFiles = clientBundleRoots.flatMap(collectJavaScriptFiles);
const devApiFileCount = clientBundleFiles.filter((file) =>
  fs.readFileSync(file, 'utf8').includes('frc-api-dev.onrender.com')
).length;
const prodApiFileCount = clientBundleFiles.filter((file) =>
  fs.readFileSync(file, 'utf8').includes('frc-api-latest.onrender.com')
).length;

console.log(
  `[build:cloudflare] bundle contains DEV API=${devApiFileCount > 0}`
);
console.log(
  `[build:cloudflare] bundle contains PROD API=${prodApiFileCount > 0}`
);
console.log(`[build:cloudflare] bundle DEV API file count=${devApiFileCount}`);
console.log(
  `[build:cloudflare] bundle PROD API file count=${prodApiFileCount}`
);

process.exit(0);
