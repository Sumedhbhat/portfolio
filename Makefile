SHELL := /bin/sh

SOURCE := source/resume.tex
DATA := $(wildcard data/portfolio/*.json) src/data/portfolio.ts src/data/schema.ts
GENERATOR := scripts/generate-resume.ts
BUILD_DIR := build
GENERATED_TEX := $(BUILD_DIR)/generated/resume-content.tex
TEX_SOURCES := $(wildcard source/*.tex) $(wildcard source/config/*.tex) $(wildcard source/utils/*.tex) $(GENERATED_TEX)
PDF := $(BUILD_DIR)/Sumedh_S_Bhat.pdf
LATEXMK := latexmk

.PHONY: all build check generate lint test web-check clean

all: check

generate: $(GENERATED_TEX)

$(GENERATED_TEX): $(DATA) $(GENERATOR)
	@npm run generate:resume --silent

build: $(GENERATED_TEX)
	@mkdir -p $(BUILD_DIR)
	$(LATEXMK) -pdf -file-line-error -halt-on-error -interaction=nonstopmode \
		-outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)

lint: $(GENERATED_TEX)
	chktex -q -l .chktexrc $(TEX_SOURCES)

test:
	@npm test

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
	$(LATEXMK) -C -outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat $(SOURCE)
	rm -rf $(BUILD_DIR) dist
