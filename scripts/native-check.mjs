import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { randomUUID, generateKeyPairSync, sign } from "node:crypto";
import { checkFeatures } from "./native-features.mjs";

if (process.platform !== "win32")
  throw new Error("This native WebView2 check runs on Windows.");
const root = resolve(".native-check");
const directory = resolve(root, randomUUID());
if (!directory.startsWith(root + sep))
  throw new Error("Invalid test workspace");
await mkdir(directory, { recursive: true });
await mkdir("design/screenshots", { recursive: true });
let externalCalls = 0;
let inspection = {};
const publisher = generateKeyPairSync("ed25519");
const publisherKey = publisher.publicKey
  .export({ type: "spki", format: "der" })
  .subarray(-32)
  .toString("base64");
const catalog = Buffer.from(
  JSON.stringify({
    plugins: [
      {
        id: "test/signed-theme",
        name: "Signed theme",
        description: "Test signed catalog",
        version: "1.0.0",
        theme: { accent: "#83c9f4" },
      },
    ],
  }),
);
const signature = sign(null, catalog, publisher.privateKey).toString("base64");
const fixture = createServer(async (request, response) => {
  if (request.url === "/catalog.json" || request.url === "/catalog.json.sig") {
    response.writeHead(200, { "Content-Type": "application/octet-stream" });
    response.end(request.url.endsWith(".sig") ? signature : catalog);
    return;
  }
  let source = "";
  for await (const chunk of request) source += chunk;
  const body = source ? JSON.parse(source) : {};
  let result;
  if (request.url === "/v1/models")
    result = { data: [{ id: "native-check-model" }] };
  else if (request.url === "/v1/chat/completions") {
    const results = body.messages.filter((m) => m.role === "tool");
    const prompt = body.messages[1].content;
    const reply = (message) => ({ choices: [{ message }] });
    const call = (name, args, id = "feature-call") => ({
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id,
          type: "function",
          function: { name, arguments: JSON.stringify(args) },
        },
      ],
    });
    let feature;
    if (prompt.startsWith("Delegation integration"))
      feature = results.length
        ? {
            role: "assistant",
            content: "Delegated result received: " + results[0].content,
          }
        : call("delegate_task", {
            botId: "operations",
            title: "Delegated fixture work",
            description: "Return the fixture result.",
          });
    else if (prompt.startsWith("Delegated fixture work"))
      feature = { role: "assistant", content: "Delegated fixture result" };
    else if (prompt.startsWith("Routine integration"))
      feature = { role: "assistant", content: "Scheduled task finished" };
    else if (prompt.startsWith("Native inspect integration")) {
      if (!results.length) {
        feature = call("computer_displays", {});
        feature.tool_calls.push({
          ...call("computer_windows", {}, "windows-call").tool_calls[0],
        });
      } else {
        for (const result of results) {
          Object.assign(inspection, JSON.parse(result.content));
        }
        feature = { role: "assistant", content: "Inspection complete" };
      }
    } else if (prompt.startsWith("Native action ")) {
      const action = JSON.parse(prompt.split("\n\n").slice(1).join("\n\n"));
      if (results.length) {
        if (JSON.parse(results[0].content).error)
          throw Error(results[0].content);
        feature = { role: "assistant", content: "Native action completed" };
      } else feature = call(action.name, action.args);
    }
    if (feature) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(reply(feature)));
      return;
    }
    const tool =
      results.length === 0
        ? {
            name: "workspace_write",
            arguments: JSON.stringify({
              path: "native-result.md",
              content: "Written by the real Rust task runtime.",
            }),
          }
        : results.length === 1
          ? {
              name: body.tools.find((t) => t.function.name.startsWith("mcp_"))
                .function.name,
              arguments: JSON.stringify({
                message: "Exactly this approved action.",
              }),
            }
          : null;
    result = {
      choices: [
        {
          message: tool
            ? {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: `call-${results.length}`,
                    type: "function",
                    function: tool,
                  },
                ],
              }
            : {
                role: "assistant",
                content:
                  "## Native desktop check complete\n\nThe Rust runtime saved the artifact and executed the approved tool once.",
              },
        },
      ],
    };
  } else if (body.method === "initialize")
    result = {
      jsonrpc: "2.0",
      id: body.id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "Native test tools", version: "1" },
      },
    };
  else if (body.method === "tools/list")
    result = {
      jsonrpc: "2.0",
      id: body.id,
      result: {
        tools: [
          {
            name: "reviewed_action",
            description: "A local test action with no external effects.",
            inputSchema: {
              type: "object",
              properties: { message: { type: "string" } },
              required: ["message"],
            },
          },
        ],
      },
    };
  else if (body.method === "tools/call") {
    if (body.params.arguments.message !== "Exactly this approved action.")
      throw new Error("Approval payload changed");
    externalCalls++;
    result = {
      jsonrpc: "2.0",
      id: body.id,
      result: {
        content: [{ type: "text", text: "The local test action completed." }],
      },
    };
  } else {
    response.writeHead(202);
    response.end();
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(result));
});
await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
const endpoint = `http://127.0.0.1:${fixture.address().port}`;
const debugReservation = createServer();
await new Promise((resolve) =>
  debugReservation.listen(0, "127.0.0.1", resolve),
);
const debugPort = debugReservation.address().port;
await new Promise((resolve) => debugReservation.close(resolve));
const app = spawn(
  resolve("src-tauri/target/release/benchhand.exe"),
  [],
  {
    windowsHide: true,
    env: {
      ...process.env,
      TEAMMATE_DATA_DIR: directory,
      WEBVIEW2_USER_DATA_FOLDER: resolve(directory, "webview"),
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${debugPort} --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows`,
    },
    stdio: "ignore",
  },
);
let browser;
try {
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok;
        } catch {
          return false;
        }
      },
      { timeout: 60000 },
    )
    .toBe(true);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
  const context = browser.contexts()[0];
  await expect.poll(() => context.pages().length).toBeGreaterThan(0);
  const page = context.pages()[0];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.locator("#setup-owner")).toBeVisible();
  await page.locator("#setup-owner").fill("Native check");
  await page.locator("#setup-workspace").fill("Isolated desktop check");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Keep it local/ }).click();
  await page.locator("[name=label]").fill("Local test model");
  await page.locator("[name=baseUrl]").fill(`${endpoint}/v1`);
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await expect(page.locator("dialog [name=model]")).toHaveValue(
    "native-check-model",
  );
  await page.getByRole("button", { name: "Verify & connect" }).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Explore first" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Connections" })
    .click();
  await page.getByRole("button", { name: "Add MCP server" }).click();
  await page.locator("[name=label]").fill("Local test tools");
  await page.locator("[name=baseUrl]").fill(`${endpoint}/mcp`);
  await page.getByRole("button", { name: "Verify & connect" }).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await page.locator("nav").getByRole("button", { name: "Overview" }).click();
  await page
    .getByRole("textbox", { name: "Task goal" })
    .fill("Check the native task and approval workflow");
  await page.getByRole("button", { name: "Start task", exact: true }).click();
  await expect(
    page.getByText("Run an imported tool", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".approval-payload")).toContainText(
    "Exactly this approved action.",
  );
  if (externalCalls !== 0) throw new Error("Tool ran before approval");
  await page.screenshot({
    path: "design/screenshots/native-approval.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve & continue" }).click();
  await expect(page.locator(".markdown h2")).toHaveText(
    "Native desktop check complete",
    { timeout: 15000 },
  );
  if (externalCalls !== 1)
    throw new Error(`Expected one approved tool call, got ${externalCalls}`);
  const artifact = await readFile(
    resolve(directory, "workspaces/research/native-result.md"),
    "utf8",
  );
  if (artifact !== "Written by the real Rust task runtime.")
    throw new Error("Workspace artifact was not saved");
  if (errors.length) throw new Error(errors.join("\n"));
  await page.screenshot({
    path: "design/screenshots/native-result.png",
    fullPage: true,
  });
  console.log(
    "Native desktop check passed: real WebView2 → Rust IPC → model HTTP → workspace write → approval → MCP tool → saved result.",
  );
  await checkFeatures(page, {
    directory,
    endpoint,
    pid: app.pid,
    inspect: () => inspection,
    publisherKey,
  });
} finally {
  if (browser) await browser.close().catch(() => {});
  app.kill();
  fixture.close();
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!directory.startsWith(root + sep))
    throw new Error("Refusing to remove an unexpected test directory");
  await rm(directory, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 500,
  });
}
