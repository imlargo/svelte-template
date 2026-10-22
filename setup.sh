#!/usr/bin/env bash
# Regenera el template sobre una instalación nueva:
#   1. mueve todo lo actual a legacy/
#   2. crea app/ desde cero con lo instalable en su última versión, de forma interactiva
#      (sv create, skills, shadcn-svelte) y agrega todos los componentes de shadcn
#   3. trae solo el código propio del template desde legacy/
#   4. deja en legacy/ lo regenerado (config, app.d.ts, layout.css…) para comparar
set -euo pipefail

cd "$(dirname "$0")"

readonly LEGACY=legacy
readonly APP=app
readonly KEEP_AT_ROOT=(.git "$LEGACY" setup.sh reset.sh)

readonly DEPS=(zod @imlargo/air)
readonly DEV_DEPS=(lint-staged husky)

# Código propio: reemplaza lo que haya en app/.
readonly OWN=(
	src/env.ts
	src/hooks.client.ts
	src/hooks.server.ts
	src/lib/config
	src/lib/core
	src/lib/features
	src/lib/server
	src/lib/types
	src/lib/utils
	src/lib/components/blocks
	src/lib/components/coral
	src/lib/components/layout
	docs
	README.md
	AGENTS.md
	.github
	.husky
	.env
	.env.example
	.env.test
)

# Carpetas compartidas con lo instalado: solo se traen los archivos que app/ no tiene
# (p. ej. hooks/is-mobile.svelte.ts lo regenera shadcn).
readonly OWN_MERGE=(
	src/lib/hooks
	src/lib/assets
)

# Las rutas son propias, salvo el CSS que generan Tailwind y shadcn.
readonly ROUTES=src/routes
readonly ROUTES_GENERATED=(layout.css)

readonly SCAFFOLD_EXAMPLES=(src/lib/vitest-examples src/routes/demo)

# Ruido que no vale la pena comparar.
readonly COMPARE_IGNORE=(
	node_modules .svelte-kit .wrangler test-results
	pnpm-lock.yaml skills-lock.json .agents src/lib/components/ui
)

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

contains() {
	local needle=$1 item
	shift
	for item in "$@"; do
		[[ $item == "$needle" ]] && return 0
	done
	return 1
}

in_app() { (cd "$APP" && "$@"); }

move_to_legacy() {
	log "Moviendo el proyecto actual a $LEGACY/"
	if [[ -e $APP || -e $LEGACY ]]; then
		echo "Ya existe $APP/ o $LEGACY/: corre ./reset.sh antes." >&2
		exit 1
	fi
	mkdir "$LEGACY"
	shopt -s dotglob nullglob
	local item
	for item in *; do
		contains "$item" "${KEEP_AT_ROOT[@]}" || mv "$item" "$LEGACY/"
	done
	shopt -u dotglob nullglob
}

create_app() {
	log "Creando $APP/ con sv create (instala con pnpm: los pasos siguientes lo usan)"
	npx -y sv@latest create "$APP"
	rm -rf "${SCAFFOLD_EXAMPLES[@]/#/$APP/}"
}

install_skills() {
	log "Instalando skills"
	in_app pnpm dlx skills add huntabyte/shadcn-svelte
}

install_shadcn() {
	log "Instalando shadcn-svelte"
	in_app pnpm dlx shadcn-svelte@latest init
	in_app pnpm dlx shadcn-svelte@latest add -a -y -o
}

bring_own_code() {
	log "Trayendo el código propio desde $LEGACY/"
	local path
	for path in "${OWN[@]}"; do
		[[ -e $LEGACY/$path ]] || continue
		rm -rf "${APP:?}/$path"
		mkdir -p "$APP/$(dirname "$path")"
		mv "$LEGACY/$path" "$APP/$path"
	done

	local dir file
	for dir in "${OWN_MERGE[@]}"; do
		[[ -d $LEGACY/$dir ]] || continue
		mkdir -p "$APP/$dir"
		for file in "$LEGACY/$dir"/*; do
			[[ -e $APP/$dir/${file##*/} ]] || mv "$file" "$APP/$dir/"
		done
	done

	shopt -s dotglob nullglob
	for file in "$APP/$ROUTES"/*; do
		contains "${file##*/}" "${ROUTES_GENERATED[@]}" || rm -rf "$file"
	done
	for file in "$LEGACY/$ROUTES"/*; do
		contains "${file##*/}" "${ROUTES_GENERATED[@]}" || mv "$file" "$APP/$ROUTES/"
	done
	shopt -u dotglob nullglob
}

install_deps() {
	log "Instalando dependencias del template"
	in_app pnpm add "${DEPS[@]}"
	in_app pnpm add -D "${DEV_DEPS[@]}"

	# La config de lint-staged es del template, no del scaffold.
	node -e '
		const fs = require("fs");
		const [from, to] = process.argv.slice(1);
		const legacy = JSON.parse(fs.readFileSync(from, "utf8"));
		const app = JSON.parse(fs.readFileSync(to, "utf8"));
		if (legacy["lint-staged"]) app["lint-staged"] = legacy["lint-staged"];
		fs.writeFileSync(to, JSON.stringify(app, null, "\t") + "\n");
	' "$LEGACY/package.json" "$APP/package.json"

	# Genera worker-configuration.d.ts, que `check` y `build` exigen.
	in_app pnpm run gen
}

report_differences() {
	log "Archivos regenerados que difieren de tu versión (la tuya sigue en $LEGACY/)"
	local prune=() name file found=0
	for name in "${COMPARE_IGNORE[@]}"; do
		prune+=(-path "$LEGACY/$name" -prune -o)
	done
	while IFS= read -r -d '' file; do
		file=${file#"$LEGACY"/}
		if [[ -f $APP/$file ]] && ! cmp -s "$LEGACY/$file" "$APP/$file"; then
			echo "  diff $LEGACY/$file $APP/$file"
			found=1
		fi
	done < <(find "$LEGACY" "${prune[@]}" -type f -print0 | sort -z)
	((found)) || echo "  Ninguno."
}

move_to_legacy
create_app
install_skills
install_shadcn
bring_own_code
install_deps
report_differences
log "Listo"
