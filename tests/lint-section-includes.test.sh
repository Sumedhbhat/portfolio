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
