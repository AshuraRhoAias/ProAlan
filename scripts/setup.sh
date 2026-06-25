#!/usr/bin/env bash
# setup.sh — Inicia Docker, espera MySQL y crea la base de datos
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Colores ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[setup]${NC} $*"; }
success() { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[setup]${NC} $*"; }
error()   { echo -e "${RED}[setup]${NC} $*"; exit 1; }

# ── Requisitos ────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker no está instalado. https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || error "docker compose (v2) no está disponible."

# ── Copiar .env si no existe ──────────────────────────────────────────────────
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  warn "Creado server/.env desde .env.example — revisa las credenciales antes de producción."
fi

# ── Levantar servicios ────────────────────────────────────────────────────────
info "Iniciando contenedores Docker (MySQL + API)…"
docker compose up -d --build

# ── Esperar a que MySQL esté listo (servicio: db) ─────────────────────────────
info "Esperando a que MySQL acepte conexiones…"
RETRIES=30
until docker compose exec -T db mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-root_secret}" --silent 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  [ "$RETRIES" -le 0 ] && error "MySQL no respondió después de 30 intentos."
  echo -n "."
  sleep 2
done
echo ""
success "MySQL listo."

# ── Verificar que el esquema fue aplicado ─────────────────────────────────────
info "Verificando esquema de base de datos…"
TABLES=$(docker compose exec -T db mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root_secret}" mastrflow \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='mastrflow';" \
  --skip-column-names 2>/dev/null || echo "0")
if [ "$TABLES" -gt 0 ] 2>/dev/null; then
  success "Esquema aplicado ($TABLES tablas encontradas)."
else
  warn "Aplicando esquema manualmente…"
  docker compose exec -T db mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root_secret}" mastrflow \
    < docker/mysql/init.sql
  success "Esquema aplicado."
fi

# ── Verificar que la API responde ─────────────────────────────────────────────
info "Esperando a que la API esté lista en el puerto 4000…"
API_RETRIES=15
until curl -sf http://localhost:4000/health >/dev/null 2>&1; do
  API_RETRIES=$((API_RETRIES - 1))
  [ "$API_RETRIES" -le 0 ] && { warn "La API tardó demasiado — revisa: docker compose logs api"; break; }
  echo -n "."
  sleep 2
done
echo ""
success "API respondiendo en http://localhost:4000"

# ── Estado final ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   MastrFlow está listo               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo -e "  ${BLUE}API:${NC}    http://localhost:4000"
echo -e "  ${BLUE}Health:${NC} http://localhost:4000/health"
echo -e "  ${BLUE}DB:${NC}     localhost:3306  (mastrflow)"
echo ""
echo -e "  Comandos útiles:"
echo -e "    npm run docker:logs   — ver logs en tiempo real"
echo -e "    npm run docker:down   — detener servicios"
echo -e "    npm run tauri:dev     — abrir app de escritorio"
