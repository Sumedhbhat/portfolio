SHELL := /bin/sh

SOURCE := source/resume.tex
BUILD_DIR := build
# ChkTeX treats Lua strings embedded in TeX as TeX source. Those section files are
# validated by the Lua test and the full LuaLaTeX build instead.
CHK_TEX_SOURCES := $(wildcard source/*.tex) $(wildcard source/config/*.tex) \
	$(wildcard source/utils/*.tex) source/sections/summary.tex
PDF := $(BUILD_DIR)/Sumedh_S_Bhat.pdf
LATEXMK := latexmk

.PHONY: all build check lint test web-check clean

all: check

build:
	@mkdir -p $(BUILD_DIR)
	$(LATEXMK) -lualatex -file-line-error -halt-on-error -interaction=nonstopmode \
		-outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)

lint:
	chktex -q -I0 -l .chktexrc $(CHK_TEX_SOURCES)

test:
	@npm test
	@texlua tests/resume-data.lua

web-check:
	@npm run build

check: test lint build web-check
	@test -s $(PDF)
	@if grep -Eq 'Overfull \\hbox|fancyhdr Warning' $(BUILD_DIR)/Sumedh_S_Bhat.log; then \
		echo "Layout warning found in the LaTeX log"; \
		exit 1; \
	fi
	@echo "Created $(PDF)"

clean:
	$(LATEXMK) -C -lualatex -outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)
	rm -rf $(BUILD_DIR) dist
