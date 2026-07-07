#!/usr/bin/env node
// docker-create.cjs — crea contenedor, imagen, DB, tablas y datos en un solo comando
// Compatible: Windows, macOS, Linux. Solo requiere Node.js y Docker Desktop.

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const SQL_FILE  = path.join(ROOT, 'docker', 'mysql', 'init.sql');
const CONTAINER = 'mastrflow_db';
const DB_NAME   = 'mastrflow';
const ROOT_PASS = 'root_secret';

// ── Colores ANSI ──────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};
const ok   = msg => console.log(`${C.green}✔${C.reset} ${msg}`);
const info = msg => console.log(`${C.blue}ℹ${C.reset} ${msg}`);
const warn = msg => console.log(`${C.yellow}⚠${C.reset} ${msg}`);
const fail = (msg) => { console.error(`${C.red}✖${C.reset} ${msg}`); process.exit(1); };

function run(args, opts = {}) {
  const r = spawnSync(args[0], args.slice(1), {
    stdio: opts.capture ? 'pipe' : ['pipe', 'inherit', 'inherit'],
    cwd: ROOT,
    env: process.env,
  });
  if (opts.capture) return (r.stdout || '').toString().trim();
  return r;
}

function capture(args) { return run(args, { capture: true }); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitMySQL(maxTries = 30) {
  process.stdout.write(`${C.blue}ℹ${C.reset} Esperando MySQL`);
  for (let i = 0; i < maxTries; i++) {
    const r = spawnSync('docker', [
      'exec', CONTAINER,
      'mysqladmin', 'ping', '-h', '127.0.0.1',
      '-u', 'root', `--password=${ROOT_PASS}`, '--silent',
    ], { stdio: 'pipe' });
    if (r.status === 0) { process.stdout.write(' ✔\n'); return true; }
    process.stdout.write('.');
    await sleep(1000);
  }
  process.stdout.write(' ✖\n');
  return false;
}

(async () => {
  console.log(`\n${C.bold}${C.cyan}MastrFlow — Inicialización completa${C.reset}\n`);

  // ── 1. Verificar Docker ───────────────────────────────────────
  info('Verificando Docker…');
  const dockerVer = capture(['docker', '--version']);
  if (!dockerVer) fail('Docker no está instalado → https://docs.docker.com/get-docker/');
  ok(`Docker encontrado: ${dockerVer}`);

  // ── 2. Verificar/crear la red de compose ─────────────────────
  info(`Verificando contenedor "${CONTAINER}"…`);
  const running = capture(['docker', 'inspect', '--format', '{{.State.Status}}', CONTAINER]);

  if (running === 'running') {
    ok('Contenedor ya está corriendo');
  } else if (running === 'exited' || running === 'stopped') {
    info('Reiniciando contenedor…');
    const r = spawnSync('docker', ['start', CONTAINER], { stdio: 'inherit', cwd: ROOT });
    if (r.status !== 0) fail('No se pudo iniciar el contenedor');
    ok('Contenedor iniciado');
  } else {
    // No existe — levantar con docker compose
    info('Contenedor no encontrado — levantando con docker compose…');
    const r = spawnSync('docker', ['compose', 'up', '-d', '--build', 'db'], {
      stdio: 'inherit', cwd: ROOT,
    });
    if (r.status !== 0) fail('Error al crear el contenedor con docker compose');
    ok('Contenedor creado y ejecutando');
  }

  // ── 3. Esperar MySQL ──────────────────────────────────────────
  const ready = await waitMySQL(45);
  if (!ready) fail('MySQL no respondió en 45 segundos. Revisa: docker logs ' + CONTAINER);
  ok('MySQL listo');

  // ── 4. Crear base de datos si no existe ───────────────────────
  info(`Asegurando base de datos "${DB_NAME}"…`);
  const createDb = spawnSync('docker', [
    'exec', '-i', CONTAINER,
    'mysql', '-u', 'root', `--password=${ROOT_PASS}`,
    '-e', `CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  ], { stdio: ['pipe', 'inherit', 'pipe'] });
  if (createDb.status !== 0) {
    const stderr = (createDb.stderr || '').toString();
    if (!stderr.includes('Warning')) {
      console.error(stderr);
      fail('No se pudo crear la base de datos');
    }
  }
  ok(`Base de datos "${DB_NAME}" lista`);

  // ── 5. Aplicar init.sql (tablas + datos) ─────────────────────
  info('Aplicando init.sql (tablas + datos semilla)…');
  if (!fs.existsSync(SQL_FILE)) fail(`No se encontró: ${SQL_FILE}`);

  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
  const applySQL = spawnSync('docker', [
    'exec', '-i', CONTAINER,
    'mysql',
    '-u', 'root', `--password=${ROOT_PASS}`,
    '--database', DB_NAME,
    '--default-character-set=utf8mb4',
  ], {
    input: sqlContent,
    stdio: ['pipe', 'inherit', 'pipe'],
  });

  const sqlStderr = (applySQL.stderr || '').toString();
  const isOnlyWarnings = sqlStderr.split('\n').every(
    l => l.trim() === '' || l.toLowerCase().includes('warning')
  );

  if (applySQL.status !== 0 && !isOnlyWarnings) {
    console.error(sqlStderr);
    fail('mysql retornó error al aplicar init.sql. Revisa el output de arriba.');
  }
  ok('Tablas y datos aplicados correctamente');

  // ── 6. Verificar resultado ────────────────────────────────────
  info('Verificando tablas creadas…');
  const tablesOut = capture([
    'docker', 'exec', CONTAINER,
    'mysql', '-u', 'root', `--password=${ROOT_PASS}`,
    '--batch', '--skip-column-names',
    DB_NAME,
    '-e', 'SHOW TABLES;',
  ]);

  const tables = tablesOut.split('\n').filter(t => t && !t.toLowerCase().includes('warning'));
  if (tables.length === 0) fail('No se encontraron tablas después de aplicar init.sql');
  ok(`${tables.length} tablas en la base de datos:`);
  tables.forEach(t => console.log(`   ${C.cyan}·${C.reset} ${t}`));

  // ── 7. Mostrar usuarios de acceso ─────────────────────────────
  info('Usuarios creados:');
  const usersOut = capture([
    'docker', 'exec', CONTAINER,
    'mysql', '-u', 'root', `--password=${ROOT_PASS}`,
    '--batch', '--skip-column-names',
    DB_NAME,
    '-e', 'SELECT name, role, pin FROM users ORDER BY id;',
  ]);
  const userLines = usersOut.split('\n').filter(l => l && !l.toLowerCase().includes('warning'));
  userLines.forEach(line => {
    const [name, role, pin] = line.split('\t');
    console.log(`   ${C.cyan}·${C.reset} ${String(name).padEnd(12)} [${role}]  PIN: ${C.bold}${pin}${C.reset}`);
  });

  // ── 8. Resumen final ──────────────────────────────────────────
  console.log(`
${C.green}${C.bold}┌─────────────────────────────────────────────────┐${C.reset}
${C.green}${C.bold}│   MastrFlow — Todo listo                        │${C.reset}
${C.green}${C.bold}├─────────────────────────────────────────────────┤${C.reset}
${C.green}│${C.reset}  MySQL     →  localhost:${C.cyan}3306${C.reset}   DB: mastrflow      ${C.green}│${C.reset}
${C.green}│${C.reset}  Usuario   →  root / ${C.cyan}${ROOT_PASS}${C.reset}              ${C.green}│${C.reset}
${C.green}│${C.reset}                                                 ${C.green}│${C.reset}
${C.green}│${C.reset}  Siguiente paso:                                ${C.green}│${C.reset}
${C.green}│${C.reset}    ${C.cyan}npm run setup${C.reset}   — levantar API + DB completo  ${C.green}│${C.reset}
${C.green}│${C.reset}    ${C.cyan}npm run dev${C.reset}     — iniciar frontend             ${C.green}│${C.reset}
${C.green}│${C.reset}    ${C.cyan}npm run tauri:dev${C.reset} — app de escritorio          ${C.green}│${C.reset}
${C.green}${C.bold}└─────────────────────────────────────────────────┘${C.reset}
`);
})();
