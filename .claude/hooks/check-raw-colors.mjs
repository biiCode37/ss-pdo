// PostToolUse (Edit/Write/MultiEdit): tandai warna mentah (hex/rgb/hsl) pada kode UI baru.
// Hanya memeriksa teks yang baru ditulis, sehingga utang lama tidak memicu peringatan.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const ti = input.tool_input ?? {};
const filePath = String(ti.file_path ?? "").replace(/\\/g, "/");

const inScope = /\/src\/.*\.(tsx|ts|css)$/.test(filePath);
const exempt =
  /\/src\/styles\/tokens\//.test(filePath) ||
  /sheetColorUtils\.ts$/.test(filePath) ||
  /\.test\.(ts|tsx)$/.test(filePath);
if (!inScope || exempt) process.exit(0);

const written = [ti.new_string, ti.content, ...(ti.edits ?? []).map((e) => e.new_string)]
  .filter(Boolean)
  .join("\n");

const pattern = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\b(?:rgba?|hsla?)\(/g;
const hits = [...new Set(written.match(pattern) ?? [])];

if (hits.length > 0) {
  process.stderr.write(
    `Warna mentah terdeteksi di ${filePath}: ${hits.slice(0, 8).join(", ")}. ` +
      "Ganti dengan token semantik dari src/styles/tokens/semantic.css (var(--color-...)) sesuai AGENTS.md.",
  );
  process.exit(2);
}
process.exit(0);
