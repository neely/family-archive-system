#!/usr/bin/env node
/**
 * manage.js
 *
 * Interactive CLI for reviewing and applying proposed changes to the archive.
 *
 * Run:  node manage.js
 *
 * What it does:
 *   - Reads proposed-changes.json for all entries with status: "proposed"
 *   - Shows each one interactively: current value vs proposed value, source, submitter
 *   - Accept [a]: writes new value into family-archive-full.json with confirmed status,
 *                 moves old value to history with superseded status
 *   - Reject [r]: marks change as rejected with a reason, main record unchanged
 *   - Skip  [s]: leaves change as proposed, revisit next time
 *   - Quit  [q]: exits, saves all progress so far
 *
 * Supported field types:
 *   - Scalar fields (strings, numbers, booleans): direct replacement with history
 *   - Array fields (parents, siblings, spouses, children, artifacts): merge or replace
 *   - New people: full record added to people array
 *   - New artifacts: full record added to artifacts array
 *
 * After running: commit both family-archive-full.json and proposed-changes.json
 * The GitHub Action will build and deploy the sanitized public version.
 */

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ── Config ───────────────────────────────────────────────────────────────────

const ARCHIVE_PATH  = path.join(__dirname, 'data', 'family-archive-full.json');
const CHANGES_PATH  = path.join(__dirname, 'data', 'proposed-changes.json');

// Fields that use tracked history (value + status + source + updated)
const TRACKED_FIELDS = [
  'born_full', 'born_year', 'died', 'birthplace', 'deathplace',
  'name', 'confidence',
  'parents', 'siblings', 'spouses', 'children',
  'date', 'date_year', 'location_tags', 'condition', 'source', 'type',
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`ERROR: Failed to parse ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

function save(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function findPerson(archive, id) {
  return archive.people.find(p => p.id === id);
}

function findArtifact(archive, id) {
  return archive.artifacts.find(a => a.id === id);
}

function findTarget(archive, targetType, targetId) {
  if (targetType === 'person')   return findPerson(archive, targetId);
  if (targetType === 'artifact') return findArtifact(archive, targetId);
  return null;
}

function getCurrentValue(target, field) {
  if (!target) return null;
  const val = target[field];
  if (val === undefined) return null;
  // If it's a tracked field object {value, status, source, updated}, return the value
  if (val && typeof val === 'object' && 'value' in val && 'status' in val) {
    return val.value;
  }
  return val;
}

function formatValue(val) {
  if (val === null || val === undefined) return '(none)';
  if (Array.isArray(val)) return val.length ? val.join(', ') : '(empty array)';
  return String(val);
}

function hr() {
  console.log('─'.repeat(60));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Apply a confirmed change to the archive ───────────────────────────────────

function applyChange(archive, change) {
  const { target_type, target_id, field, proposed_value, current_value, source } = change;

  // ── Handle new person ──
  if (target_id.startsWith('NEW:')) {
    if (target_type === 'person') {
      if (!archive.people) archive.people = [];
      const newId = target_id.replace('NEW:', '').trim();
      const existing = findPerson(archive, newId);
      if (existing) {
        console.log(`  ⚠ Person ${newId} already exists — skipping add`);
        return;
      }
      const newRecord = typeof proposed_value === 'object' ? proposed_value : { id: newId };
      newRecord.id = newId;
      newRecord._added = { date: today(), source };
      archive.people.push(newRecord);
      console.log(`  ✓ Added new person: ${newId}`);
    } else if (target_type === 'artifact') {
      if (!archive.artifacts) archive.artifacts = [];
      const newId = target_id.replace('NEW:', '').trim();
      const newRecord = typeof proposed_value === 'object' ? proposed_value : { id: newId };
      newRecord.id = newId;
      newRecord._added = { date: today(), source };
      archive.artifacts.push(newRecord);
      console.log(`  ✓ Added new artifact: ${newId}`);
    }
    return;
  }

  // ── Handle update to existing record ──
  const target = findTarget(archive, target_type, target_id);
  if (!target) {
    console.log(`  ⚠ Target not found: ${target_type} ${target_id} — skipping`);
    return;
  }

  const isTracked = TRACKED_FIELDS.includes(field);

  // ── Handle append action (e.g. adding a view to views array) ──
  if (change.change_action === 'append') {
    if (!Array.isArray(target[field])) target[field] = [];
    target[field].push(proposed_value);
    console.log(`  ✓ Appended to ${target_type} ${target_id} → ${field}`);
    return;
  }

  if (isTracked) {
    // Move current value to history
    const historyField = `${field}_history`;
    if (!target[historyField]) target[historyField] = [];

    const currentEntry = target[field];
    if (currentEntry !== undefined && currentEntry !== null) {
      // If it was already a tracked object, add to history
      if (typeof currentEntry === 'object' && 'value' in currentEntry) {
        target[historyField].push({
          ...currentEntry,
          status: 'superseded',
          superseded_by: source,
          superseded_date: today(),
        });
      } else {
        // Bare value — wrap it for history
        target[historyField].push({
          value: currentEntry,
          status: 'superseded',
          source: 'unknown (pre-tracking)',
          updated: 'unknown',
          superseded_by: source,
          superseded_date: today(),
        });
      }
    }

    // Write new tracked value
    target[field] = {
      value: proposed_value,
      status: 'confirmed',
      source: source,
      updated: today(),
    };

  } else {
    // Untracked field — direct replacement, no history
    target[field] = proposed_value;
  }

  console.log(`  ✓ Updated ${target_type} ${target_id} → ${field}`);
}

// ── Interactive review ────────────────────────────────────────────────────────

async function reviewChanges() {
  const archive = load(ARCHIVE_PATH);
  const changesData = fs.existsSync(CHANGES_PATH)
    ? load(CHANGES_PATH)
    : { changes: [] };

  if (!changesData.changes) changesData.changes = [];

  const pending = changesData.changes.filter(c => c.status === 'proposed');

  if (pending.length === 0) {
    console.log('\n✓ No pending proposed changes. Archive is up to date.\n');
    return;
  }

  console.log(`\n📋 Family Archive — Change Review`);
  console.log(`   ${pending.length} proposed change${pending.length !== 1 ? 's' : ''} pending\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  let accepted = 0, rejected = 0, skipped = 0;

  for (let i = 0; i < pending.length; i++) {
    const change = pending[i];
    const target = findTarget(archive, change.target_type, change.target_id);

    hr();
    console.log(`Change ${change.id}  [${i + 1} of ${pending.length} pending]`);
    console.log(`Target:   ${change.target_id} (${target ? (target.name || target.title || change.target_id) : '— NOT FOUND IN ARCHIVE —'})`);
    console.log(`Field:    ${change.field}`);
    console.log(`Current:  ${formatValue(getCurrentValue(target, change.field))}`);
    console.log(`Proposed: ${formatValue(change.proposed_value)}`);
    console.log(`Source:   ${change.source || '(not specified)'}`);
    console.log(`From:     ${change.submitted_by || '(unknown)'}  —  ${change.submitted || ''}`);
    if (change.notes) {
      console.log(`Notes:    ${change.notes}`);
    }
    console.log('');

    let answer = '';
    while (!['a', 'r', 's', 'q'].includes(answer)) {
      answer = (await ask('Accept [a], Reject [r], Skip [s], Quit [q]: ')).trim().toLowerCase();
    }

    if (answer === 'q') {
      console.log('\nQuitting — saving progress so far.');
      break;
    }

    if (answer === 'a') {
      applyChange(archive, change);
      change.status = 'accepted';
      change.resolved_date = today();
      accepted++;
    }

    if (answer === 'r') {
      const reason = await ask('Reason for rejection (optional, press Enter to skip): ');
      change.status = 'rejected';
      change.resolved_date = today();
      change.rejection_reason = reason.trim() || '(none given)';
      console.log(`  ✗ Rejected`);
      rejected++;
    }

    if (answer === 's') {
      console.log(`  → Skipped`);
      skipped++;
    }

    console.log('');
  }

  rl.close();
  hr();

  // Save both files
  save(ARCHIVE_PATH, archive);
  save(CHANGES_PATH, changesData);

  console.log(`\nDone.`);
  console.log(`  Accepted: ${accepted}`);
  console.log(`  Rejected: ${rejected}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`\nFiles saved:`);
  console.log(`  ${ARCHIVE_PATH}`);
  console.log(`  ${CHANGES_PATH}`);
  console.log(`\nNext step: commit both files to the private repo.`);
  console.log(`  git add data/family-archive-full.json data/proposed-changes.json`);
  console.log(`  git commit -m "Apply ${accepted} change(s) from proposed-changes"`);
  console.log(`  git push\n`);
}

// ── Summary mode ─────────────────────────────────────────────────────────────

function showSummary() {
  if (!fs.existsSync(CHANGES_PATH)) {
    console.log('\nNo proposed-changes.json found.\n');
    return;
  }
  const changesData = load(CHANGES_PATH);
  const all = changesData.changes || [];
  const byStatus = { proposed: 0, accepted: 0, rejected: 0 };
  all.forEach(c => { if (byStatus[c.status] !== undefined) byStatus[c.status]++; });

  console.log('\n📋 Change log summary:');
  console.log(`  Proposed (pending):  ${byStatus.proposed}`);
  console.log(`  Accepted:            ${byStatus.accepted}`);
  console.log(`  Rejected:            ${byStatus.rejected}`);
  console.log(`  Total:               ${all.length}\n`);

  if (byStatus.proposed > 0) {
    console.log('Pending changes:');
    all.filter(c => c.status === 'proposed').forEach(c => {
      console.log(`  ${c.id}  ${c.target_id} → ${c.field}  (from: ${c.submitted_by || 'unknown'})`);
    });
    console.log('');
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];

if (arg === '--summary' || arg === '-s') {
  showSummary();
} else {
  reviewChanges().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
}
