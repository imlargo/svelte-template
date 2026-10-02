#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 1. Mover todo (excepto legacy, .git y este script) a legacy/
script="$(basename "$0")"
mkdir -p legacy
for item in * .*; do
  case "$item" in
    . | .. | legacy | .git | "$script") continue ;;
  esac
  [ -e "$item" ] || continue
  mv "$item" legacy/
done

# 2. Crear la app
npx sv create app

# 3. Limpiar ejemplos y configurar shadcn-svelte
cd app
rm -rf src/lib/vitest-examples src/routes/demo
pnpm dlx skills add huntabyte/shadcn-svelte
pnpm dlx shadcn-svelte@latest init
pnpm dlx shadcn-svelte@latest add -y -a -o

# 4. Rescatar lo útil de legacy/ y limpiar lo que no se usa
cd ..
rm -rf legacy/.agents/skills/shadcn-svelte legacy/.claude legacy/shadcn-svelte
mv legacy/.github legacy/.husky app/
mkdir -p app/.vscode
mv legacy/.vscode/mcp.json app/.vscode/
mv legacy/.env.example legacy/.env.test legacy/AGENTS.md legacy/CLAUDE.md app/
