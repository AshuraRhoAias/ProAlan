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
command -v docker  >/dev/null 2>&1 || error "Docker no está instalado. https://docs.docker.com/get-docker/"
command -v docker compose version >/dev/null 2>&1 || error "docker compose (v2) no está disponible."

# ── Copiar .env si no existe ──────────────────────────────────────────────────
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  warn "Creado server/.env desde .env.example — revisa las credenciales antes de producción."
fi

# ── Levantar servicios ────────────────────────────────────────────────────────
info "Iniciando contenedores Docker (MySQL + API)…"
docker compose up -d --build

# ── Esperar a que MySQL esté listo ────────────────────────────────────────────
info "Esperando a que MySQL acepte conexiones…"
RETRIES=30
until docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  [ "$RETRIES" -le 0 ] && error "MySQL no respondió después de 30 intentos."
  sleep 2
done
success "MySQL listo."

# ── Verificar que el esquema fue aplicado ─────────────────────────────────────
info "Verificando esquema de base de datos…"
TABLES=$(docker compose exec -T mysql mysql -u root -proot mastrflow -e "SHOW TABLES;" 2>/dev/null | grep -c "Tables_in" || true)
if [ "$TABLES" -gt 0 ]; then
  success "Esquema aplicado correctamente (init.sql ejecutado por Docker)."
else
  warn "Aplicando esquema manualmente…"
  docker compose exec -T mysql mysql -u root -proot mastrflow < docker/mysql/init.sql
  success "Esquema aplicado."
fi

# ── Estado final ──────────────────────────────────────────────────────────────
echo ""
success "✓ MastrFlow está listo."
echo -e "  ${BLUE}API:${NC}   http://localhost:4000"
echo -e "  ${BLUE}Salud:${NC} http://localhost:4000/health"
echo ""
info "Para iniciar la app de escritorio:"
echo "  npm run tauri:dev"
echo ""
info "Para detener los servicios:"
echo "  docker compose down"
