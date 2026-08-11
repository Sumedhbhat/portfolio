#!/bin/sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
linter="$project_root/scripts/lint-section-includes.sh"
fixture=$(mktemp -d "${TMPDIR:-/tmp}/lint-section-includes.XXXXXX")

trap 'rm -rf "$fixture"' EXIT HUP INT TERM

reset_fixture() {
    rm -rf "$fixture/source"
    mkdir -p "$fixture/source/sections/achievements"
    : > "$fixture/source/sections/achievements/_template.tex"
    : > "$fixture/source/sections/achievements/fil-bangalore-hackathon.tex"
}

run_linter() {
    (cd "$fixture" && sh "$linter")
}

fail() {
    printf 'not ok - %s\n' "$1" >&2
    exit 1
}

reset_fixture
cat > "$fixture/source/sections/achievements/section.tex" <<'EOF'
\section{Achievements}
\input{source/sections/achievements/fil-bangalore-hackathon}
EOF

if ! output=$(run_linter 2>&1); then
    printf '%s\n' "$output" >&2
    fail 'included entries pass linting'
fi
printf 'ok - included entries pass linting\n'

reset_fixture
cat > "$fixture/source/sections/achievements/section.tex" <<'EOF'
\section{Achievements}
EOF

if output=$(run_linter 2>&1); then
    fail 'missing entries fail linting'
fi

expected='error: source/sections/achievements/fil-bangalore-hackathon.tex is not included in source/sections/achievements/section.tex'
if ! printf '%s\n' "$output" | grep -Fq "$expected"; then
    printf '%s\n' "$output" >&2
    fail 'missing entries produce a useful error'
fi
printf 'ok - missing entries fail with a useful error\n'

reset_fixture
cat > "$fixture/source/sections/achievements/section.tex" <<'EOF'
\section{Achievements}
% \input{source/sections/achievements/fil-bangalore-hackathon}
EOF

if output=$(run_linter 2>&1); then
    fail 'commented inputs do not count as includes'
fi
printf 'ok - commented inputs do not count as includes\n'

reset_fixture
mkdir -p "$fixture/source/sections/achievements/acme"
: > "$fixture/source/sections/achievements/acme/senior-engineer.tex"
cat > "$fixture/source/sections/achievements/section.tex" <<'EOF'
\section{Achievements}
\input{source/sections/achievements/fil-bangalore-hackathon}
\input{source/sections/achievements/acme/section}
EOF
cat > "$fixture/source/sections/achievements/acme/section.tex" <<'EOF'
\input{source/sections/achievements/acme/senior-engineer}
EOF

if ! output=$(run_linter 2>&1); then
    printf '%s\n' "$output" >&2
    fail 'nested entries pass linting'
fi
printf 'ok - nested entries pass linting\n'

cat > "$fixture/source/sections/achievements/acme/section.tex" <<'EOF'
% \input{source/sections/achievements/acme/senior-engineer}
EOF

if output=$(run_linter 2>&1); then
    fail 'missing nested entries fail linting'
fi

expected='error: source/sections/achievements/acme/senior-engineer.tex is not included in source/sections/achievements/acme/section.tex'
if ! printf '%s\n' "$output" | grep -Fq "$expected"; then
    printf '%s\n' "$output" >&2
    fail 'missing nested entries produce a useful error'
fi
printf 'ok - missing nested entries fail with a useful error\n'
