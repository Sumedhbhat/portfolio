import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portfolio } from "../src/data/portfolio";
import { renderResume } from "../src/resume/render-resume";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "build/generated/resume-content.tex");

async function main() {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderResume(portfolio), "utf8");
  process.stdout.write(`Generated ${outputPath}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
