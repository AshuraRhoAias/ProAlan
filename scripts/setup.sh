#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh  —  Un solo comando crea todo:
#   • Imagen Docker (mastrflow_api:latest)
#   • Contenedor MySQL  (mastrflow_db)  en puerto 3306
#   • Contenedor API    (mastrflow_api) en puerto 4000
#   • Base de datos mastrflow con todas las tablas
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${BLUE}▶${NC} $*"; }
ok()      { echo -e "${GREEN}✔${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
error()   { echo -e "${RED}✖${NC} $*"; exit 1; }
step()    { echo -e "\n${CYAN}══ $* ${NC}"; }

# ── 0. Requisitos ─────────────────────────────────────────────────────────────
step "Verificando requisitos"
command -v docker >/dev/null 2>&1  || error "Docker no está instalado → https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || error "Necesitas docker compose v2 (plugin, no docker-compose legacy)"
ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# ── 1. Crear .env automáticamente si no existe ────────────────────────────────
step "Configuración de entorno"
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  warn "server/.env creado desde .env.example"
  warn "Cambia JWT_SECRET y contraseñas antes de producción"
else
  ok "server/.env ya existe"
fi

# Exportar variables para que docker compose las use
set -a
# shellcheck disable=SC1091
[ -f server/.env ] && source server/.env
set +a

# ── 2. Build + levantar contenedores ─────────────────────────────────────────
step "Construyendo imagen y levantando contenedores"
info "Imagen:     mastrflow_api:latest"
info "MySQL:      mastrflow_db  → puerto 3306"
info "API:        mastrflow_api → puerto 4000"

docker compose up -d --build --remove-orphans

ok "Contenedores iniciados"

# ── 3. Esperar MySQL (healthcheck propio, pero esperamos confirmación) ────────
step "Esperando a MySQL (mastrflow_db)"
MAX=40
N=0
until docker compose exec -T db \
  mysqladmin ping -h 127.0.0.1 -u root \
  -p"${MYSQL_ROOT_PASSWORD:-root_secret}" --silent 2>/dev/null; do
  N=$((N + 1))
  [ "$N" -ge "$MAX" ] && error "MySQL no respondió en $((MAX * 2))s — revisa: docker compose logs db"
  printf "."
  sleep 2
done
echo ""
ok "MySQL listo"

# ── 4. Verificar tablas (init.sql se corre automáticamente por Docker) ────────
step "Verificando esquema de base de datos"
TABLES=$(docker compose exec -T db \
  mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root_secret}" \
  --batch --skip-column-names \
  -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='mastrflow';" \
  2>/dev/null || echo "0")

TABLES=$(echo "$TABLES" | tr -d '[:space:]')

if [ "${TABLES:-0}" -gt 0 ] 2>/dev/null; then
  ok "Base de datos 'mastrflow' con $TABLES tablas"
else
  warn "Aplicando init.sql manualmente…"
  docker compose exec -T db \
    mysql -u root -p"${MYSQL_ROOT_PASSWORD:-root_secret}" mastrflow \
    < docker/mysql/init.sql 2>/dev/null
  ok "Esquema aplicado"
fi

# ── 5. Esperar que la API responda en :4000 ───────────────────────────────────
step "Esperando API en puerto 4000"
MAX_API=20
N=0
until curl -sf http://localhost:4000/health >/dev/null 2>&1; do
  N=$((N + 1))
  [ "$N" -ge "$MAX_API" ] && {
    warn "La API tardó demasiado — revisa: docker compose logs api"
    break
  }
  printf "."
  sleep 2
done
echo ""
curl -sf http://localhost:4000/health >/dev/null 2>&1 && ok "API respondiendo" || true

# ── 6. Resumen ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}┌──────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│   MastrFlow listo                        │${NC}"
echo -e "${GREEN}├──────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│${NC}  API      →  http://localhost:${CYAN}4000${NC}        ${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  Health   →  http://localhost:${CYAN}4000/health${NC}  ${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  MySQL    →  localhost:${CYAN}3306${NC}  (mastrflow)  ${GREEN}│${NC}"
echo -e "${GREEN}├──────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│${NC}  Contenedores:                            ${GREEN}│${NC}"

docker ps --filter "name=mastrflow" \
  --format "  {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | awk '{printf "'"${GREEN}│${NC}"'  %-20s %-12s '"${GREEN}│${NC}"'\n", $1, $2}'

echo -e "${GREEN}├──────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│${NC}  npm run docker:logs    — ver logs        ${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  npm run docker:down    — detener         ${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  npm run docker:reset   — borrar y recrear${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  npm run tauri:dev      — app escritorio  ${GREEN}│${NC}"
echo -e "${GREEN}└──────────────────────────────────────────┘${NC}"
