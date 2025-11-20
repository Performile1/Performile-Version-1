/**
 * Generic postal code importer backed by OpenDataSoft datasets.
 *
 * Exported helpers are reused by CLI scripts and cron jobs to seed or refresh
 * the `postal_codes` table in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');

const OPENDATASOFT_BASE_URL = 'https://public.opendatasoft.com/api/records/1.0/search/';
const MAX_SUPABASE_BATCH = 500;

const DEFAULT_DATASETS = {
  SE: { dataset: 'geonames-postal-code', batchSize: 100 },
  NO: { dataset: 'georef-norway-postalcode', batchSize: 100 },
  DK: { dataset: 'georef-denmark-postalcode', batchSize: 100 },
  FI: { dataset: 'georef-finland-postalcode', batchSize: 100 },
  IS: { dataset: 'is-icelandic-postcode', batchSize: 100 },
};

const POSTAL_CODE_FIELD_CANDIDATES = ['postal_code', 'zip', 'zipcode', 'postnr', 'code'];
const CITY_FIELD_CANDIDATES = [
  'place_name',
  'city',
  'city_name',
  'postort',
  'poststed',
  'by',
  'kaupunki',
  'settlement_name',
];
const MUNICIPALITY_FIELD_CANDIDATES = ['admin_name2', 'municipality', 'kommune'];
const COUNTY_FIELD_CANDIDATES = [
  'admin_name1',
  'county',
  'region',
  'lan',
  'fylke',
  'region_name',
  'maakunta',
];
const LATITUDE_FIELD_CANDIDATES = ['latitude', 'lat', 'geo_point_2d[0]', 'geo_shape.coordinates[1]'];
const LONGITUDE_FIELD_CANDIDATES = ['longitude', 'lng', 'geo_point_2d[1]', 'geo_shape.coordinates[0]'];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeFilters(baseFilters = {}, overrideFilters = {}) {
  const result = {};

  const appendValues = (key, values) => {
    if (values === undefined || values === null) {
      return;
    }

    const normalized = Array.isArray(values) ? values : [values];
    if (!normalized.length) {
      return;
    }

    if (!result[key]) {
      result[key] = [];
    }

    for (const value of normalized) {
      if (value !== undefined && value !== null && value !== '') {
        result[key].push(value);
      }
    }
  };

  for (const [key, value] of Object.entries(baseFilters || {})) {
    appendValues(key, value);
  }

  for (const [key, value] of Object.entries(overrideFilters || {})) {
    appendValues(key, value);
  }

  return result;
}

function ensureEnv(value, name) {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function sanitizePostalCode(value) {
  if (!value) {
    return null;
  }
  return String(value).replace(/\s+/g, '').toUpperCase();
}

function extractField(fields, path) {
  if (!fields || !path) {
    return undefined;
  }

  const segments = path
    .replace(/\]/g, '')
    .split(/\.|\[/)
    .filter(Boolean);

  let current = fields;
  for (const segment of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

function pickFirst(fields, candidates) {
  for (const candidate of candidates) {
    const value = extractField(fields, candidate);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function deriveAreaType(fields) {
  const population = Number(fields?.population ?? fields?.population_total ?? fields?.population_2018 ?? 0);
  if (!Number.isNaN(population)) {
    if (population >= 20000) {
      return 'urban';
    }
    if (population >= 5000) {
      return 'suburban';
    }
  }

  if (fields?.admin_name3 || fields?.place_name || fields?.city_name) {
    return 'urban';
  }

  return 'rural';
}

function transformRecord(fields, countryCode) {
  const postalCode = sanitizePostalCode(pickFirst(fields, POSTAL_CODE_FIELD_CANDIDATES));
  const latitude = pickFirst(fields, LATITUDE_FIELD_CANDIDATES);
  const longitude = pickFirst(fields, LONGITUDE_FIELD_CANDIDATES);

  if (!postalCode || latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }

  const city = pickFirst(fields, CITY_FIELD_CANDIDATES) || 'Unknown';
  const municipality = pickFirst(fields, MUNICIPALITY_FIELD_CANDIDATES);
  const county = pickFirst(fields, COUNTY_FIELD_CANDIDATES);

  return {
    postal_code: postalCode,
    city,
    municipality: municipality || null,
    county: county || null,
    country: countryCode,
    latitude: Number(latitude),
    longitude: Number(longitude),
    area_type: deriveAreaType(fields),
    is_active: true,
  };
}

function buildOpendatasoftUrl({ dataset, countryCode, filters = {}, batchSize, offset }) {
  const params = new URLSearchParams();
  params.set('dataset', dataset);
  params.set('rows', String(batchSize));
  params.set('start', String(offset));
  params.set('q', '');
  params.append('facet', 'country_code');
  if (countryCode) {
    params.append('refine.country_code', countryCode);
  }

  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(`refine.${key}`, v));
    } else if (value !== undefined && value !== null && value !== '') {
      params.append(`refine.${key}`, value);
    }
  }

  return `${OPENDATASOFT_BASE_URL}?${params.toString()}`;
}

async function upsertBatch(supabase, rows) {
  if (!rows.length) {
    return;
  }

  for (let i = 0; i < rows.length; i += MAX_SUPABASE_BATCH) {
    const slice = rows.slice(i, i + MAX_SUPABASE_BATCH);
    const { error } = await supabase
      .from('postal_codes')
      .upsert(slice, { onConflict: 'postal_code', returning: 'minimal' });

    if (error) {
      throw new Error(`Failed to upsert postal codes: ${error.message}`);
    }
  }
}

function createSupabaseClientFromEnv() {
  const url = ensureEnv(process.env.SUPABASE_URL, 'SUPABASE_URL');
  const serviceKey = ensureEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function importPostalCodes({
  countryCode,
  dataset,
  filters = {},
  slices,
  batchSize,
  supabaseClient,
  logger = console,
  transform = transformRecord,
  maxRecords,
  requestDelayMs = 350,
}) {
  if (!countryCode) {
    throw new Error('countryCode is required');
  }

  const targetDataset = dataset || DEFAULT_DATASETS[countryCode]?.dataset;
  if (!targetDataset) {
    throw new Error(`No dataset configured for country ${countryCode}`);
  }

  const effectiveBatchSize = batchSize || DEFAULT_DATASETS[countryCode]?.batchSize || 100;
  const supabase = supabaseClient || createSupabaseClientFromEnv();

  const runSlice = async ({ label, sliceFilters = {}, maxRecords: sliceMaxRecords, requestDelayMs: sliceDelay }) => {
    const sliceLabel = label ? String(label) : 'default';
    const effectiveFilters = mergeFilters(filters, sliceFilters);
    const effectiveMaxRecords = sliceMaxRecords ?? maxRecords;
    const effectiveDelay = sliceDelay ?? requestDelayMs;

    let offset = 0;
    let totalProcessed = 0;
    let totalInserted = 0;

    logger.log(
      `📮 Starting postal code import for ${countryCode}${sliceLabel !== 'default' ? ` [${sliceLabel}]` : ''} (dataset: ${targetDataset})`
    );

    while (true) {
      const url = buildOpendatasoftUrl({
        dataset: targetDataset,
        countryCode,
        filters: effectiveFilters,
        batchSize: effectiveBatchSize,
        offset,
      });

      const response = await fetch(url, { headers: { Accept: 'application/json' } });

      if (!response.ok) {
        throw new Error(`OpenDataSoft API error ${response.status}: ${response.statusText}`);
      }

      const payload = await response.json();
      const records = payload.records || [];

      if (records.length === 0) {
        logger.log('ℹ️  No more records to process.');
        break;
      }

      const transformed = records
        .map((record) => transform(record.fields, countryCode))
        .filter(Boolean);

      await upsertBatch(supabase, transformed);

      totalProcessed += records.length;
      totalInserted += transformed.length;

      logger.log(
        `   ↳ Processed ${records.length} records (slice total inserted: ${totalInserted})`
      );

      if (payload.nhits && offset + effectiveBatchSize >= payload.nhits) {
        logger.log('ℹ️  Reached end of dataset (nhits).');
        break;
      }

      if (effectiveMaxRecords && totalProcessed >= effectiveMaxRecords) {
        logger.log(`ℹ️  Reached maxRecords limit (${effectiveMaxRecords}).`);
        break;
      }

      offset += effectiveBatchSize;
      await delay(effectiveDelay);
    }

    logger.log(
      `✅ Completed postal code import for ${countryCode}${sliceLabel !== 'default' ? ` [${sliceLabel}]` : ''}. Total inserted/updated: ${totalInserted}`
    );

    return {
      label: sliceLabel,
      countryCode,
      dataset: targetDataset,
      totalProcessed,
      totalInserted,
    };
  };

  if (Array.isArray(slices) && slices.length > 0) {
    const sliceSummaries = [];
    for (const slice of slices) {
      const summary = await runSlice(slice || {});
      sliceSummaries.push(summary);
    }

    const aggregate = sliceSummaries.reduce(
      (acc, slice) => {
        acc.totalProcessed += slice.totalProcessed;
        acc.totalInserted += slice.totalInserted;
        return acc;
      },
      { totalProcessed: 0, totalInserted: 0 }
    );

    logger.log(
      `✅ Completed postal code import for ${countryCode}. Total inserted/updated across ${sliceSummaries.length} slices: ${aggregate.totalInserted}`
    );

    return {
      countryCode,
      dataset: targetDataset,
      totalProcessed: aggregate.totalProcessed,
      totalInserted: aggregate.totalInserted,
      slices: sliceSummaries,
    };
  }

  return runSlice({});
}

module.exports = {
  importPostalCodes,
  createSupabaseClientFromEnv,
  DEFAULT_DATASETS,
  OPENDATASOFT_BASE_URL,
  buildOpendatasoftUrl,
};
