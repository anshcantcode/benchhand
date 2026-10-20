import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

const root = resolve("frontend");
const sample = process.argv.includes("--sample");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (sample && pathname === "/__sample.js") {
      response.writeHead(200, { "Content-Type": "text/javascript" });
      return response.end(await readFile(resolve("scripts/preview-sample.js")));
    }
    const path = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!path.startsWith(root + sep)) throw new Error("Invalid path");
    let body = await readFile(path);
    if (sample && path.endsWith("index.html"))
      body = String(body).replace(
        "<head>",
        '<head><script src="/__sample.js"></script>',
      );
    response.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log(
    sample
      ? "Preview with sample data: http://127.0.0.1:4173"
      : "Preview: http://127.0.0.1:4173 (native commands require the desktop app)",
  ),
);
