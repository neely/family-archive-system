#!/usr/bin/env node
/**
 * build.js
 * 
 * Reads family-archive-full.json (private repo).
 * Strips private fields from living people (died === null).
 * Writes sanitized family-archive.json to the public repo output directory.
 * 
 * Run:  node build.js
 * 
 * Private fields stripped from living people:
 *   born_full, address, phone, email, researcher_notes
 * 
 * Deceased people (died is not null) pass through completely unmodified.
 * 
 * The gate is the `died` field. When a death date is added to a record,
 * the next build automatically promotes the full record to the public archive.
 */

const fs   = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────

const INPUT_PATH  = path.join(__dirname, 'data', 'family-archive-full.json');
const OUTPUT_PATH = path.join(__dirname, 'dist', 'family-archive.json');

// Fields to redact on living people
const PRIVATE_FIELDS = [
  'born_full',
  'address',
  'phone',
  'email',
  'researcher_notes',
];

// researcher_notes is always private regardless of living/deceased
const ALWAYS_PRIVATE = [
  'researcher_notes',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLiving(person) {
  return person.died === null || person.died === undefined || person.died === '';
}

function sanitizePerson(person) {
  const sanitized = { ...person };

  if (isLiving(person)) {
    // Redact private fields for living people
    for (const field of PRIVATE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
        // Also redact the history array if present
        const historyField = `${field}_history`;
        if (historyField in sanitized) {
          sanitized[historyField] = '[REDACTED]';
        }
      }
    }
  }

  // researcher_notes is always private — remove entirely
  delete sanitized.researcher_notes;
  delete sanitized.researcher_notes_history;

  // For tracked fields (value/status/source/updated objects), extract just
  // the value for public display — history arrays are maintainer-only
  // Exception: keep history for deceased people so the audit trail is visible
  const TRACKED_FIELDS = [
    'born_full', 'born_year', 'died', 'birthplace', 'deathplace',
    'name', 'confidence', 'parents', 'siblings', 'spouses', 'children',
  ];

  for (const field of TRACKED_FIELDS) {
    // Remove _history arrays from public output for living people
    // Keep them for deceased (they're part of the historical record)
    if (isLiving(person)) {
      delete sanitized[`${field}_history`];
    }

    // Unwrap tracked field objects to plain values for public display
    const val = sanitized[field];
    if (val && typeof val === 'object' && 'value' in val && 'status' in val) {
      sanitized[field] = val.value;
    }
  }

  return sanitized;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Read
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`ERROR: Input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  let archive;
  try {
    const raw = fs.readFileSync(INPUT_PATH, 'utf8');
    archive = JSON.parse(raw);
  } catch (err) {
    console.error(`ERROR: Failed to parse input JSON: ${err.message}`);
    process.exit(1);
  }

  // Validate top-level structure
  if (!archive.people || !Array.isArray(archive.people)) {
    console.error('ERROR: archive.people must be an array');
    process.exit(1);
  }
  if (!archive.artifacts || !Array.isArray(archive.artifacts)) {
    console.error('ERROR: archive.artifacts must be an array');
    process.exit(1);
  }

  // Sanitize people
  const livingCount   = archive.people.filter(isLiving).length;
  const deceasedCount = archive.people.filter(p => !isLiving(p)).length;

  const sanitizedPeople = archive.people.map(sanitizePerson);

  // Artifacts have no private fields currently — pass through as-is
  // If artifact privacy is needed in future, add sanitizeArtifact() here
  const sanitizedArtifacts = archive.artifacts;

  // Build output
  const output = {
    ...archive,
    people:    sanitizedPeople,
    artifacts: sanitizedArtifacts,
    _build: {
      generated_at:   new Date().toISOString(),
      source:         'family-archive-source (private)',
      living_count:   livingCount,
      deceased_count: deceasedCount,
      note:           'Auto-generated. Do not edit directly. Edit family-archive-full.json in the private repo.',
    }
  };

  // Write
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  // Report
  console.log('✓ Build complete');
  console.log(`  Input:    ${INPUT_PATH}`);
  console.log(`  Output:   ${OUTPUT_PATH}`);
  console.log(`  People:   ${sanitizedPeople.length} total (${livingCount} living sanitized, ${deceasedCount} deceased passed through)`);
  console.log(`  Artifacts: ${sanitizedArtifacts.length}`);

  // List which people were sanitized
  if (livingCount > 0) {
    console.log('\n  Sanitized (living):');
    archive.people
      .filter(isLiving)
      .forEach(p => console.log(`    - ${p.name} (${p.id})`));
  }
}

main();
