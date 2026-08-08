SHELL := /bin/sh

SOURCE := source/resume.tex
BUILD_DIR := build
PDF := $(BUILD_DIR)/Sumedh_S_Bhat_Resume.pdf
LATEXMK := latexmk

.PHONY: all build check lint clean

all: check

build:
	@mkdir -p $(BUILD_DIR)
	$(LATEXMK) -pdf -file-line-error -halt-on-error -interaction=nonstopmode \
		-outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat_Resume $(SOURCE)

lint:
	chktex -q -l .chktexrc $(SOURCE)

check: lint build
	@test -s $(PDF)
	@if grep -Eq 'Overfull \\hbox|fancyhdr Warning' $(BUILD_DIR)/Sumedh_S_Bhat_Resume.log; then \
		echo "Layout warning found in the LaTeX log"; \
		exit 1; \
	fi
	@echo "Created $(PDF)"

clean:
	$(LATEXMK) -C -outdir=$(BUILD_DIR) -jobname=Sumedh_S_Bhat_Resume $(SOURCE)
	rm -rf $(BUILD_DIR)
