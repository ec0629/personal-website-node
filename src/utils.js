import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function setTimeRemaining(futureTimeVal) {
  const countDownDate = new Date(futureTimeVal).getTime();
  const now = new Date().getTime();
  const distance = countDownDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

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
