# Resume Tracker

Version-controlled source for Sumedh S Bhat's resume. The resume is authored in
LaTeX, checked on pull requests, and published as a PDF in a GitHub release after
each merge to `master`.

## Project structure

```text
.
├── .github/workflows/resume.yml  # Pull-request checks and release automation
├── assets/profile.png            # Optional profile image from Overleaf
├── source/resume.tex             # Resume content and formatting
├── build/                         # Generated locally; ignored by Git
├── .chktexrc                      # LaTeX lint configuration
└── Makefile                       # Local build commands
```

## Build locally

Install a TeX distribution that provides `latexmk`, `pdflatex`, and `chktex`.
On macOS, [MacTeX](https://www.tug.org/mactex/) includes these tools.

```sh
make check
```

The generated file is `build/Sumedh_S_Bhat_Resume.pdf`.

Other useful commands:

```sh
make lint   # Check the LaTeX source
make build  # Compile without running the linter
make clean  # Remove generated files
```

## Editing and releasing

1. Create a branch from `master`.
2. Edit `source/resume.tex`.
3. Run `make check` and review the generated PDF.
4. Push the branch and open a pull request into `master`.
5. Merge after the **Resume / Check and build PDF** check passes.

Every push to `master` builds the same source again, creates a GitHub release,
and attaches `Sumedh_S_Bhat_Resume.pdf`. No GitHub secrets are required; the
workflow uses the repository's built-in `GITHUB_TOKEN`.

If the release step is blocked, open **Settings > Actions > General** in the
GitHub repository and set **Workflow permissions** to **Read and write**.

## First GitHub push

After creating an empty repository named `resume-tracker` on GitHub:

```sh
git remote add origin git@github.com:Sumedhbhat/resume-tracker.git
git push -u origin master
```

Then enable branch protection for `master` and require the
**Resume / Check and build PDF** status check before merging.
