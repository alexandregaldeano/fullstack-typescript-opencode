import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, 'frontend', 'src', 'i18n', 'locales');

type TranslationTree = Record<string, unknown>;

function collectKeys(obj: TranslationTree, prefix: string = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as TranslationTree, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

async function loadLocale(filePath: string): Promise<{ lang: string; keys: string[] }> {
  const fileName = filePath.split('/').pop()?.replace('.ts', '') ?? 'unknown';

  try {
    const module = await import(filePath);
    const translations = module.default as TranslationTree;
    return { lang: fileName, keys: collectKeys(translations) };
  } catch (error) {
    console.error(`Failed to load ${fileName}:`, error);
    process.exit(1);
  }
}

async function main() {
  const files = await readdir(localesDir).then((names) =>
    names.filter((name) => name.endsWith('.ts')).map((name) => join(localesDir, name))
  );

  if (files.length < 2) {
    console.log('No locale files to compare.');
    process.exit(0);
  }

  const locales = await Promise.all(files.map(loadLocale));
  const allKeys = new Set(locales.flatMap((l) => l.keys));

  const missing: Record<string, string[]> = {};
  for (const locale of locales) {
    const localeSet = new Set(locale.keys);
    const absent = [...allKeys].filter((key) => !localeSet.has(key));
    if (absent.length > 0) {
      missing[locale.lang] = absent;
    }
  }

  if (Object.keys(missing).length === 0) {
    console.log('All translations are complete.');
    process.exit(0);
  }

  console.error('\nMissing translations:');
  for (const [lang, keys] of Object.entries(missing).sort()) {
    for (const key of keys.sort()) {
      console.error(`  ${lang}: ${key}`);
    }
  }
  console.error(`\n${Object.entries(missing).reduce((sum, [, keys]) => sum + keys.length, 0)} missing translation(s)\n`);
  process.exit(1);
}

main();
