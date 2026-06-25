#!/usr/bin/env node
// setup.js — funciona en Windows, macOS y Linux (requiere solo Node.js y Docker)
const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Colores ANSI ──────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
};
const ok   = msg => console.log(`${C.green}✔${C.reset} ${msg}`);
const info = msg => console.log(`${C.blue}▶${C.reset} ${msg}`);
const warn = msg => console.log(`${C.yellow}⚠${C.reset} ${msg}`);
const fail = msg => { console.error(`${C.red}✖${C.reset} ${msg}`); process.exit(1); };
const step = msg => console.log(`\n${C.cyan}══ ${msg} ${C.reset}`);

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, stdio: opts.silent ? 'pipe' : 'inherit', cwd: ROOT });
}

function runCapture(cmd) {
  const r = spawnSync(cmd, { shell: true, stdio: 'pipe', cwd: ROOT });
  return (r.stdout || '').toString().trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor(label, cmd, maxTries = 30, interval = 2000) {
  process.stdout.write(`${C.blue}▶${C.reset} Esperando ${label} `);
  for (let i = 0; i < maxTries; i++) {
    const r = spawnSync(cmd, { shell: true, stdio: 'pipe', cwd: ROOT });
    if (r.status === 0) { process.stdout.write(' ✔\n'); return true; }
    process.stdout.write('.');
    await sleep(interval);
  }
  process.stdout.write(' ✖\n');
  return false;
}

(async () => {
  // ── 0. Requisitos ────────────────────────────────────────────────────────
  step('Verificando requisitos');
  if (run('docker --version', { silent: true }).status !== 0) {
    fail('Docker no está instalado → https://docs.docker.com/get-docker/');
  }
  if (run('docker compose version', { silent: true }).status !== 0) {
    fail('Necesitas docker compose v2 (viene incluido con Docker Desktop)');
  }
  const dockerVer = runCapture('docker --version');
  ok(dockerVer);

  // ── 1. Crear server/.env automáticamente ────────────────────────────────
  step('Configuración de entorno');
  const envPath    = path.join(ROOT, 'server', '.env');
  const envExample = path.join(ROOT, 'server', '.env.example');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExample, envPath);
    warn('server\\.env creado desde .env.example');
    warn('Cambia JWT_SECRET y contraseñas antes de producción');
  } else {
    ok('server\\.env ya existe');
  }

  // ── 2. Build + levantar contenedores ────────────────────────────────────
  step('Construyendo imagen y levantando contenedores');
  info('Imagen:     mastrflow_api:latest');
  info('MySQL:      mastrflow_db  → puerto 3306');
  info('API:        mastrflow_api → puerto 4000');

  const upResult = run('docker compose up -d --build --remove-orphans');
  if (upResult.status !== 0) fail('Error al levantar los contenedores');
  ok('Contenedores iniciados');

  // ── 3. Esperar MySQL ─────────────────────────────────────────────────────
  step('Esperando a MySQL (mastrflow_db)');
  const mysqlReady = await waitFor(
    'MySQL',
    'docker compose exec -T db mysqladmin ping -h 127.0.0.1 -u root -proot_secret --silent',
    40, 2000
  );
  if (!mysqlReady) fail('MySQL no respondió — revisa: docker compose logs db');
  ok('MySQL listo');

  // ── 4. Verificar tablas ──────────────────────────────────────────────────
  step('Verificando esquema de base de datos');
  const tables = runCapture(
    `docker compose exec -T db mysql -u root -proot_secret --batch --skip-column-names` +
    ` -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='mastrflow';"`
  );
  const tableCount = parseInt(tables, 10) || 0;

  if (tableCount > 0) {
    ok(`Base de datos 'mastrflow' con ${tableCount} tablas`);
  } else {
    warn('Aplicando init.sql manualmente…');
    const sql = fs.readFileSync(path.join(ROOT, 'docker', 'mysql', 'init.sql'), 'utf8');
    // Escribir a un archivo temporal y pasarlo
    const tmpSql = path.join(ROOT, 'docker', 'mysql', '_init_tmp.sql');
    fs.writeFileSync(tmpSql, sql);
    run(`docker compose exec -T db mysql -u root -proot_secret mastrflow < "${tmpSql}"`);
    try { fs.unlinkSync(tmpSql); } catch (_) {}
    ok('Esquema aplicado');
  }

  // ── 5. Esperar API en :4000 ──────────────────────────────────────────────
  step('Esperando API en puerto 4000');
  const curlCmd = process.platform === 'win32'
    ? 'curl -sf http://localhost:4000/health'
    : 'curl -sf http://localhost:4000/health';
  const apiReady = await waitFor('API :4000', curlCmd, 20, 2000);
  if (!apiReady) warn('La API tardó — revisa: docker compose logs api');
  else ok('API respondiendo en http://localhost:4000');

  // ── 6. Listar contenedores activos ───────────────────────────────────────
  step('Contenedores activos');
  run('docker ps --filter "name=mastrflow" --format "  {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');

  // ── 7. Resumen ───────────────────────────────────────────────────────────
  console.log(`
${C.green}┌──────────────────────────────────────────────┐${C.reset}
${C.green}│   MastrFlow listo                            │${C.reset}
${C.green}├──────────────────────────────────────────────┤${C.reset}
${C.green}│${C.reset}  API    →  http://localhost:${C.cyan}4000${C.reset}              ${C.green}│${C.reset}
${C.green}│${C.reset}  Health →  http://localhost:${C.cyan}4000/health${C.reset}       ${C.green}│${C.reset}
${C.green}│${C.reset}  MySQL  →  localhost:${C.cyan}3306${C.reset}  DB: mastrflow     ${C.green}│${C.reset}
${C.green}├──────────────────────────────────────────────┤${C.reset}
${C.green}│${C.reset}  npm run docker:logs   — ver logs en vivo    ${C.green}│${C.reset}
${C.green}│${C.reset}  npm run docker:down   — detener             ${C.green}│${C.reset}
${C.green}│${C.reset}  npm run docker:reset  — borrar y recrear    ${C.green}│${C.reset}
${C.green}│${C.reset}  npm run tauri:dev     — abrir app           ${C.green}│${C.reset}
${C.green}└──────────────────────────────────────────────┘${C.reset}
`);
})();
