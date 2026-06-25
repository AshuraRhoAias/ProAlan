# MastrFlow — comandos principales
.PHONY: setup dev build server stop logs reset help

## setup   : Inicia Docker, crea la base de datos y levanta la API
setup:
	@bash scripts/setup.sh

## dev     : Levanta DB + API en Docker y abre la app Tauri en modo desarrollo
dev: setup
	npm run tauri:dev

## build   : Compila la app Tauri para el sistema operativo actual
build:
	npm run tauri:build

## server  : Sólo levanta los contenedores Docker (MySQL + API)
server:
	docker compose up -d --build

## stop    : Detiene todos los contenedores
stop:
	docker compose down

## logs    : Muestra logs de la API en tiempo real
logs:
	docker compose logs -f api

## reset   : Elimina volúmenes y recrea la base de datos desde cero
reset:
	docker compose down -v
	docker compose up -d --build
	@bash scripts/setup.sh

## help    : Muestra esta ayuda
help:
	@grep -E '^##' Makefile | sed 's/## /  /'
