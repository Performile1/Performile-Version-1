#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { importPostalCodes, createSupabaseClientFromEnv } = require('./lib/postal-code-importer');

function loadSliceConfig(configPath, countryCode) {
  if (!configPath) {
    return null;
  }

  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Slice config not found at ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf8');
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse slice config JSON: ${error.message}`);
  }

  const normalizedCountry = countryCode.toUpperCase();
  const countrySlices = parsed[normalizedCountry] || parsed[normalizedCountry.toLowerCase()];

  if (!countrySlices || !Array.isArray(countrySlices) || countrySlices.length === 0) {
    console.warn(`No slice definitions found for country ${normalizedCountry} in ${absolutePath}.`);
    return null;
  }

  return countrySlices.map((slice, index) => ({
    label: slice.label || `${normalizedCountry}-slice-${index + 1}`,
    sliceFilters: slice.filters || {},
    maxRecords: slice.maxRecords,
    requestDelayMs: slice.requestDelayMs,
  }));
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('import-postal-codes')
    .usage('$0 --country SE [options]')
    .option('country', {
      alias: 'c',
      type: 'string',
      demandOption: true,
      describe: 'ISO 2-letter country code (e.g., SE, NO, DK, FI)',
    })
    .option('dataset', {
      alias: 'd',
      type: 'string',
      describe: 'Override OpenDataSoft dataset name',
    })
    .option('batch', {
      alias: 'b',
      type: 'number',
      describe: 'Custom batch size for OpenDataSoft fetch',
    })
    .option('filter', {
      alias: 'f',
      type: 'array',
      describe: 'Dataset refine filters in key=value form (e.g., place_name=Stockholm)',
    })
    .option('max-records', {
      type: 'number',
      describe: 'Stop after processing this many records (for testing)',
    })
    .option('slice-config', {
      type: 'string',
      describe: 'Path to JSON file describing regional slices (grouped by country code)',
    })
    .option('delay', {
      type: 'number',
      default: 350,
      describe: 'Delay between OpenDataSoft requests in ms',
    })
    .help()
    .alias('h', 'help')
    .parse();

  const filters = {};
  if (argv.filter) {
    for (const entry of argv.filter) {
      const [key, value] = String(entry).split('=', 2);
      if (!key || value === undefined) {
        console.warn(`Ignoring invalid filter: ${entry}`);
        continue;
      }
      if (!filters[key]) {
        filters[key] = [];
      }
      filters[key].push(value);
    }
  }

  const supabase = createSupabaseClientFromEnv();
  const slices = loadSliceConfig(argv['slice-config'], argv.country);

  await importPostalCodes({
    countryCode: argv.country.toUpperCase(),
    dataset: argv.dataset,
    batchSize: argv.batch,
    filters,
    supabaseClient: supabase,
    maxRecords: argv['max-records'],
    requestDelayMs: argv.delay,
    slices,
  });
}

main().catch((error) => {
  console.error('❌ Postal code import failed:', error);
  process.exit(1);
});