#!/usr/bin/env node
/**
 * docker:create — Ensures MySQL container is running, then re-runs
 * init.sql to create all tables and seed data.
 *
 * Safe to run multiple times — all DDL uses IF NOT EXISTS and
 * INSERT IGNORE so existing data is never overwritten.
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const CONTAINER = 'mastrflow_db';
const DB_USER = process.env.MYSQL_USER || 'root';
const DB_PASS = process.env.MYSQL_ROOT_PASSWORD || 'root_secret';
const DB_NAME = 'mastrflow';
const INIT_SQL = path.join(ROOT, 'docker', 'mysql', 'init.sql');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: opts.silent ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  return result;
}

function ok(label) { console.log(`\x1b[32m✔\x1b[0m ${label}`); }
function info(label) { console.log(`\x1b[36mℹ\x1b[0m ${label}`); }
function fail(label) { console.error(`\x1b[31m✖\x1b[0m ${label}`); process.exit(1); }

// ── 1. Check Docker is available ─────────────────────────────
info('Checking Docker…');
const dockerCheck = run('docker', ['info'], { silent: true });
if (dockerCheck.status !== 0) fail('Docker is not running. Start Docker Desktop and try again.');
ok('Docker is running');

// ── 2. Is the db container already running? ───────────────────
info(`Checking container "${CONTAINER}"…`);
const inspect = run('docker', ['inspect', '--format', '{{.State.Running}}', CONTAINER], { silent: true });
const isRunning = inspect.stdout && inspect.stdout.toString().trim() === 'true';

if (!isRunning) {
  info(`Container not running — starting with docker compose up -d db …`);
  const up = run('docker', ['compose', 'up', '-d', 'db'], { cwd: ROOT });
  if (up.status !== 0) fail('Failed to start the db container.');
  ok('Container started');
} else {
  ok('Container already running');
}

// ── 3. Wait for MySQL to be ready ────────────────────────────
info('Waiting for MySQL to be ready…');
const MAX_TRIES = 30;
let ready = false;
for (let i = 1; i <= MAX_TRIES; i++) {
  const ping = run(
    'docker',
    ['exec', CONTAINER, 'mysqladmin', 'ping', '-h', '127.0.0.1',
     '-u', 'root', `--password=${DB_PASS}`, '--silent'],
    { silent: true }
  );
  if (ping.status === 0) { ready = true; break; }
  process.stdout.write(`\r  Attempt ${i}/${MAX_TRIES}…`);
  // cross-platform 1-second sleep via node
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}
if (!ready) fail('MySQL did not become ready in time.');
process.stdout.write('\r');
ok('MySQL is ready');

// ── 4. Re-run init.sql inside the container ───────────────────
if (!fs.existsSync(INIT_SQL)) fail(`init.sql not found at: ${INIT_SQL}`);
info('Running init.sql (creating tables + seeding data)…');

// Pipe init.sql via stdin — avoids copy + source issues cross-platform
const sqlContent = fs.readFileSync(INIT_SQL);
const execResult = spawnSync(
  'docker',
  ['exec', '-i', CONTAINER, 'mysql', '-u', 'root', `--password=${DB_PASS}`],
  { input: sqlContent, stdio: ['pipe', 'inherit', 'inherit'], shell: process.platform === 'win32' }
);
if (execResult.status !== 0) fail('mysql returned a non-zero exit code. Check the output above.');
ok('Tables and seed data applied');

// ── 5. Quick summary ──────────────────────────────────────────
console.log('\n\x1b[32m✔ docker:create complete\x1b[0m');
console.log('  Database : mastrflow');
console.log(`  Container: ${CONTAINER}`);
console.log('  Users    : Admin (PIN 0000) · Manager (PIN 1234)');
console.log('  Run \x1b[1mnpm run docker:up\x1b[0m to also start the API.\n');
