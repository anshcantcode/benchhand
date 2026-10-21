// Sample data for `npm run preview:sample`: a stand-in for the native bridge so the interface can be explored without the desktop app.
// Query parameters: page, task, theme, setup=0, compact=1, computer=1, accent. Example: /?page=tasks&task=t-triage&theme=light
(() => {
  const q = new URLSearchParams(location.search);
  const now = Math.floor(Date.now() / 1000);
  const ago = (m) => now - Math.round(m * 60);
  const state = {
    settings: {
      workspaceName: "Product studio", ownerName: "Sam", theme: q.get("theme") || "dark",
      accent: q.get("accent") || "", density: "comfortable", fontSize: 14, radius: 6,
      sidebarCompact: q.get("compact") === "1", reduceMotion: false, font: "sans", background: "flat",
      defaultView: q.get("page") || "home", showActivity: true, showStarters: true,
      setupComplete: q.get("setup") !== "0", maxSteps: 12, maxConcurrentRuns: 3, rootStepBudget: 60,
      runInBackground: true, computerEnabled: q.get("computer") === "1", computerInput: true,
      computerBotIds: ["research"], computerExpiresAt: now + 900, computerHideWindow: true,
    },
    bots: [
      { id: "research", name: "Scout", role: "Research & synthesis", description: "Turns scattered information into clear decisions.", instructions: "Research carefully.", color: "#7aa7e0", providerId: "m-local" },
      { id: "operations", name: "Atlas", role: "Planning & operations", description: "Keeps projects organized and moving forward.", instructions: "Be practical.", color: "#8bd7b6", providerId: "m-local" },
      { id: "code", name: "Forge", role: "Engineering & GitHub", description: "Understands issues and helps ship better software.", instructions: "Build reliable code.", color: "#efb47c", providerId: "m-cloud" },
      { id: "relay", name: "Relay", role: "Slack & updates", description: "Reads channels and drafts status updates.", instructions: "Be brief.", color: "#eb97b6", providerId: "m-local" },
    ],
    tasks: [
      { id: "t-triage", title: "Triage open issues in anshcantcode/benchhand", description: "Review the 23 open issues, group duplicates and propose an order for 0.3.1.", botId: "code", botName: "Forge", status: "running", createdAt: ago(14), updatedAt: ago(0.5), output: "", error: "", waitingApproval: false, waitingChild: true },
      { id: "t-dupes", parentId: "t-triage", title: "Find duplicate reports of the Wayland tray crash", description: "Search issues for tray crash reports.", botId: "research", botName: "Scout", status: "running", createdAt: ago(6), updatedAt: ago(0.4), output: "", error: "", waitingApproval: false },
      { id: "t-status", title: "Post the weekly status to #product-design", description: "Summarise this week's merged work and post it.", botId: "relay", botName: "Relay", status: "paused", createdAt: ago(41), updatedAt: ago(9), output: "", error: "", waitingApproval: true },
      { id: "t-issue", title: "Open an issue for the tray crash on Wayland", description: "File a bug with the reproduction steps.", botId: "code", botName: "Forge", status: "paused", createdAt: ago(55), updatedAt: ago(22), output: "", error: "", waitingApproval: true },
      { id: "t-support", title: "Summarise yesterday’s #support thread", description: "Decisions, blockers and owners.", botId: "relay", botName: "Relay", status: "failed", createdAt: ago(190), updatedAt: ago(186), output: "", error: "Slack returned not_in_channel for #support. Invite the app to the channel, then run again.", waitingApproval: false },
      { id: "t-brief", title: "Morning research brief", description: "Local model releases and MCP news since yesterday.", botId: "research", botName: "Scout", status: "completed", createdAt: ago(240), updatedAt: ago(228), output: "## Since yesterday\n\n- Two new GGUF builds of qwen3 landed on Hugging Face.\n- The MCP registry added 14 servers.\n\n| Source | Items |\n| --- | ---: |\n| Hugging Face | 6 |\n| MCP Registry | 14 |\n", error: "", waitingApproval: false },
      { id: "t-plan", title: "A clearer plan for this week", description: "Help prioritize the work.", botId: "operations", botName: "Atlas", status: "completed", createdAt: ago(320), updatedAt: ago(301), output: "## Your next three moves\n\n1. Finish the launch brief.\n2. Review the open issues.\n3. Make room for deep work.\n", error: "", waitingApproval: false },
      { id: "t-models", title: "Compare local models for structured actions", description: "qwen3:8b against llama3.2:3b on the JSON adapter.", botId: "research", botName: "Scout", status: "completed", createdAt: ago(610), updatedAt: ago(571), output: "## Result\n\nqwen3:8b followed the action schema in 19 of 20 runs; llama3.2:3b in 12 of 20.", error: "", waitingApproval: false },
      { id: "t-notes", title: "Draft release notes for 0.3.1", description: "From merged pull requests since 0.3.0.", botId: "code", botName: "Forge", status: "queued", createdAt: ago(700), updatedAt: ago(700), output: "", error: "", waitingApproval: false },
      { id: "t-old", title: "Rename the Slack digest channel", description: "", botId: "relay", botName: "Relay", status: "canceled", createdAt: ago(1300), updatedAt: ago(1290), output: "", error: "", waitingApproval: false },
    ],
    connections: [
      { id: "m-local", kind: "model", label: "Ollama", account: "qwen3:8b", verifiedAt: ago(3), config: { baseUrl: "http://127.0.0.1:11434/v1", model: "qwen3:8b", protocol: "chat", toolMode: "native", hasSecret: false } },
      { id: "m-cloud", kind: "model", label: "OpenRouter", account: "deepseek/deepseek-chat-v3", verifiedAt: ago(130), config: { baseUrl: "https://openrouter.ai/api/v1", model: "deepseek/deepseek-chat-v3", protocol: "chat", toolMode: "native", hasSecret: true } },
      { id: "gh", kind: "github", label: "GitHub", account: "anshcantcode", verifiedAt: ago(30), config: { hasSecret: true } },
      { id: "sl", kind: "slack", label: "Design studio", account: "Design studio · Sam", verifiedAt: ago(30), config: { hasSecret: true } },
      { id: "pw", kind: "mcp", label: "Browser · Playwright", account: "localhost:8931 · 21 tools", verifiedAt: ago(800), config: { baseUrl: "http://localhost:8931/mcp", hasSecret: false } },
    ],
    approvals: [
      { id: "a1", taskId: "t-status", title: "Send a Slack message", target: "Design studio", summary: "Relay wants to post the weekly status (6 merged pull requests, 2 open risks).", status: "pending", createdAt: ago(9), toolName: "slack_send", arguments: { channel: "C04PRODUCT", text: "Weekly status: 6 PRs merged, tray mode shipped. Risks: Wayland tray crash, registry pagination." } },
      { id: "a2", taskId: "t-issue", title: "Create a GitHub issue", target: "GitHub", summary: "Forge wants to open a bug with reproduction steps.", status: "pending", createdAt: ago(22), toolName: "github_create_issue", arguments: { repository: "anshcantcode/benchhand", title: "Tray icon crashes on GNOME Wayland", body: "**Steps to reproduce**\n\n1. Start Benchhand on Ubuntu 24.04 with GNOME on Wayland.\n2. Turn on *Keep working in the tray*.\n3. Close the window.\n\n**Expected:** the tray icon stays and routines keep running.\n**Actual:** the app exits with `Gdk-CRITICAL` in the log.\n\nReported 3 times: #41, #47, #52." } },
      { id: "a0", taskId: "t-plan", title: "Write plan.md", target: "Atlas workspace", edited: true, summary: "", status: "approved", createdAt: ago(305), toolName: "write_file", arguments: {} },
    ],
    schedules: [
      { id: "s1", name: "Morning research brief", botId: "research", title: "Morning research brief", description: "", enabled: true, nextRunAt: now + 15 * 3600, config: { kind: "daily", time: "09:00", timezone: "Asia/Kolkata", missed: "run_once" } },
      { id: "s2", name: "Weekly issue review", botId: "code", title: "Review new issues", description: "", enabled: true, nextRunAt: now + 4 * 86400, config: { kind: "weekly", time: "10:00", timezone: "Asia/Kolkata", days: [1], missed: "run_once" } },
      { id: "s3", name: "Slack digest", botId: "relay", title: "Digest #general", description: "", enabled: false, nextRunAt: 0, lastError: "", config: { kind: "interval", seconds: 7200, missed: "skip" } },
    ],
    plugins: [
      { id: "microsoft/playwright-mcp", manifest: { name: "Playwright browser", version: "0.0.41", description: "Browser automation through accessibility snapshots.", runtime: { kind: "npm" } }, source: "featured", connectionIds: ["pw"], botIds: [], enabled: true },
    ],
    pluginSources: [{ id: "featured", label: "Featured tools" }, { id: "registry", label: "Official MCP Registry" }],
    downloads: [{ id: "d1", model: "llama3.2:3b", state: "downloading", status: "Pulling model layers", completed: 1240000000, total: 2020000000 }],
    device: { os: "windows", arch: "x86_64", threads: 16, version: "0.4.1" },
  };
  // Event text matches what the runtime records, so the Steps list is derived the same way as in the app.
  const run = (start, ...lines) => [{ message: "Task created", createdAt: ago(start + 0.2) }, { message: "Run started", createdAt: ago(start) }, ...lines.map(([m, at]) => ({ message: m, createdAt: ago(at) }))];
  const events = {
    "t-triage": run(14, ["Thinking · step 1 of 12", 13.8], ["Running: GitHub · Read open issues", 13.5], ["Tool completed: GitHub · Read open issues", 13], ["Thinking · step 2 of 12", 12.8], ["Running: Save workspace file", 9.2], ["Tool completed: Save workspace file", 9], ["Thinking · step 3 of 12", 8], ["Running: Delegate work", 6.1], ["Waiting for delegated work", 6]),
    "t-status": run(41, ["Thinking · step 1 of 12", 40.8], ["Running: Design studio · Read recent messages", 40], ["Tool completed: Design studio · Read recent messages", 39.5], ["Thinking · step 2 of 12", 39], ["Running: GitHub · Read open issues", 30], ["Tool completed: GitHub · Read open issues", 29.5], ["Thinking · step 3 of 12", 12], ["Waiting for your approval", 9]),
    "t-issue": run(55, ["Thinking · step 1 of 12", 54.8], ["Running: GitHub · Read open issues", 54], ["Tool completed: GitHub · Read open issues", 53], ["Thinking · step 2 of 12", 30], ["Waiting for your approval", 22]),
    "t-plan": run(320, ["Thinking · step 1 of 12", 319], ["Running: Browse workspace files", 318], ["Tool completed: Browse workspace files", 318], ["Thinking · step 2 of 12", 312], ["Waiting for your approval", 305], ["Resuming after your decision", 304], ["You edited the inputs before approving", 304], ["Running: Save workspace file", 304], ["Tool completed: Save workspace file", 303.8], ["Thinking · step 3 of 12", 303], ["Task completed", 301]),
    "t-support": run(190, ["Thinking · step 1 of 12", 189.8], ["Running: Design studio · Read recent messages", 189], ["Tool reported an error: Design studio · Read recent messages", 188.8], ["Thinking · step 2 of 12", 188], ["Run stopped: Slack returned not_in_channel for #support.", 186]),
  };
  events["t-triage"].push(
    { id: 101, message: JSON.stringify({kind:"request",title:"OpenRouter · deepseek/deepseek-chat-v3",detail:"Turn 3 of 12. 7 messages in context; 8 tools available. Transport: chat."}), createdAt: ago(0.4) },
    { id: 102, message: JSON.stringify({kind:"reasoning_summary",title:"Provider reasoning",detail:"The issue list is available. I will compare the crash reports against the delegated research before proposing priorities."}), createdAt: ago(0.3) },
    { id: 103, message: JSON.stringify({kind:"tool_input",title:"Browse workspace files",detail:JSON.stringify({path:"reports"},null,2)}), createdAt: ago(0.2) },
    { id: 104, message: JSON.stringify({kind:"tool_result",title:"Browse workspace files",detail:JSON.stringify({files:["triage-notes.md"]},null,2)}), createdAt: ago(0.15) },
    { id: 105, message: JSON.stringify({kind:"model_output",title:"Model output",detail:"The duplicate reports share the same Wayland tray initialization path. Waiting for Scout’s comparison before writing the final triage."}), createdAt: ago(0.1) }
  );
  if (q.get("page") === "folders") state.folders = [{botId:"research",path:"C:/Projects/product-notes"}];
  if (q.get("fresh") === "1") { state.tasks = []; state.approvals = []; state.connections = []; state.bots.forEach((b) => b.providerId = ""); }
  if (q.get("fresh") === "connected") { state.tasks = []; state.approvals = []; }
  const clone = (v) => JSON.parse(JSON.stringify(v));
  window.__TAURI__ = { event: { listen: async () => () => {} }, core: { invoke: async (c, a = {}) => {
    switch (c) {
      case "detect_model_clients": return [{provider:"claude",installed:true,version:"Sample installation"},{provider:"codex",installed:true,version:"Sample installation"},{provider:"gemini",installed:false}];
      case "bootstrap": return clone(state);
      case "task_events": { const t = state.tasks.find((t) => t.id === a.taskId); const m = (now - (t?.createdAt || now)) / 60; return clone(events[a.taskId] || (t?.status === "completed" ? run(m, ["Thinking · step 1 of 12", m - 0.5], ["Task completed", m - 3]) : [{ message: "Task created", createdAt: t?.createdAt || now }])); }
      case "decide_approval": {
        // Record the same events the runtime would, so the task's steps move on after a decision.
        const x = state.approvals.find((x) => x.id === a.approvalId), t = state.tasks.find((t) => t.id === x.taskId), at = Math.floor(Date.now() / 1000);
        Object.assign(x, { status: a.decision, edited: !!a.arguments }, a.arguments ? { arguments: a.arguments } : {});
        Object.assign(t, { waitingApproval: false, status: "running", updatedAt: at });
        const label = x.toolName.startsWith("slack") ? "Design studio · Send message" : "GitHub · Create issue";
        const log = (events[t.id] ||= []), add = (message) => log.push({ message, createdAt: at });
        add("Resuming after your decision");
        if (a.decision === "approved") { if (a.arguments) add("You edited the inputs before approving"); add(`Running: ${label}`); add(`Tool completed: ${label}`); }
        add("Thinking · step 4 of 12");
        return null;
      }
      case "autostart_status": return { enabled: true, desktop: { tray: true, emergencyShortcut: true } };
      case "local_models": return { models: [{ name: "qwen3:8b", size: 5200000000, details: { parameter_size: "8.2B", quantization_level: "Q4_K_M" } }, { name: "llava:7b", size: 4700000000, details: { parameter_size: "7B", quantization_level: "Q4_0" } }] };
      case "marketplace_search": return { entries: [
        { id: "microsoft/playwright-mcp", name: "Playwright browser", description: "Drive a real browser through accessibility snapshots.", version: "0.0.41" },
        { id: "modelcontextprotocol/filesystem", name: "Filesystem", description: "Read and write files inside folders you choose.", version: "2025.8.21" },
        { id: "github/github-mcp-server", name: "GitHub", description: "Issues, pull requests and code search.", version: "0.13.0" },
      ], nextCursor: "" };
      case "save_settings": Object.assign(state.settings, a.settings); return clone(state.settings);
      default: return null;
    }
  } } };
  if (q.get("task")) addEventListener("load", () => setTimeout(() => window.detail && detail(q.get("task")), 50));
})();
