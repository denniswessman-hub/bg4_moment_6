import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const required = ["index.html", "styles.css", "app.js", "speaker-notes.js", "curriculum.js", "service-worker.js", "README.md", ".nojekyll"];
const failures = [];

for (const name of required) {
  if (!fs.existsSync(path.join(projectDir, name))) failures.push(`Saknad fil: ${name}`);
}

const textFiles = required.filter(name => name !== ".nojekyll");
const contents = Object.fromEntries(textFiles.map(name => [name, fs.readFileSync(path.join(projectDir, name), "utf8")]));

if (!contents["index.html"].includes('lang="sv"')) failures.push("HTML-språk saknas");
if (!contents["index.html"].includes('data-version="1.3.3"')) failures.push("Versionsmarkör saknas");
if (!fs.existsSync(path.join(projectDir, 'assets/bg4-oldboys.png'))) failures.push('Omslagsbild saknas');
if ((contents["index.html"].match(/class="slide(?:\s|\")/g) || []).length !== 10) failures.push("Fel antal presentationsbilder");
if (!contents["index.html"].includes("Rättsligt underlag")) failures.push("Källpanel saknas");
if (!contents["index.html"].includes("presenterDashboard")) failures.push("Presentatörsläge saknas");
if (!contents["app.js"].includes("serviceWorker.register")) failures.push("Offline-registrering saknas");

for (const [name, content] of Object.entries(contents)) {
  if (content.includes("�")) failures.push(`Ersättningstecken i ${name}`);
  if (/C:\\Users\\|file:\/\//i.test(content)) failures.push(`Lokal sökväg i ${name}`);
  if (/turn\d+(search|view|fetch)\d+/i.test(content)) failures.push(`Internt käll-id i ${name}`);
}

const localReferences = [...contents["index.html"].matchAll(/(?:href|src)="\.\/([^"#?]+)"/g)].map(match => match[1]);
for (const reference of localReferences) {
  if (!fs.existsSync(path.join(projectDir, reference))) failures.push(`Trasig lokal referens: ${reference}`);
}

const ids = [...contents["index.html"].matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) failures.push(`Dubbla id-attribut: ${[...new Set(duplicateIds)].join(", ")}`);

for (const reference of [...contents["index.html"].matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1])) {
  if (!ids.includes(reference)) failures.push(`Trasig aria-labelledby: ${reference}`);
}

for (const reference of [...contents["app.js"].matchAll(/getElementById\("([^"]+)"\)/g)].map(match => match[1])) {
  if (!ids.includes(reference)) failures.push(`JavaScript söker saknat id: ${reference}`);
}

if (/<button(?![^>]*\btype=)[^>]*>/i.test(contents["index.html"])) failures.push("Knapp utan type-attribut");
if (/target="_blank"(?![^>]*rel="noreferrer")/i.test(contents["index.html"])) failures.push("Extern länk saknar rel=noreferrer");

const css = contents["styles.css"];
if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) failures.push("Obalanserade klamrar i CSS");

if (failures.length) {
  console.error(`FAIL\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`PASS: ${required.length} filer, 10 bilder, källpanel, presentatörsläge, offline-stöd och lokala länkar.`);
