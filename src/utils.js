import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export function getDirName(url) {
  const __filename = fileURLToPath(url);
  return dirname(__filename);
}
