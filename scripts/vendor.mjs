import { copyFile, mkdir } from "node:fs/promises";
await mkdir("frontend/vendor", { recursive: true });
await copyFile(
  "node_modules/marked/lib/marked.umd.js",
  "frontend/vendor/marked.js",
);
await copyFile(
  "node_modules/dompurify/dist/purify.min.js",
  "frontend/vendor/purify.js",
);
await copyFile("node_modules/marked/LICENSE", "frontend/vendor/marked.LICENSE");
await copyFile(
  "node_modules/dompurify/LICENSE",
  "frontend/vendor/purify.LICENSE",
);
