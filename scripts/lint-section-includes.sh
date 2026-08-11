#!/bin/sh

set -eu

status=0

for section_file in source/sections/*/section.tex source/sections/*/*/section.tex; do
    [ -f "$section_file" ] || continue
    section_directory=${section_file%/section.tex}

    for entry_file in "$section_directory"/*.tex "$section_directory"/*/section.tex; do
        [ -f "$entry_file" ] || continue
        [ "$entry_file" = "$section_file" ] && continue

        entry_name=${entry_file##*/}

        case "$entry_name" in
            _template.tex)
                continue
                ;;
        esac

        input_path=${entry_file%.tex}

        if ! sed 's/%.*//' "$section_file" | grep -Fq "\\input{$input_path}"; then
            printf 'error: %s is not included in %s\n' "$entry_file" "$section_file" >&2
            printf '  Add: \\input{%s}\n' "$input_path" >&2
            status=1
        fi
    done
done

exit "$status"
