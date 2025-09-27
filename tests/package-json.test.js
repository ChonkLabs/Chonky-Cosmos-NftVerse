/**
 * NOTE: These tests use the Node.js built-in test runner (node:test) with strict assertions.
 * They validate the integrity, consistency, and expectations captured in package.json.
 */
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');

let packageJson;

const REQUIRED_SCRIPTS = [
  'dev',
  'dev:wrangler',
  'create-unrevealed-tokens',
  'reveal-tokens',
  'build',
  'lint',
  'lint:fix',
  'preview',
  'postinstall',
];

const REQUIRED_DEPENDENCIES = [
  '0xsequence',
  '@0xsequence/api',
  '@0xsequence/design-system',
  '@0xsequence/indexer',
  '@0xsequence/kit',
  '@0xsequence/kit-checkout',
  '@0xsequence/metadata',
  '@0xsequence/network',
  '@tanstack/react-query',
  'dotenv',
  'ethers',
  'react',
  'react-dom',
  'react-toastify',
  'viem',
  'wagmi',
];

const REQUIRED_DEV_DEPENDENCIES = [
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  'eslint',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'globals',
  'prettier',
  'tsx',
  'typescript',
  'typescript-eslint',
  'vite',
  'wrangler',
];

before(async () => {
  const raw = await readFile(packageJsonPath, 'utf8');
  packageJson = JSON.parse(raw);
});

describe('package.json basics', () => {
  test('includes critical metadata fields', () => {
    assert.ok(packageJson, 'package.json should parse into an object');
    ['name', 'version', 'scripts', 'dependencies', 'devDependencies'].forEach((field) => {
      assert.ok(field in packageJson, `package.json should include "${field}"`);
    });
  });

  test('captures project identity accurately', () => {
    assert.equal(packageJson.name, 'primary-drop-sale-721-boilerplate');
    assert.equal(packageJson.version, '0.0.0');
    assert.equal(packageJson.private, false);
    assert.equal(packageJson.type, 'module');
  });

  test('pinpoints package manager for deterministic installs', () => {
    assert.match(
      packageJson.packageManager,
      /^pnpm@9\.5\.0/,
      'packageManager should specify pnpm 9.5.0 series',
    );
    assert.ok(
      packageJson.packageManager.includes('sha512'),
      'packageManager should embed integrity hash for reproducibility',
    );
  });
});

describe('scripts configuration', () => {
  test('defines all required scripts', () => {
    REQUIRED_SCRIPTS.forEach((script) => {
      assert.ok(script in packageJson.scripts, `Missing script "${script}"`);
      assert.equal(
        typeof packageJson.scripts[script],
        'string',
        `Script "${script}" should be a string`,
      );
      assert.ok(
        packageJson.scripts[script].trim().length > 0,
        `Script "${script}" should not be empty`,
      );
    });
  });

  test('implements expected workflow commands', () => {
    assert.equal(packageJson.scripts.dev, 'vite');
    assert.equal(packageJson.scripts['dev:wrangler'], 'wrangler dev ./functions/api/index');
    assert.equal(packageJson.scripts.build, 'tsc -b && vite build');
    assert.equal(packageJson.scripts.lint, 'eslint .');
    assert.equal(packageJson.scripts['lint:fix'], 'eslint . --fix');
    assert.equal(packageJson.scripts.preview, 'vite preview');
    assert.equal(
      packageJson.scripts.postinstall,
      '(cp -n .env.example .env) || echo already exists',
    );
  });

  test('ensures scripts refer to available tooling', () => {
    const devDeps = Object.keys(packageJson.devDependencies);
    if (packageJson.scripts.build.includes('tsc')) {
      assert.ok(devDeps.includes('typescript'), 'build script uses tsc so typescript must be a dev dependency');
    }
    if (packageJson.scripts.build.includes('vite')) {
      assert.ok(devDeps.includes('vite'), 'build script uses vite so vite must be a dev dependency');
    }
    if (packageJson.scripts['create-unrevealed-tokens']?.includes('tsx')) {
      assert.ok(devDeps.includes('tsx'), 'token scripts rely on tsx so it must be declared');
    }
    if (packageJson.scripts.lint.includes('eslint')) {
      assert.ok(devDeps.includes('eslint'), 'lint script uses eslint so eslint must be declared');
    }
  });
});

describe('dependencies', () => {
  test('exposes required runtime dependencies', () => {
    REQUIRED_DEPENDENCIES.forEach((dep) => {
      assert.ok(
        dep in packageJson.dependencies,
        `Expected runtime dependency "${dep}" to be present`,
      );
    });
  });

  test('enforces semantic versions for runtime dependencies', () => {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      assert.equal(typeof version, 'string', `Dependency "${name}" should declare a version string`);
      assert.ok(version.length > 0, `Dependency "${name}" should not have an empty version`);
      assert.match(
        version,
        /^(?:[\^~><=]*\d|\d)/,
        `Dependency "${name}" should begin with a recognized semver range`,
      );
    });
  });

  test('pins critical runtime packages to documented versions', () => {
    assert.equal(packageJson.dependencies['0xsequence'], '2.1.0');
    assert.equal(packageJson.dependencies['@0xsequence/api'], '2.3.20');
    assert.equal(packageJson.dependencies['@0xsequence/kit'], '4.4.4');
    assert.equal(packageJson.dependencies['@0xsequence/kit-checkout'], '4.6.5');
    assert.equal(packageJson.dependencies['@0xsequence/metadata'], '2.1.0');
    assert.equal(packageJson.dependencies.ethers, '6.14.4');
  });

  test('maintains coherent React ecosystem versions', () => {
    assert.match(packageJson.dependencies.react, /^\^18\./);
    assert.match(packageJson.dependencies['react-dom'], /^\^18\./);
    assert.match(packageJson.devDependencies['@types/react'], /^\^18\./);
    assert.match(packageJson.devDependencies['@types/react-dom'], /^\^18\./);
  });

  test('keeps 0xsequence family packages aligned on major versions', () => {
    const sequenceMajors = Object.entries(packageJson.dependencies)
      .filter(([packageName]) => packageName.startsWith('@0xsequence/'))
      .filter(([packageName]) => !packageName.includes('kit'))
      .map(([, version]) => version.replace(/^[^0-9]*/, '').split('.')[0]);

    assert.ok(sequenceMajors.length > 0, 'Expected at least one @0xsequence package to validate');
    sequenceMajors.forEach((major) => {
      assert.equal(
        major,
        '2',
        `Expected @0xsequence packages (excluding kit variants) to stay on major 2 but found ${major}`,
      );
    });
  });

  test('supports modern web3 tooling versions', () => {
    assert.match(packageJson.dependencies.viem, /^\^2\./);
    assert.match(packageJson.dependencies.wagmi, /^\^2\./);
  });
});

describe('development dependencies', () => {
  test('covers required development toolchain', () => {
    REQUIRED_DEV_DEPENDENCIES.forEach((dep) => {
      assert.ok(
        dep in packageJson.devDependencies,
        `Expected development dependency "${dep}" to be present`,
      );
    });
  });

  test('declares coherent tooling versions', () => {
    assert.match(packageJson.devDependencies.typescript, /^\^5\./);
    assert.match(packageJson.devDependencies.vite, /^\^5\./);
    assert.match(packageJson.devDependencies['@vitejs/plugin-react'], /^\^4\./);
    assert.match(packageJson.devDependencies.tsx, /^\^4\./);
    assert.match(packageJson.devDependencies.eslint, /^\^9\./);
    assert.match(packageJson.devDependencies.prettier, /^\^3\./);
    assert.ok(
      packageJson.devDependencies['eslint-plugin-react-hooks'].includes('5.1.0-rc'),
      'React hooks ESLint plugin should stay on the documented release candidate',
    );
  });

  test('ensures lint stack is cohesive', () => {
    const eslintPlugins = Object.keys(packageJson.devDependencies).filter((name) =>
      name.startsWith('eslint-plugin-'),
    );
    assert.ok(eslintPlugins.length >= 3, 'Expect multiple eslint plugins to support lint setup');
  });
});

describe('integrity & safety checks', () => {
  test('has no duplicate dependency declarations', () => {
    const deps = new Set(Object.keys(packageJson.dependencies || {}));
    const duplicates = Object.keys(packageJson.devDependencies || {}).filter((dep) =>
      deps.has(dep),
    );
    assert.deepEqual(
      duplicates,
      [],
      `Dependencies declared in both dependencies and devDependencies: ${duplicates.join(', ')}`,
    );
  });

  test('maintains reasonable dependency counts for manageability', () => {
    const runtimeCount = Object.keys(packageJson.dependencies || {}).length;
    const devCount = Object.keys(packageJson.devDependencies || {}).length;

    assert.ok(runtimeCount >= 8 && runtimeCount <= 60, `Unexpected runtime dependency count: ${runtimeCount}`);
    assert.ok(devCount >= 8 && devCount <= 60, `Unexpected dev dependency count: ${devCount}`);
  });

  test('avoids common libraries with known historical vulnerabilities', () => {
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    Object.keys(allDeps).forEach((name) => {
      assert.notEqual(
        name,
        'lodash',
        'lodash should not be included unless carefully audited',
      );
      assert.notEqual(
        name,
        'moment',
        'moment should not be included due to maintenance concerns',
      );
    });
  });

  test('allows package.json to stringify cleanly', () => {
    assert.doesNotThrow(() => JSON.stringify(packageJson));
  });
});

describe('edge cases and resilience', () => {
  test('ensures all version strings are non-empty and well formed', () => {
    const allVersions = Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies });
    allVersions.forEach(([name, version]) => {
      assert.equal(typeof version, 'string', `Version for "${name}" should be a string`);
      assert.ok(version.trim().length > 0, `Version for "${name}" should not be blank`);
    });
  });

  test('guarantees scripts do not degrade into empty commands', () => {
    Object.entries(packageJson.scripts).forEach(([name, script]) => {
      assert.equal(typeof script, 'string', `Script "${name}" must be a string`);
      assert.ok(script.trim().length > 0, `Script "${name}" must not be empty`);
    });
  });
});