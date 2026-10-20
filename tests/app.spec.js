import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("plugin review renders publisher text without interpreting HTML", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Marketplace" })
    .click();
  await page
    .getByRole("button", { name: "Import plugin", exact: true })
    .click();
  const name = '<img src=x onerror="window.unsafe=true">';
  await page
    .locator("[name=manifest]")
    .fill(
      JSON.stringify({
        id: "test/hostile-title",
        name,
        version: "<b>1</b>",
        runtime: { kind: "http", url: "https://example.org/mcp" },
      }),
    );
  await page
    .getByRole("button", { name: "Review plugin", exact: true })
    .click();
  await expect(page.locator("#dialog-title")).toHaveText(name);
  await expect(page.locator("dialog img")).toHaveCount(0);
  expect(await page.evaluate(() => window.unsafe)).toBeUndefined();
});

test("marketplace reviews installs disables and removes a plugin", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Marketplace" })
    .click();
  await page.getByRole("button", { name: "Review & install" }).click();
  await expect(page.locator(".runtime-review")).toContainText(
    "https://example.org/mcp",
  );
  await page
    .getByRole("button", { name: "Install plugin", exact: true })
    .click();
  await expect(page.locator(".catalog-card h3")).toHaveText("Browser tools");
  await page.getByRole("button", { name: "Disable", exact: true }).click();
  await expect(page.locator(".catalog-card .tag")).toHaveText("Disabled");
  await page.getByRole("button", { name: "Uninstall Browser tools" }).click();
  await page
    .getByRole("button", { name: "Uninstall plugin", exact: true })
    .click();
  await expect(page.getByText("No plugins installed")).toBeVisible();
});
test("routines save weekly timing context and enabled state", async ({
  page,
}) => {
  await nativeFixture(page);
  await page.locator("nav").getByRole("button", { name: "Routines" }).click();
  await page.getByRole("button", { name: "New routine" }).click();
  await page.locator("[name=name]").fill("Weekly review");
  await page.locator("[name=title]").fill("Review project issues");
  await page
    .locator("[name=description]")
    .fill("Ask Forge for an engineering summary.");
  await page.locator("#schedule-kind").selectOption("weekly");
  await page.locator("[name=timezone]").fill("Asia/Kolkata");
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(page.locator(".routine-card h3")).toHaveText("Weekly review");
  const saved = await page.evaluate(() => window.fixtureState.schedules[0]);
  expect(saved.config.kind).toBe("weekly");
  expect(saved.config.days).toEqual([1, 2, 3, 4, 5]);
  expect(saved.enabled).toBe(true);
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByText("No runs yet.")).toBeVisible();
});
test("computer access explicitly selects teammates input and expiry", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Computer", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Capture screen" }),
  ).toBeDisabled();
  await page.locator("[name=botIds][value=research]").check();
  await page.locator("[name=allowInput]").check();
  await page.getByRole("button", { name: "Enable reviewed access" }).click();
  await expect(page.getByText("Access active", { exact: true })).toBeVisible();
  const settings = await page.evaluate(() => window.fixtureState.settings);
  expect(settings.computerBotIds).toEqual(["research"]);
  expect(settings.computerInput).toBe(true);
  await page.getByRole("button", { name: "Stop access" }).click();
  await expect(page.getByText("Access off", { exact: true })).toBeVisible();
});

async function nativeFixture(page, { setup = true, connected = true } = {}) {
  await page.addInitScript(
    ({ setup, connected }) => {
      const now = Math.floor(Date.now() / 1000);
      const saved = sessionStorage.getItem("fixture");
      const state = saved
        ? JSON.parse(saved)
        : {
            settings: {
              workspaceName: "Ansh’s workspace",
              ownerName: "Ansh",
              theme: "dark",
              accent: "#b4a0ff",
              density: "comfortable",
              fontSize: 14,
              radius: 14,
              sidebarCompact: false,
              reduceMotion: true,
              font: "sans",
              background: "glow",
              defaultView: "home",
              showActivity: true,
              showStarters: true,
              setupComplete: setup,
              maxSteps: 12,
            },
            bots: [
              {
                id: "research",
                name: "Scout",
                role: "Research & discovery",
                description:
                  "A curious mind for the things you want to understand. Clear answers, thoughtful research, fresh perspective.",
                instructions: "Research carefully.",
                color: "#b4a0ff",
                providerId: connected ? "model-1" : "",
              },
              {
                id: "operations",
                name: "Atlas",
                role: "Plans & operations",
                description:
                  "Brings a little order to your everyday. Plans, priorities, and the next step worth taking.",
                instructions: "Be practical.",
                color: "#8bd7b6",
                providerId: connected ? "model-1" : "",
              },
              {
                id: "code",
                name: "Forge",
                role: "Code & creation",
                description:
                  "Your partner for building things. From a rough idea to the details that make it work.",
                instructions: "Build reliable code.",
                color: "#efb47c",
                providerId: connected ? "model-1" : "",
              },
            ],
            tasks: connected
              ? [
                  {
                    id: "task-1",
                    title: "A clearer plan for this week",
                    description: "Help prioritize the work.",
                    botId: "operations",
                    botName: "Atlas",
                    status: "completed",
                    createdAt: now - 2600,
                    updatedAt: now - 1800,
                    output:
                      '## Your next three moves\n\n1. Finish the launch brief.\n2. Review the open issues.\n3. Make room for deep work.\n\n<script>window.unsafe=true</script><img src=x onerror="window.unsafe=true">',
                    error: "",
                    waitingApproval: false,
                  },
                ]
              : [],
            connections: connected
              ? [
                  {
                    id: "model-1",
                    kind: "model",
                    label: "Local intelligence",
                    account: "qwen3:8b",
                    verifiedAt: now,
                    config: {
                      baseUrl: "http://127.0.0.1:11434/v1",
                      model: "qwen3:8b",
                      protocol: "chat",
                      toolMode: "native",
                      hasSecret: false,
                    },
                  },
                  {
                    id: "github-1",
                    kind: "github",
                    label: "GitHub",
                    account: "anshcantcode",
                    verifiedAt: now,
                    config: { hasSecret: true },
                  },
                  {
                    id: "slack-1",
                    kind: "slack",
                    label: "Design studio",
                    account: "Design studio · Ansh",
                    verifiedAt: now,
                    config: { hasSecret: true },
                  },
                ]
              : [],
            approvals: [],
            device: {
              os: "windows",
              arch: "x86_64",
              threads: 16,
              version: "0.3.0",
            },
          };
      const persist = () =>
        sessionStorage.setItem("fixture", JSON.stringify(state));
      const clone = (value) => JSON.parse(JSON.stringify(value));
      window.fixtureState = state;
      window.commandCalls = [];
      window.__TAURI__ = {
        event: { listen: async () => () => {} },
        core: {
          invoke: async (command, args) => {
            window.commandCalls.push({ command, args });
            if (window.rejectCommand === command)
              throw new Error(
                "The service could not be reached. Check the endpoint and try again.",
              );
            let result;
            switch (command) {
              case "autostart_status":
                return {
                  enabled: false,
                  desktop: { tray: true, emergencyShortcut: true },
                };
              case "set_autostart":
                return {
                  enabled: args.enabled,
                  desktop: { tray: true, emergencyShortcut: true },
                };
              case "marketplace_search":
                return {
                  entries: [
                    {
                      id: "example/browser",
                      name: "Browser tools",
                      description:
                        "A browser tool fixture for marketplace interaction tests.",
                      version: "1.0.0",
                    },
                  ],
                  nextCursor: "",
                };
              case "review_plugin":
              case "import_plugin":
                return {
                  planId: "plan",
                  source: args.source || "local",
                  sha256: "test-digest",
                  manifest:
                    command === "import_plugin"
                      ? JSON.parse(args.manifest)
                      : {
                          id: args.pluginId,
                          name: "Browser tools",
                          description: "Test tools",
                          version: "1.0.0",
                          runtime: {
                            kind: "http",
                            url: "https://example.org/mcp",
                          },
                        },
                };
              case "install_plugin":
                state.plugins = [
                  {
                    id: "example/browser",
                    manifest: {
                      name: "Browser tools",
                      version: "1.0.0",
                      description: "Test tools",
                    },
                    source: "featured",
                    connectionIds: [],
                    botIds: [],
                    enabled: true,
                  },
                ];
                break;
              case "toggle_plugin":
                state.plugins.find((p) => p.id === args.pluginId).enabled =
                  args.enabled;
                break;
              case "uninstall_plugin":
                state.plugins = [];
                break;
              case "save_plugin_source":
                state.pluginSources = [
                  { ...args, id: "source", kind: "signed" },
                ];
                break;
              case "delete_plugin_source":
                state.pluginSources = [];
                break;
              case "save_schedule":
                state.schedules = [
                  {
                    ...args.schedule,
                    id: args.schedule.id || "routine",
                    nextRunAt: now + 3600,
                  },
                ];
                break;
              case "delete_schedule":
                state.schedules = [];
                break;
              case "schedule_history":
                return [];
              case "set_computer_access":
                Object.assign(state.settings, {
                  computerEnabled: args.enabled,
                  computerInput: args.allowInput,
                  computerBotIds: args.botIds,
                  computerExpiresAt: args.enabled ? now + args.minutes * 60 : 0,
                });
                result = state.settings;
                break;
              case "bootstrap":
                return clone(state);
              case "save_settings":
                state.settings = { ...state.settings, ...args.settings };
                result = state.settings;
                break;
              case "probe_model":
                return { models: ["qwen3:8b", "llama3.2:3b"] };
              case "local_models":
                return {
                  models: [
                    {
                      name: "qwen3:8b",
                      size: 5200000000,
                      details: {
                        parameter_size: "8B",
                        quantization_level: "Q4_K_M",
                      },
                    },
                  ],
                };
              case "download_model": {
                state.downloads ||= [];
                const d = {
                  id: "download-1",
                  model: args.model,
                  baseUrl: args.baseUrl,
                  state: "downloading",
                  status: "Pulling model layers",
                  completed: 250000000,
                  total: 500000000,
                };
                state.downloads.push(d);
                result = d.id;
                break;
              }
              case "cancel_download":
                state.downloads.find((d) => d.id === args.downloadId).state =
                  "canceled";
                break;
              case "save_connection": {
                const input = args.input;
                const existing = state.connections.find(
                  (c) => c.id === input.id,
                );
                const c = {
                  id: input.id || crypto.randomUUID(),
                  kind: input.kind,
                  label: input.label,
                  config: {
                    ...input.config,
                    hasSecret:
                      Boolean(input.secret) || existing?.config.hasSecret,
                  },
                  account:
                    input.kind === "model"
                      ? input.config.model
                      : input.kind === "github"
                        ? "anshcantcode"
                        : "Connected workspace",
                  verifiedAt: now,
                };
                state.connections = state.connections.filter(
                  (x) => x.id !== c.id,
                );
                state.connections.push(c);
                if (c.kind === "model")
                  state.bots.forEach((b) => {
                    if (!b.providerId) b.providerId = c.id;
                  });
                result = c;
                break;
              }
              case "test_connection":
                result = state.connections.find(
                  (c) => c.id === args.connectionId,
                );
                break;
              case "remove_connection":
                state.connections = state.connections.filter(
                  (c) => c.id !== args.connectionId,
                );
                break;
              case "save_bot": {
                const b = {
                  ...args.bot,
                  id: args.bot.id || crypto.randomUUID(),
                };
                state.bots = state.bots.filter((x) => x.id !== b.id);
                state.bots.push(b);
                result = b;
                break;
              }
              case "delete_bot":
                state.bots = state.bots.filter((b) => b.id !== args.botId);
                break;
              case "create_task": {
                const bot = state.bots.find((b) => b.id === args.botId);
                const t = {
                  ...args,
                  id: crypto.randomUUID(),
                  botName: bot.name,
                  status: "queued",
                  createdAt: now,
                  updatedAt: now,
                  output: "",
                  error: "",
                  waitingApproval: false,
                };
                state.tasks.unshift(t);
                result = t.id;
                break;
              }
              case "start_task": {
                const t = state.tasks.find((t) => t.id === args.taskId);
                t.status = "running";
                break;
              }
              case "cancel_task":
                state.tasks.find((t) => t.id === args.taskId).status =
                  "canceled";
                break;
              case "task_events":
                return [
                  { id: "1", message: "Task created", createdAt: now - 40 },
                  {
                    id: "2",
                    message: "Reading workspace context",
                    createdAt: now - 20,
                  },
                  { id: "3", message: "Task complete", createdAt: now },
                ];
              case "decide_approval": {
                const a = state.approvals.find((a) => a.id === args.approvalId);
                a.status = args.decision;
                const t = state.tasks.find((t) => t.id === a.taskId);
                t.waitingApproval = false;
                t.status = "running";
                break;
              }
              case "browse_connection":
                if (args.action === "repositories")
                  return [
                    {
                      fullName: "anshcantcode/teammate",
                      description: "Your open workspace for AI teammates.",
                      language: "Rust",
                      openIssues: 3,
                      private: false,
                    },
                  ];
                if (args.action === "issues")
                  return [
                    {
                      number: 7,
                      title: "Polish the first run experience",
                      body: "Make setup feel effortless.",
                      url: "https://github.com/anshcantcode/teammate/issues/7",
                    },
                  ];
                if (args.action === "channels")
                  return [
                    {
                      id: "C123",
                      name: "product-design",
                      topic: "A little care in every detail.",
                    },
                  ];
                if (args.action === "history")
                  return [
                    {
                      user: "Ansh",
                      ts: String(now),
                      text: "Let’s ship the polished onboarding this week.",
                    },
                  ];
                return {
                  tools: [
                    {
                      name: "browser_snapshot",
                      description: "Inspect your browser.",
                    },
                  ],
                };
              case "open_external":
                window.openedUrl = args.url;
                break;
              default:
                throw new Error(`Unmocked native command: ${command}`);
            }
            persist();
            return result === undefined ? null : clone(result);
          },
        },
      };
    },
    { setup, connected },
  );
  await page.goto("/");
}

test("guided setup connects a model and preserves a personalized workspace", async ({
  page,
}) => {
  await nativeFixture(page, { setup: false, connected: false });
  await expect(
    page.getByRole("heading", { name: "Set up your workspace" }),
  ).toBeVisible();
  await page.locator("#setup-owner").fill("Mira");
  await page.locator("#setup-workspace").fill("Mira’s studio");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Keep it local/ }).click();
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await expect(page.locator("[name=model]")).toHaveValue("qwen3:8b");
  await page.getByRole("button", { name: "Verify & connect" }).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.getByText("Ollama · qwen3:8b")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Accent #5b9be0" }).click();
  await page.getByRole("button", { name: "Open my workspace" }).click();
  await expect(page.locator("h1")).toContainText("Mira");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("h1")).toContainText("Mira");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("tasks can be drafted, run, canceled, searched, and exported", async ({
  page,
}) => {
  await nativeFixture(page);
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.locator("[name=title]").fill("Plan the launch");
  await page
    .locator("[name=description]")
    .fill("Create a practical release checklist.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("h1")).toHaveText("Plan the launch");
  await page.getByRole("button", { name: "Run task", exact: true }).click();
  await expect(page.getByText("Scout is working")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Canceled", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All tasks", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search tasks" }).fill("clearer");
  await expect(page.locator(".task-row")).toHaveCount(1);
  await page.locator(".task-row").click();
  await expect(page.locator(".markdown h2")).toHaveText(
    "Your next three moves",
  );
  expect(await page.evaluate(() => window.unsafe)).toBeUndefined();
  await expect(
    page.locator(".markdown script, .markdown [onerror]"),
  ).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
});

test("GitHub and Slack browse actual command results and pass context to tasks", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Connections" })
    .click();
  await page
    .locator(".connected-row")
    .filter({ hasText: "GitHub" })
    .getByRole("button", { name: "Browse" })
    .click();
  await page.getByRole("button", { name: /anshcantcode\/teammate/ }).click();
  await expect(page.getByText("Polish the first run experience")).toBeVisible();
  await page.getByRole("button", { name: "Use in a task" }).click();
  await expect(page.locator("[name=description]")).toHaveValue(
    /anshcantcode\/teammate/,
  );
  await page.getByRole("button", { name: "Close panel" }).click();
  await page
    .locator(".connected-row")
    .filter({ hasText: "Design studio" })
    .getByRole("button", { name: "Browse" })
    .click();
  await page.getByRole("button", { name: /product-design/ }).click();
  await expect(
    page.getByText("Let’s ship the polished onboarding this week."),
  ).toBeVisible();
});

test("connection failures are actionable and never become saved connections", async ({
  page,
}) => {
  await nativeFixture(page, { connected: false });
  await page
    .locator("nav")
    .getByRole("button", { name: "Connections" })
    .click();
  await page.getByRole("button", { name: "Connect GitHub" }).click();
  await page.locator("[name=secret]").fill("test-token-only");
  await page.evaluate(() => {
    window.rejectCommand = "save_connection";
  });
  await page.getByRole("button", { name: "Verify & connect" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be reached" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.fixtureState.connections.length),
  ).toBe(0);
  await expect(page.locator("[name=secret]")).toHaveAttribute(
    "type",
    "password",
  );
  await expect(
    page.getByRole("button", { name: "Verify & connect" }),
  ).toBeEnabled();
});

test("teammates, command palette, and appearance persist", async ({ page }) => {
  await nativeFixture(page);
  await page.locator("nav").getByRole("button", { name: "Teammates" }).click();
  await page.getByRole("button", { name: "New teammate" }).click();
  await page.locator("[name=name]").fill("Nova");
  await page.locator("[name=role]").fill("Writing partner");
  await page
    .locator("[name=instructions]")
    .fill("Write with clarity and care.");
  await page.getByRole("button", { name: "Save teammate" }).click();
  await expect(
    page.locator(".teammate-card").filter({ hasText: "Nova" }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(100);
  await expect(
    page.getByRole("textbox", { name: "Command search" }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Command search" })
    .fill("Preferences");
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Preferences");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("checkbox", { name: /Compact sidebar/ }).check();
  await expect(page.locator(".shell")).toHaveClass(/compact-sidebar/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".shell")).toHaveClass(/compact-sidebar/);
});

test("approvals show the exact payload and resume only the selected decision", async ({
  page,
}) => {
  await nativeFixture(page);
  await page.evaluate(() => {
    const s = window.fixtureState;
    s.tasks[0].status = "paused";
    s.tasks[0].waitingApproval = true;
    s.approvals.push({
      id: "approve-1",
      taskId: "task-1",
      title: "Send Slack message",
      target: "Design studio",
      summary: "Review the exact channel and message.",
      status: "pending",
      createdAt: Date.now() / 1000,
      toolName: "slack_send",
      arguments: { channel: "C123", text: "The release is ready for review." },
    });
  });
  await page.evaluate(() =>
    window.__TAURI__.core.invoke("save_settings", {
      settings: window.fixtureState.settings,
    }),
  );
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: /Approvals/ })
    .click();
  await expect(page.locator(".approval-payload")).toContainText(
    "The release is ready for review.",
  );
  await page.getByRole("button", { name: "Reject action" }).click();
  expect(
    await page.evaluate(() => window.fixtureState.approvals[0].status),
  ).toBe("rejected");
  await expect(page.getByText("You’re all clear")).toBeVisible();
});

test("premium layouts have no horizontal overflow at desktop and small windows", async ({
  page,
}) => {
  await nativeFixture(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 1024, 840, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of [
      "Overview",
      "Teammates",
      "Connections",
      "Model library",
      "Marketplace",
    ]) {
      await page.locator("nav").getByRole("button", { name }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} at ${width}px`,
      ).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});

test("model library downloads, reports progress, cancels, and connects installed models", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Model library" })
    .click();
  await expect(page.locator(".catalog-card h3")).toHaveText("qwen3:8b");
  await page
    .getByRole("textbox", { name: "Model to download" })
    .fill("llama3.2:3b");
  await page.getByRole("button", { name: "Download model" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "value",
    "250000000",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("progressbar")).toBeVisible();
  expect(
    await page.evaluate(() => window.fixtureState.downloads[0].state),
  ).toBe("canceled");
  await page.getByRole("button", { name: "Use this model" }).click();
  await expect(page.locator("dialog [name=model]")).toHaveValue("qwen3:8b");
  await expect(page.locator("[name=baseUrl]")).toHaveValue(
    "http://127.0.0.1:11434/v1",
  );
});

test("extensions import remote MCP configs and expose a real browser setup", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Marketplace" })
    .click();
  await page
    .getByRole("button", { name: "Connect an existing browser server" })
    .click();
  await expect(page.locator(".setup-guide pre")).toHaveText(
    "npx @playwright/mcp@latest --port 8931",
  );
  await page.getByRole("button", { name: "Connect browser server" }).click();
  await expect(page.locator("[name=baseUrl]")).toHaveValue(
    "http://localhost:8931/mcp",
  );
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "Import plugin" }).click();
  await page.locator("[name=manifest]").fill(
    JSON.stringify({
      mcpServers: { notes: { url: "https://tools.example/mcp" } },
    }),
  );
  await page.getByRole("button", { name: "Review plugin" }).click();
  await expect(page.locator("[name=baseUrl]")).toHaveValue(
    "https://tools.example/mcp",
  );
  await expect(page.locator("[name=label]")).toHaveValue("notes");
  await page.getByRole("button", { name: "Verify & connect" }).click();
  expect(
    await page.evaluate(() => window.fixtureState.connections.at(-1).kind),
  ).toBe("mcp");
});

test("vision capabilities and companion are explicit saved choices", async ({
  page,
}) => {
  await nativeFixture(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Connections" })
    .click();
  await page.getByRole("button", { name: "Manage Local intelligence" }).click();
  await page
    .getByRole("checkbox", { name: /This model accepts images/ })
    .check();
  await page.getByRole("button", { name: "Verify & save" }).click();
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Vision companion" })
    .selectOption("model-1");
  expect(
    await page.evaluate(() => window.fixtureState.settings.visionProviderId),
  ).toBe("model-1");
});

test("background task refresh preserves composer text, focus, and teammate selection", async ({
  page,
}) => {
  await nativeFixture(page);
  await page.evaluate(() => {
    window.fixtureState.tasks[0].status = "running";
  });
  await page.evaluate(() => refresh());
  await page
    .getByRole("combobox", { name: "Assign to teammate" })
    .selectOption("code");
  await page
    .getByRole("textbox", { name: "Task goal" })
    .fill("Keep my context while a teammate works.");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.commandCalls.filter((c) => c.command === "bootstrap").length,
      ),
    )
    .toBeGreaterThan(1);
  await expect(page.getByRole("textbox", { name: "Task goal" })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Task goal" })).toHaveValue(
    "Keep my context while a teammate works.",
  );
  await expect(
    page.getByRole("combobox", { name: "Assign to teammate" }),
  ).toHaveValue("code");
});

test("capture the implemented desktop experience", async ({ page }) => {
  await mkdir("design/screenshots", { recursive: true });
  await nativeFixture(page);
  await page.screenshot({
    path: "design/screenshots/overview.png",
    fullPage: true,
  });
  await page
    .locator("nav")
    .getByRole("button", { name: "Connections" })
    .click();
  await page.screenshot({
    path: "design/screenshots/connections.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page.screenshot({
    path: "design/screenshots/preferences.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Revisit guided setup" }).click();
  await page.screenshot({
    path: "design/screenshots/setup.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Explore first" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Model library" })
    .click();
  await expect(page.locator(".catalog-card h3")).toHaveText("qwen3:8b");
  await page.screenshot({
    path: "design/screenshots/models.png",
    fullPage: true,
  });
  await page
    .locator("nav")
    .getByRole("button", { name: "Marketplace" })
    .click();
  await page.screenshot({
    path: "design/screenshots/extensions.png",
    fullPage: true,
  });
});
