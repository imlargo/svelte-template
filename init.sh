#!/usr/bin/env bash
# Creates a fresh SvelteKit project in app/ with the shadcn-svelte skill and every shadcn
# component. sv, skills and shadcn init run interactively: pick pnpm in sv create.
set -euo pipefail

cd "$(dirname "$0")"

readonly APP=app

if [[ -e $APP ]]; then
	echo "$APP/ already exists." >&2
	exit 1
fi

npx -y sv@latest create "$APP"
cd "$APP"
pnpm dlx skills add huntabyte/shadcn-svelte
pnpm dlx shadcn-svelte@latest init
pnpm dlx shadcn-svelte@latest add -a -y -o
