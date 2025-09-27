#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validate } from 'package-json-validator';

const packagePath = resolve(process.cwd(), 'package.json');

let raw: string;
try {
  raw = readFileSync(packagePath, 'utf8');
} catch {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(raw);

console.log('✅ Parsed package.json');

const { valid, errors } = validate(packageJson);
if (!valid) {
  console.error('❌ Validation errors detected:');
  errors?.forEach(err => console.error(`  • ${err}`));
  process.exit(1);
}

console.log('✅ package-json-validator checks passed');
console.log(`ℹ️  ${Object.keys(packageJson.dependencies || {}).length} dependencies`);
console.log(`ℹ️  ${Object.keys(packageJson.devDependencies || {}).length} devDependencies`);