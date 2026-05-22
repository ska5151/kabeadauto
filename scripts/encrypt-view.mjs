/**
 * .env용 VIEW 암호문 생성
 *
 * Usage:
 *   node scripts/encrypt-view.mjs kabeadksy
 */

import path from "path";
import { fileURLToPath } from "url";
import { encryptView } from "../lib/view-license.js";

const plain = process.argv[2];
if (!plain) {
  console.error("Usage: node scripts/encrypt-view.mjs <plain-text>");
  process.exit(1);
}

console.log(await encryptView(plain));
