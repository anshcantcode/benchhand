import { expect } from "@playwright/test";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export async function checkFeatures(
  page,
  { directory, endpoint, pid, inspect, publisherKey },
) {
  const ipc = (command, args = {}) =>
    page.evaluate(
      ({ command, args }) => window.__TAURI__.core.invoke(command, args),
      { command, args },
    );
  const focusOwnWindow = async () => {
    const { stdout } = await promisify(execFile)(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class NativeFocusCheck { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, IntPtr p); [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId(); [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a,uint b,bool attach); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int n); [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr h,bool altTab); }';
$testWindow=(Get-Process -Id ${pid}).MainWindowHandle;$currentThread=[NativeFocusCheck]::GetCurrentThreadId();$foregroundThread=[NativeFocusCheck]::GetWindowThreadProcessId([NativeFocusCheck]::GetForegroundWindow(),[IntPtr]::Zero);
[NativeFocusCheck]::ShowWindow($testWindow,9)|Out-Null;[NativeFocusCheck]::AttachThreadInput($currentThread,$foregroundThread,$true)|Out-Null;
try{for($attempt=0;$attempt -lt 5;$attempt++){[NativeFocusCheck]::SwitchToThisWindow($testWindow,$true);[NativeFocusCheck]::SetForegroundWindow($testWindow)|Out-Null;Start-Sleep -Milliseconds 100;if([NativeFocusCheck]::GetForegroundWindow() -eq $testWindow){break;}}}finally{[NativeFocusCheck]::AttachThreadInput($currentThread,$foregroundThread,$false)|Out-Null};
([NativeFocusCheck]::GetForegroundWindow() -eq $testWindow).ToString();
`,
      ],
      { windowsHide: true },
    );
    expect(
      stdout.trim(),
      "Only the isolated test app may receive native input",
    ).toBe("True");
  };
  let state = await ipc("bootstrap");
  const registry = await ipc("marketplace_search", {
    source: "registry",
    query: "memory",
    cursor: "",
  });
  expect(registry.entries.length).toBeGreaterThan(0);
  if (registry.nextCursor) {
    const next = await ipc("marketplace_search", {
      source: "registry",
      query: "memory",
      cursor: registry.nextCursor,
    });
    expect(next.entries.length).toBeGreaterThan(0);
  }
  console.log("Live registry search and pagination passed.");
  const previousAuto = (await ipc("autostart_status")).enabled;
  try {
    await ipc("set_autostart", { enabled: !previousAuto });
    expect((await ipc("autostart_status")).enabled).toBe(!previousAuto);
  } finally {
    await ipc("set_autostart", { enabled: previousAuto });
  }
  const sources = await ipc("save_plugin_source", {
    label: "Test signed catalog",
    url: `${endpoint}/catalog.json`,
    publicKey: publisherKey,
  });
  const source = sources.find((s) => s.label === "Test signed catalog");
  expect(
    (
      await ipc("marketplace_search", {
        source: source.id,
        query: "theme",
        cursor: "",
      })
    ).signatureVerified,
  ).toBe(true);
  const signedPlan = await ipc("review_plugin", {
    source: source.id,
    pluginId: "test/signed-theme",
    variant: 0,
  });
  await ipc("install_plugin", { planId: signedPlan.planId, values: {} });
  await ipc("plugin_theme", { pluginId: "test/signed-theme" });
  expect((await ipc("bootstrap")).settings.accent).toBe("#83c9f4");
  await ipc("uninstall_plugin", { pluginId: "test/signed-theme" });
  await ipc("delete_plugin_source", { sourceId: source.id });
  const start = async (title, description = "", botId = "research") => {
    const taskId = await ipc("create_task", { title, description, botId });
    await ipc("start_task", { taskId });
    return taskId;
  };
  const complete = async (id) => {
    await expect
      .poll(
        async () => {
          const s = await ipc("bootstrap");
          const t = s.tasks.find((t) => t.id === id);
          if (t?.status === "failed") throw new Error(t.error);
          return t?.status;
        },
        { timeout: 30000 },
      )
      .toBe("completed");
    return (await ipc("bootstrap")).tasks.find((t) => t.id === id);
  };
  const parent = await start("Delegation integration");
  const result = await complete(parent);
  expect(result.output).toContain("Delegated result received");
  state = await ipc("bootstrap");
  const child = state.tasks.find((t) => t.parentId === parent);
  expect(child?.status).toBe("completed");
  expect(child.output).toContain("Delegated fixture result");
  console.log(
    "Native delegation passed: parent → durable child task → returned result → parent completion.",
  );
  const routine = await ipc("save_schedule", {
    schedule: {
      id: "",
      name: "Native schedule check",
      botId: "research",
      title: "Routine integration",
      description: "Execute only against the local fixture",
      config: {
        kind: "once",
        at: Math.floor(Date.now() / 1000) + 3,
        missed: "run_once",
      },
      enabled: true,
    },
  });
  await expect
    .poll(
      async () =>
        (await ipc("schedule_history", { scheduleId: routine.id })).length,
      { timeout: 15000 },
    )
    .toBe(1);
  const history = await ipc("schedule_history", { scheduleId: routine.id });
  await complete(history[0].taskId);
  expect(
    (await ipc("schedule_history", { scheduleId: routine.id })).length,
  ).toBe(1);
  await ipc("delete_schedule", { scheduleId: routine.id });
  console.log(
    "Native scheduler passed: due routine → one persisted run → automatic execution and result.",
  );
  // The fixture program runs as a real child process, using the same install flow as third-party plugins.
  const manifest = {
    id: "test/stdio",
    name: "Native stdio fixture",
    version: "1.0.0",
    description: "Local integration fixture",
    runtime: {
      kind: "stdio",
      command: process.execPath,
      args: [resolve("tests/fixtures/mcp-stdio.mjs")],
      environmentVariables: [
        { name: "FIXTURE_TOKEN", isSecret: true, isRequired: false },
      ],
    },
    bots: [
      {
        name: "Plugin template",
        role: "Test template",
        instructions: "Be helpful",
      },
    ],
    theme: { accent: "#8bd7b6" },
  };
  let plan = await ipc("import_plugin", {
    manifest: JSON.stringify(manifest),
    bundle: false,
  });
  await ipc("install_plugin", {
    planId: plan.planId,
    values: { FIXTURE_TOKEN: "test-only-value" },
  });
  state = await ipc("bootstrap");
  let plugin = state.plugins.find((p) => p.id === manifest.id);
  expect(plugin.enabled).toBe(true);
  expect(
    state.connections.find((c) => c.id === plugin.connectionIds[0]).config
      .tools[0].name,
  ).toBe("echo");
  await ipc("test_connection", { connectionId: plugin.connectionIds[0] });
  await ipc("plugin_theme", { pluginId: manifest.id });
  expect((await ipc("bootstrap")).settings.accent).toBe("#8bd7b6");
  await ipc("toggle_plugin", { pluginId: manifest.id, enabled: false });
  expect(
    (await ipc("bootstrap")).connections.find(
      (c) => c.id === plugin.connectionIds[0],
    ).config.enabledForAgents,
  ).toBe(false);
  await ipc("toggle_plugin", { pluginId: manifest.id, enabled: true });
  manifest.version = "1.0.1";
  plan = await ipc("import_plugin", {
    manifest: JSON.stringify(manifest),
    bundle: false,
  });
  await ipc("install_plugin", { planId: plan.planId, values: {} });
  state = await ipc("bootstrap");
  plugin = state.plugins.find((p) => p.id === manifest.id);
  expect(plugin.manifest.version).toBe("1.0.1");
  expect(
    state.connections.filter((c) => c.config.pluginId === manifest.id).length,
  ).toBe(1);
  await ipc("uninstall_plugin", { pluginId: manifest.id });
  state = await ipc("bootstrap");
  expect(state.plugins.some((p) => p.id === manifest.id)).toBe(false);
  expect(state.connections.some((c) => c.config.pluginId === manifest.id)).toBe(
    false,
  );
  console.log(
    "Native marketplace passed: real stdio install/discovery → credential store → test → disable/enable → theme → update → cleanup.",
  );
  // Exercise a real npm package, including an independently downloaded pinned dependency tree.
  plan = await ipc("review_plugin", {
    source: "featured",
    pluginId: "org.modelcontextprotocol/memory",
    version: "2025.11.25",
    variant: 0,
  });
  expect(plan.manifest.runtime.version).not.toBe("latest");
  await ipc("install_plugin", { planId: plan.planId, values: {} });
  state = await ipc("bootstrap");
  plugin = state.plugins.find(
    (p) => p.id === "org.modelcontextprotocol/memory",
  );
  expect(
    state.connections.find((c) => c.id === plugin.connectionIds[0]).config.tools
      .length,
  ).toBeGreaterThan(1);
  await ipc("uninstall_plugin", { pluginId: plugin.id });
  console.log(
    "Native npm install passed: live package metadata → exact version → managed install → MCP tool discovery → uninstall.",
  );
  state = await ipc("bootstrap");
  state.settings.computerHideWindow = false;
  await ipc("save_settings", { settings: state.settings });
  // Preferences cannot grant desktop permission.
  await ipc("save_settings", {
    settings: {
      ...state.settings,
      computerEnabled: true,
      computerInput: true,
      computerBotIds: ["research"],
      computerExpiresAt: Math.floor(Date.now() / 1000) + 999,
    },
  });
  expect((await ipc("bootstrap")).settings.computerEnabled).toBe(false);
  await ipc("set_computer_access", {
    enabled: true,
    allowInput: true,
    botIds: ["research"],
    minutes: 5,
  });
  const preview = await ipc("computer_preview", {
    botId: "research",
    displayId: null,
  });
  expect(preview.content[0].mimeType).toBe("image/jpeg");
  expect(preview.content[0].data.length).toBeGreaterThan(100);
  const inspection = await start("Native inspect integration");
  await complete(inspection);
  const info = inspect();
  expect(Array.isArray(info.windows)).toBe(true);
  // The capture library deliberately excludes the calling process from window discovery.
  // Read only this isolated app's rectangle for the test target, using a DPI-aware Win32 query.
  const { stdout } = await promisify(execFile)(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class NativeDesktopCheck { [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left,Top,Right,Bottom; } [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r); [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr c); }';
[NativeDesktopCheck]::SetProcessDpiAwarenessContext([IntPtr](-4)) | Out-Null;
$targetProcess=Get-Process -Id ${pid}; if($targetProcess.MainWindowTitle -ne 'Teammate'){throw 'Unexpected native test window'};
$rect=New-Object NativeDesktopCheck+Rect; [NativeDesktopCheck]::GetWindowRect($targetProcess.MainWindowHandle,[ref]$rect) | Out-Null;
@{x=$rect.Left;y=$rect.Top;width=($rect.Right-$rect.Left);height=($rect.Bottom-$rect.Top)} | ConvertTo-Json -Compress;
`,
    ],
    { windowsHide: true },
  );
  const window = JSON.parse(stdout);
  expect(window.width).toBeGreaterThan(800);
  const display = info.displays.find((d) => d.id === preview.displayId);
  expect(display).toBeTruthy();
  // All actual input is confined to an editor we create in this isolated test app.
  await page.evaluate(() => {
    const editor = document.createElement("textarea");
    editor.id = "native-input-fixture";
    editor.style.cssText =
      "position:fixed;left:280px;top:180px;width:500px;height:300px;z-index:2147483647;background:white;color:black;font:16px monospace";
    editor.value = "";
    document.body.append(editor);
    window.nativeInputEvents = { click: 0, move: 0, up: 0 };
    editor.addEventListener("click", () => window.nativeInputEvents.click++);
    editor.addEventListener("mousemove", () => window.nativeInputEvents.move++);
    editor.addEventListener("mouseup", () => window.nativeInputEvents.up++);
  });
  const geometry = await page.evaluate(() => ({
    ratio: devicePixelRatio,
    width: innerWidth,
    height: innerHeight,
  }));
  const side = Math.max(
    0,
    (window.width - geometry.width * geometry.ratio) / 2,
  );
  const px = window.x + side + 530 * geometry.ratio,
    py =
      window.y +
      window.height -
      geometry.height * geometry.ratio -
      side +
      330 * geometry.ratio;
  const coordinates = {
    displayId: display.id,
    x: ((px - display.x) / (display.width - 1)) * 1000,
    y: ((py - display.y) / (display.height - 1)) * 1000,
  };
  const action = async (name, args) => {
    const id = await start(
      `Native action ${name.replace("computer_", "")}`,
      JSON.stringify({ name, args }),
    );
    await expect
      .poll(
        async () =>
          (await ipc("bootstrap")).tasks.find((t) => t.id === id)
            ?.waitingApproval,
        { timeout: 15000 },
      )
      .toBe(true);
    const approval = (await ipc("bootstrap")).approvals.find(
      (a) => a.taskId === id && a.status === "pending",
    );
    expect(approval.arguments).toEqual(args);
    await page.bringToFront();
    await focusOwnWindow();
    await page.locator("#native-input-fixture").focus();
    await ipc("decide_approval", {
      approvalId: approval.id,
      decision: "approved",
    });
    await complete(id);
  };
  await action("computer_type", { text: "Native input verified" });
  await expect(page.locator("#native-input-fixture")).toHaveValue(
    "Native input verified",
  );
  await action("computer_key", { keys: "CTRL+A" });
  await action("computer_type", { text: "Replacement verified" });
  await expect(page.locator("#native-input-fixture")).toHaveValue(
    "Replacement verified",
  );
  await action("computer_click", coordinates);
  expect(
    await page.evaluate(() => window.nativeInputEvents.click),
  ).toBeGreaterThan(0);
  await action("computer_move", { ...coordinates, x: coordinates.x + 5 });
  await action("computer_drag", {
    ...coordinates,
    toX: coordinates.x + 10,
    toY: coordinates.y + 10,
  });
  expect(
    await page.evaluate(() => window.nativeInputEvents.move),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(() => window.nativeInputEvents.up),
  ).toBeGreaterThan(0);
  await page
    .locator("#native-input-fixture")
    .fill(Array.from({ length: 100 }, (_, i) => `Line ${i}`).join("\n"));
  await page.locator("#native-input-fixture").evaluate((e) => {
    e.scrollTop = 0;
  });
  await action("computer_scroll", { direction: "down", steps: 4 });
  expect(
    await page.locator("#native-input-fixture").evaluate((e) => e.scrollTop),
  ).toBeGreaterThan(0);
  if ((await ipc("autostart_status")).desktop.emergencyShortcut) {
    await action("computer_key", { keys: "CTRL+ALT+ESCAPE" });
    await expect
      .poll(async () => (await ipc("bootstrap")).settings.computerEnabled)
      .toBe(false);
  }
  await ipc("set_computer_access", {
    enabled: false,
    allowInput: false,
    botIds: [],
    minutes: 1,
  });
  await expect(
    ipc("computer_preview", { botId: "research", displayId: null }),
  ).rejects.toThrow("Computer access is off");
  await page.locator("#native-input-fixture").evaluate((e) => e.remove());
  console.log(
    "Native computer passed: real display/window discovery, JPEG capture, exact approvals, native typing/key/click/move/drag/scroll in an isolated editor, and revocation.",
  );
  await ipc("save_schedule", {
    schedule: {
      id: "",
      name: "Weekly project review",
      botId: "research",
      title:
        "Summarize project context and ask Forge for an engineering review",
      description:
        "Prepare a useful weekly brief. Review external actions before execution.",
      config: {
        kind: "weekly",
        time: "09:00",
        timezone: "Asia/Kolkata",
        days: [1],
        missed: "run_once",
      },
      enabled: false,
    },
  });
  await page.evaluate(() => refresh());
  for (const [label, file] of [
    ["Routines", "native-routines"],
    ["Computer", "native-computer"],
    ["Marketplace", "native-marketplace"],
  ]) {
    await page
      .locator("nav")
      .getByRole("button", { name: label, exact: true })
      .click();
    if (label === "Marketplace")
      await expect(page.locator(".catalog-card h3")).toHaveCount(3);
    await page.screenshot({
      path: `design/screenshots/${file}.png`,
      fullPage: true,
    });
  }
}
