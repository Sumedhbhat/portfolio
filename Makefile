SHELL := /bin/sh

SOURCE := source/resume.tex
TEX_SOURCES := $(wildcard source/*.tex) $(wildcard source/config/*.tex) $(wildcard source/utils/*.tex) $(wildcard source/sections/*/*.tex) $(wildcard source/sections/*/*/*.tex)
BUILD_DIR := build
PDF := $(BUILD_DIR)/Sumedh_S_Bhat.pdf
LATEXMK := latexmk

.PHONY: all build check lint lint-section-includes test clean

all: check

build:
	@mkdir -p $(BUILD_DIR)
	$(LATEXMK) -pdf -file-line-error -halt-on-error -interaction=nonstopmode \
		-outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)

lint: lint-section-includes
	chktex -q -l .chktexrc $(TEX_SOURCES)

lint-section-includes:
	@sh scripts/lint-section-includes.sh

test:
	@sh tests/lint-section-includes.test.sh

check: test lint build
	@test -s $(PDF)
	@if grep -Eq 'Overfull \\hbox|fancyhdr Warning' $(BUILD_DIR)/Sumedh_S_Bhat.log; then \
		echo "Layout warning found in the LaTeX log"; \
		exit 1; \
	fi
	@echo "Created $(PDF)"

clean:
	$(LATEXMK) -C -outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)
	rm -rf $(BUILD_DIR)
