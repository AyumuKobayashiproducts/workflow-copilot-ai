import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const enPath = path.join(root, "src", "messages", "en.json");
const jaPath = path.join(root, "src", "messages", "ja.json");

function keys(obj) {
  return Object.keys(obj).sort();
}

function diff(a, b) {
  const bs = new Set(b);
  return a.filter((k) => !bs.has(k));
}

const en = JSON.parse(await fs.readFile(enPath, "utf8"));
const ja = JSON.parse(await fs.readFile(jaPath, "utf8"));

const ek = keys(en);
const jk = keys(ja);

const missingInJa = diff(ek, jk);
const missingInEn = diff(jk, ek);

if (missingInJa.length || missingInEn.length) {
  console.error("i18n key mismatch detected.");
  if (missingInJa.length) console.error("Missing in ja.json:", missingInJa);
  if (missingInEn.length) console.error("Missing in en.json:", missingInEn);
  process.exit(1);
}

console.log(`OK: i18n keys match (count=${ek.length})`);


