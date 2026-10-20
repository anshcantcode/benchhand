import { copyFile, mkdir } from "node:fs/promises";
await mkdir("frontend/vendor/fonts", { recursive: true });
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
const font = "node_modules/@fontsource-variable/public-sans";
for (const subset of ["latin", "latin-ext"])
  await copyFile(
    `${font}/files/public-sans-${subset}-wght-normal.woff2`,
    `frontend/vendor/fonts/public-sans-${subset}.woff2`,
  );
await copyFile(`${font}/LICENSE`, "frontend/vendor/fonts/public-sans.LICENSE");
