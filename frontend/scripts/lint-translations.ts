#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '../src/i18n/locales');

const files = readdirSync(localesDir).filter((f) => f.endsWith('.ts'));

if (files.length < 2) {
  console.log('Only one locale file found, skipping comparison.');
  process.exit(0);
}

const extractKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

const localeModules = await Promise.all(
  files.map(async (file) => {
    const mod = await import(join(localesDir, file));
    return { file, keys: extractKeys(mod.default) };
  })
);

const referenceFile = localeModules[0].file;
const referenceKeys = new Set(localeModules[0].keys);
const errors: string[] = [];

for (const { file, keys } of localeModules.slice(1)) {
  const missing = [...referenceKeys].filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !referenceKeys.has(k));

  if (missing.length > 0) {
    errors.push(`${file}: missing keys (compared to ${referenceFile}): ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    errors.push(`${file}: extra keys (compared to ${referenceFile}): ${extra.join(', ')}`);
  }
}

if (errors.length > 0) {
  console.error('\nTranslation key mismatch:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`All translation files have matching keys (${localeModules[0].keys.length} keys).`);
process.exit(0);
