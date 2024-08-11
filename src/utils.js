import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export function getDirName(url) {
  const __filename = fileURLToPath(url);
  return dirname(__filename);
}

function isRomanNumeralUnderFive(str) {
  const romanNumeralPattern = /^(I{1,3}|IV)$/;
  return romanNumeralPattern.test(str.toUpperCase());
}

function isSuffix(str) {
  const s = String(str)
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return s === "JR" || s === "SR" || isRomanNumeralUnderFive(s);
}

export function removeSuffix(name) {
  const splitName = String(name).split(" ");

  if (isSuffix(splitName.at(-1))) {
    splitName.pop();
  }

  return splitName.join(" ");
}

export function createNameMatcher(name) {
  return removeSuffix(String(name))
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}
