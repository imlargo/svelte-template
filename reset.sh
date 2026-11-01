#!/usr/bin/env bash
# Deja el repo como en el último commit: descarta cambios y borra todo lo no versionado
# o ignorado (app/, legacy/, node_modules, builds…), salvo estos scripts y el .env local.
set -euo pipefail

cd "$(dirname "$0")"

# setup.sh se lleva el .env a app/ (o lo deja en legacy/ si falló a medias): se rescata.
if [[ ! -e .env ]]; then
	for candidate in app/.env legacy/.env; do
		if [[ -e $candidate ]]; then
			mv "$candidate" .env
			break
		fi
	done
fi

# reset --hard devolvería los scripts a su versión del commit: se guardan los locales.
readonly SCRIPTS=(setup.sh reset.sh init.sh)
backup=$(mktemp -d)
cp "${SCRIPTS[@]}" "$backup/"

git reset --hard HEAD
git clean -ffdx -e /setup.sh -e /reset.sh -e /init.sh -e /.env

mv "${SCRIPTS[@]/#/$backup/}" .
rmdir "$backup"
