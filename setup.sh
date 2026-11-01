#!/usr/bin/env bash
# Rebuilds the template from scratch on the latest versions of everything:
#   1. moves the current project to legacy/
#   2. creates app/ with the interactive installers: sv create, skills, shadcn-svelte init
#      and Coral, then adds every shadcn-svelte component
#   3. carries over the template's own code and installs its dependencies
#   4. lists the files that differ, the ones the scaffold added and the ones only legacy/
#      has, to review before promoting app/
# Config files keep the scaffold's version, so new defaults show up in the review.
set -euo pipefail

cd "$(dirname "$0")"

readonly LEGACY=legacy
readonly APP=app
readonly SCRIPTS=(setup.sh reset.sh init.sh)
readonly KEEP_AT_ROOT=(.git "$LEGACY" "${SCRIPTS[@]}")

readonly UI_DIR=src/lib/components/ui
readonly CORAL_REGISTRY=https://coral.imlargo.dev/r/coral.json

# Fails svelte-check with the current shadcn-svelte (huntabyte/shadcn-svelte#2944).
readonly UI_EXCLUDED=(native-select)

# Welcome page and sample code from sv create.
readonly SCAFFOLD_EXAMPLES=(
	src/lib/vitest-examples
	src/routes/demo
	src/routes/+page.svelte
	src/routes/page.svelte.e2e.ts
)

# The template's code. On a clash it wins and the scaffold's file goes to legacy/.
readonly OWN=(
	src/env.ts
	src/hooks.client.ts
	src/hooks.server.ts
	src/routes
	src/lib/config
	src/lib/core
	src/lib/features
	src/lib/server
	src/lib/types
	src/lib/utils
	src/lib/components/blocks
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

# Config generated inside the template's folders: the installed version wins.
readonly NOT_CARRIED=(src/routes/layout.css)

# Shared with what gets installed (shadcn writes hooks/is-mobile.svelte.ts, sv the
# favicon). On a clash the installed file wins and the template's stays in legacy/.
readonly SHARED=(src/lib/hooks src/lib/assets static)

readonly CORAL_DIR=src/lib/components/coral
# Written by shadcn-svelte outside ui/.
readonly SHADCN_FILES=(src/lib/highlighter.ts src/lib/hooks/is-mobile.svelte.ts src/lib/hooks/use-highlighted-code.svelte.ts)

# Installed with the template's version range instead of the latest: vaul-svelte's latest
# is the old 0.x line (shadcn uses `next`), and @types/node follows the Node runtime.
readonly KEEP_RANGE=(vaul-svelte @types/node)

# Left out of the final review: generated, reinstalled or untouchable.
readonly REVIEW_IGNORE=(
	.git node_modules .svelte-kit .wrangler test-results worker-configuration.d.ts
	pnpm-lock.yaml skills-lock.json .agents .claude/skills "$UI_DIR" "$CORAL_DIR" "${SHADCN_FILES[@]}"
)

# Paths where app/ holds the template's version and legacy/ the scaffold's.
swapped=()
# Files the scaffold created that the template did not have.
added=()

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

check_clean_tree() {
	if [[ -e $APP || -e $LEGACY ]]; then
		echo "$APP/ or $LEGACY/ already exists: run ./reset.sh first." >&2
		exit 1
	fi
	if [[ -n $(git status --porcelain -- . "${SCRIPTS[@]/#/:!}") ]]; then
		echo "The working tree has changes: commit or stash them first." >&2
		exit 1
	fi
}

move_to_legacy() {
	log "Moving the current project to $LEGACY/"
	mkdir "$LEGACY"
	shopt -s dotglob nullglob
	local item
	for item in *; do
		contains "$item" "${KEEP_AT_ROOT[@]}" || mv "$item" "$LEGACY/"
	done
	shopt -u dotglob nullglob
}

create_app() {
	log "Creating $APP/ with sv create (pick pnpm: the next steps use it)"
	npx -y sv@latest create "$APP"
	rm -rf "${SCAFFOLD_EXAMPLES[@]/#/$APP/}"
}

install_skills() {
	log "Installing the skills in $LEGACY/skills-lock.json"
	local sources source
	# Read up front: the installer prompts need stdin.
	mapfile -t sources < <(node -e '
		const lock = require(process.argv[1]);
		for (const source of new Set(Object.values(lock.skills).map((s) => s.source))) console.log(source);
	' "$PWD/$LEGACY/skills-lock.json")
	for source in "${sources[@]}"; do
		in_app pnpm dlx skills add "$source"
	done
}

install_components() {
	log "Installing shadcn-svelte"
	in_app pnpm dlx shadcn-svelte@latest init

	# Coral before `add -a`: it installs the shadcn primitives it is built on, and
	# `add -a` then leaves every primitive on its latest version.
	log "Installing Coral"
	in_app pnpm dlx shadcn-svelte@latest add "$CORAL_REGISTRY"

	log "Adding every shadcn-svelte component"
	in_app pnpm dlx shadcn-svelte@latest add -a -y -o
	rm -rf "${UI_EXCLUDED[@]/#/$APP/$UI_DIR/}"
}

# Moves every file under legacy/$1 into app/. On a clash, `own` swaps the two files and
# `installed` leaves the template's file in legacy/; the review lists both.
carry() {
	local path=$1 policy=$2 file rel
	[[ -e $LEGACY/$path ]] || return 0
	while IFS= read -r -d '' file; do
		rel=${file#"$LEGACY"/}
		contains "$rel" "${NOT_CARRIED[@]}" && continue
		if [[ ! -e $APP/$rel ]]; then
			mkdir -p "$APP/$(dirname "$rel")"
			mv "$file" "$APP/$rel"
		elif [[ $policy == own ]] && ! cmp -s "$file" "$APP/$rel"; then
			mv "$APP/$rel" "$file.scaffold"
			mv "$file" "$APP/$rel"
			mv "$file.scaffold" "$file"
			swapped+=("$rel")
		fi
	done < <(find "$LEGACY/$path" \( -type f -o -type l \) -print0)
}

take_own_code() {
	log "Carrying over the template's code"
	local path
	for path in "${OWN[@]}"; do
		carry "$path" own
	done
	for path in "${SHARED[@]}"; do
		carry "$path" installed
	done
}

# Installs, at their latest versions, the dependencies the template had and app/ lacks,
# and adds the package.json keys and scripts the scaffold does not define.
merge_package_json() {
	log "Installing the template's dependencies"
	local field flag specs
	for field in dependencies devDependencies; do
		[[ $field == devDependencies ]] && flag=--save-dev || flag=--save-prod
		specs=$(node -e '
			const [legacy, app, field, ...keepRange] = process.argv.slice(1);
			const from = require(legacy), to = require(app);
			const have = { ...to.dependencies, ...to.devDependencies };
			for (const [name, range] of Object.entries(from[field] ?? {})) {
				if (!(name in have)) console.log(keepRange.includes(name) ? `${name}@${range}` : name);
			}
		' "$PWD/$LEGACY/package.json" "$PWD/$APP/package.json" "$field" "${KEEP_RANGE[@]}")
		[[ -n $specs ]] || continue
		mapfile -t specs <<<"$specs"
		in_app pnpm add "$flag" "${specs[@]}"
	done

	node -e '
		const fs = require("fs");
		const [from, to] = process.argv.slice(1);
		const legacy = JSON.parse(fs.readFileSync(from, "utf8"));
		const app = JSON.parse(fs.readFileSync(to, "utf8"));
		app.scripts = { ...legacy.scripts, ...app.scripts };
		for (const [key, value] of Object.entries(legacy)) if (!(key in app)) app[key] = value;
		fs.writeFileSync(to, JSON.stringify(app, null, "\t") + "\n");
	' "$LEGACY/package.json" "$APP/package.json"

	in_app pnpm run --if-present gen
}

# Prints, NUL-separated and relative to $1, every file under $1 the review looks at.
review_files() {
	local root=$1 prune=() name
	for name in "${REVIEW_IGNORE[@]}"; do
		prune+=(-path "$root/$name" -prune -o)
	done
	find "$root" "${prune[@]}" \( -type f -o -type l \) -printf '%P\0' | sort -z
}

exists() { [[ -e $1 || -L $1 ]]; }

# Run before carrying anything over, while app/ holds only what was installed.
record_added() {
	local rel
	while IFS= read -r -d '' rel; do
		exists "$LEGACY/$rel" || added+=("$rel")
	done < <(review_files "$APP")
}

print_list() {
	(($#)) || { echo "  None."; return; }
	printf '  %s\n' "$@"
}

review() {
	local rel changed=() removed=() lines=()
	while IFS= read -r -d '' rel; do
		if ! exists "$APP/$rel"; then
			removed+=("$LEGACY/$rel")
		elif [[ -f $LEGACY/$rel && -f $APP/$rel ]] && ! cmp -s "$LEGACY/$rel" "$APP/$rel"; then
			changed+=("$rel")
		fi
	done < <(review_files "$LEGACY")

	for rel in "${changed[@]}"; do
		if contains "$rel" "${swapped[@]}"; then
			lines+=("diff $LEGACY/$rel $APP/$rel    # app/ has yours")
		else
			lines+=("diff $LEGACY/$rel $APP/$rel    # app/ has the new version")
		fi
	done

	log "Files that differ between $LEGACY/ and $APP/"
	print_list "${lines[@]}"
	log "New in the scaffold, not in the template"
	print_list "${added[@]/#/$APP/}"
	log "Only in $LEGACY/: dropped by the new scaffold, or never carried over"
	print_list "${removed[@]}"
}

check_clean_tree
move_to_legacy
create_app
install_skills
install_components
record_added
take_own_code
merge_package_json
review

cat <<EOF

Next: go through the diffs above, bring into $APP/ what you want to keep, then replace the
project with $APP/ and run \`pnpm run check\` and \`pnpm run test\`.
EOF
