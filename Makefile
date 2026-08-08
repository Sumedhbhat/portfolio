SHELL := /bin/sh

SOURCE := source/resume.tex
TEX_SOURCES := $(wildcard source/*.tex) $(wildcard source/config/*.tex) $(wildcard source/utils/*.tex) $(wildcard source/sections/*/*.tex)
BUILD_DIR := build
PDF := $(BUILD_DIR)/Sumedh_S_Bhat.pdf
LATEXMK := latexmk

.PHONY: all build check lint clean

all: check

build:
	@mkdir -p $(BUILD_DIR)
	$(LATEXMK) -pdf -file-line-error -halt-on-error -interaction=nonstopmode \
		-outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)

lint:
	chktex -q -l .chktexrc $(TEX_SOURCES)

check: lint build
	@test -s $(PDF)
	@if grep -Eq 'Overfull \\hbox|fancyhdr Warning' $(BUILD_DIR)/Sumedh_S_Bhat.log; then \
		echo "Layout warning found in the LaTeX log"; \
		exit 1; \
	fi
	@echo "Created $(PDF)"

clean:
	$(LATEXMK) -C -outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)
	rm -rf $(BUILD_DIR)
