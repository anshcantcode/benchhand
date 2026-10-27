const paths = {
  home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
  edit: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
  tasks: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01",
  team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  connections:
    "m10 13 4-4M8 16l-2 2a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m4-1 2-2a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  approvals: "M12 3 20 6v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Zm-4 9 3 3 5-6",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  dot: "M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  pulse: "M3 12h4l3-7 4 14 3-7h4",
  play: "m8 5 11 7-11 7V5Z",
  stop: "M6 6h12v12H6Z",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z",
  model: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  models: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  github:
    "M9 21v-4c-4 1-4-2-6-3m12 7v-4a3 3 0 0 0-1-2c3-.3 6-1.5 6-7a5 5 0 0 0-1-3 5 5 0 0 0 0-4s-2 0-4 2a12 12 0 0 0-6 0C7 1 5 1 5 1a5 5 0 0 0 0 4 5 5 0 0 0-1 3c0 5.5 3 6.7 6 7a3 3 0 0 0-1 2",
  slack: "M9 3v8H3m12-8v6h6M3 15h6v6m6 0v-6h6",
  terminal: "m5 7 5 5-5 5M13 17h6",
  key: "M15 5a5 5 0 1 1-3 9l-7 7H2v-4l6-6a5 5 0 0 1 7-6ZM17 8h.01",
  copy: "M9 9h12v12H9V9ZM15 5V3H3v12h2",
  download: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4",
  refresh: "M20 7V2l-3 3a9 9 0 1 0 3 11M20 2h-5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  folders: "M3 7h7l2-3h9v17H3V7ZM3 10h18",
  file: "M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8M8 17h6",
  info: "M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  back: "M19 12H5m6-6-6 6 6 6",
  sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2",
  moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
  monitor: "M3 3h18v14H3V3ZM8 21h8M12 17v4",
  computer: "M3 3h18v14H3V3ZM8 21h8M12 17v4",
  schedule: "M8 2v4M16 2v4M3 9h18M3 4h18v17H3V4ZM8 13h3M8 17h6",
  schedules: "M8 2v4M16 2v4M3 9h18M3 4h18v17H3V4ZM8 13h3M8 17h6",
  extensions: "M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.dot}"/></svg>`;
// The product mark: three teammates joined to one workspace, as on the app icon.
const brandMark = () =>
  `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 9 16 16l8-7M16 16v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="9" r="3.5"/><circle cx="24" cy="9" r="3.5"/><circle cx="16" cy="24" r="3.5"/><circle class="hub" cx="16" cy="16" r="2.2"/></svg>`;
const esc = (v = "") =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const root = document.querySelector("#app-root"),
  sheet = document.querySelector("#sheet"),
  toast = document.querySelector("#toast");
let data = {
    settings: {},
    bots: [],
    tasks: [],
    connections: [],
    approvals: [],
    device: {},
  },
  page = "home",
  selectedTask = "",
  events = [],
  editingApproval = "",
  approvalDraft = {},
  taskFilter = "all",
  taskSearch = "",
  connectionFilter = "all",
  setupOpen = false,
  setupStep = 0,
  started = false,
  composerDraft = "",
  composerBot = "",
  editingConnection = null,
  editingBot = null,
  explorer = null,
  toastTimer,
  refreshTimer,
  modelHost = "http://127.0.0.1:11434",
  installedModels = [],
  libraryLoaded = false,
  libraryError = "",
  modelTab = "connected";
let modelClients = [], clientScan = "idle", clientError = "", activityFilter = "all", moreTools = localStorage.getItem("benchhand-more-tools") === "1";
const clientNames = { claude: "Claude Code", codex: "Codex CLI", gemini: "Gemini CLI", opencode: "OpenCode", copilot: "GitHub Copilot CLI", qwen: "Qwen Code" };
const clientDocs = {
  claude:"https://code.claude.com/docs/en/setup",
  codex:"https://learn.chatgpt.com/docs/codex/quickstart",
  gemini:"https://geminicli.com/docs/get-started/installation/",
  opencode:"https://opencode.ai/docs/",
  copilot:"https://docs.github.com/en/copilot/how-tos/copilot-cli/install-copilot-cli",
  qwen:"https://qwenlm.github.io/qwen-code-docs/en/users/quickstart/",
};
const defaultAccent = "#54c2a4",
  legacyAccent = "#b4a0ff";
const accents = [
  "#54c2a4",
  "#5b9be0",
  "#e8836b",
  "#d4b073",
  "#e07a9b",
  "#b6c0c7",
];
const pages = {
  home: "Overview",
  tasks: "Tasks",
  team: "Teammates",
  connections: "Connections",
  approvals: "Approvals",
  models: "Models",
  extensions: "Marketplace",
  schedules: "Routines",
  computer: "Computer",
  folders: "Folders",
  settings: "Preferences",
};
const navGroups = [
  ["home", "tasks", "models", "folders"],
  ["team", "approvals", "schedules", "connections", "extensions", "computer"],
];
const providers = {
  ollama: {
    label: "Ollama",
    url: "http://127.0.0.1:11434/v1",
    protocol: "chat",
  },
  lmstudio: {
    label: "LM Studio",
    url: "http://127.0.0.1:1234/v1",
    protocol: "chat",
  },
  openai: {
    label: "OpenAI",
    url: "https://api.openai.com/v1",
    protocol: "responses",
  },
  openrouter: {
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    protocol: "chat",
  },
  groq: {
    label: "Groq",
    url: "https://api.groq.com/openai/v1",
    protocol: "chat",
  },
  custom: { label: "Custom endpoint", url: "", protocol: "chat" },
};
async function invoke(command, args = {}) {
  if (!window.__TAURI__?.core?.invoke)
    throw new Error("Open the desktop app to connect services and run tasks.");
  return window.__TAURI__.core.invoke(command, args);
}
function notify(text, error = false) {
  toast.textContent = String(text).replace(/^Error: /, "");
  toast.className = error ? "visible error" : "visible";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = ""), error ? 6500 : 3500);
}
const accentOf = (s) =>
  /^#[0-9a-f]{6}$/i.test(s.accent) && s.accent.toLowerCase() !== legacyAccent
    ? s.accent
    : defaultAccent;
function applyTheme() {
  const s = data.settings,
    h = document.documentElement;
  h.dataset.theme =
    s.theme === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : s.theme || "dark";
  for (const [k, v] of Object.entries({
    density: s.density || "comfortable",
    motion: s.reduceMotion ? "reduced" : "full",
    font: s.font || "sans",
  }))
    h.dataset[k] = v;
  h.style.setProperty("--accent", accentOf(s));
  h.style.setProperty("--base-font", `${Number(s.fontSize) || 14}px`);
  h.style.setProperty("--radius", `${Number(s.radius ?? 6)}px`);
}
// The CSP allows no inline style attributes, so colours and positions are applied here.
function colors(scope = document) {
  scope.querySelectorAll("[data-color]").forEach((e) => {
    if (/^#[0-9a-f]{6}$/i.test(e.dataset.color))
      e.style.setProperty(
        "--bot-color",
        e.dataset.color.toLowerCase() === legacyAccent ? "#7aa7e0" : e.dataset.color,
      );
  });
  scope.querySelectorAll("[data-left]").forEach((e) => {
    e.style.left = `${Number(e.dataset.left)}%`;
    if (e.dataset.width) e.style.width = `${Number(e.dataset.width)}%`;
  });
}
function relative(ts) {
  const n = Math.max(0, Date.now() / 1000 - Number(ts));
  return n < 60
    ? "Just now"
    : n < 3600
      ? `${Math.floor(n / 60)}m ago`
      : n < 86400
        ? `${Math.floor(n / 3600)}h ago`
        : new Date(ts * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
}
const duration = (seconds) => {
  const m = Math.max(1, Math.round(seconds / 60));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const clock = (ts) =>
  new Date(ts * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const pending = () => data.approvals.filter((a) => a.status === "pending");
const modelName = (b) =>
  data.connections.find((c) => c.id === b?.providerId)?.config.model ||
  "No model";
const avatar = (b, small = false) =>
  `<span class="avatar ${small ? "small" : ""}" data-color="${esc(b?.color || defaultAccent)}" aria-hidden="true">${esc((b?.name || "T").slice(0, 1).toUpperCase())}</span>`;
const stateOf = (t) => (t.waitingApproval ? "approval" : t.status);
const status = (t) =>
  t.waitingApproval
    ? "Needs approval"
    : {
        queued: "Draft",
        running: "Working",
        paused: "Paused",
        completed: "Completed",
        failed: "Failed",
        canceled: "Canceled",
      }[t.status] || t.status;
const pill = (t) =>
  `<span class="pill ${esc(stateOf(t))}">${status(t)}</span>`;
const button = (
  action,
  label,
  ic = "plus",
  attrs = "",
  cls = "button primary",
) =>
  `<button class="${cls}" data-action="${action}" ${attrs}>${ic ? icon(ic) : ""}<span>${label}</span></button>`;
const heading = (title, sub = "", actions = "") =>
  `<header class="page-heading"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</header>`;
const section = (title, sub = "", action = "") =>
  `<div class="section-heading"><h2>${title}</h2>${sub ? `<span class="subtle">${sub}</span>` : ""}${action ? `<div class="section-action">${action}</div>` : ""}</div>`;
const link = (pageId, label) =>
  `<button class="text-button" data-action="navigate" data-page="${pageId}">${label}</button>`;
const empty = (ic, title, body, action = "") =>
  `<div class="empty-state"><h3>${title}</h3><p>${body}</p>${action}</div>`;
const markdown = (text) =>
  window.marked && window.DOMPurify
    ? DOMPurify.sanitize(marked.parse(text || ""), {
        USE_PROFILES: { html: true },
      })
    : `<p class="plain-output">${esc(text)}</p>`;
function sidebar() {
  const running = data.tasks.filter((t) => t.status === "running").length,
    models = data.connections.filter((c) => c.kind === "model").length,
    navItem = (id) =>
      `<button class="nav-item ${page === id ? "active" : ""}" data-action="navigate" data-page="${id}" aria-label="${pages[id]}" title="${pages[id]}" ${page === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${pages[id]}</span>${id === "approvals" && pending().length ? `<b class="nav-count">${pending().length}</b>` : ""}</button>`;
  return `<aside class="sidebar"><button class="brand" data-action="navigate" data-page="home" aria-label="Benchhand overview">${brandMark()}<span>Benchhand</span></button><button class="workspace-button" data-action="navigate" data-page="settings" title="Workspace preferences"><strong>${esc(data.settings.workspaceName || "My workspace")}</strong><small>${esc(data.device.os === "windows" ? "This PC" : "This computer")} · local</small></button><nav aria-label="Main navigation">${`<div class="nav-group">${navGroups[0].map(navItem).join("")}</div><button class="nav-item more-tools" aria-label="More tools" data-action="more-tools" aria-expanded="${moreTools || navGroups[1].includes(page)}">${icon("extensions")}<span>More tools</span>${icon("chevron")}</button>${moreTools || navGroups[1].includes(page) ? `<div class="nav-group advanced-nav">${navGroups[1].map(navItem).join("")}</div>` : ""}`}</nav><div class="sidebar-spacer"></div><div class="local-status" title="${plural(models, "model connection")}"><i class="status-dot ${running ? "live" : ""}"></i><span>${running ? `${plural(running, "task")} running` : "Idle"}<small>${plural(models, "model")} connected</small></span></div>${navItem("settings")}<div class="sidebar-footer"><span class="profile-initial" aria-hidden="true">${esc((data.settings.ownerName || "Y")[0].toUpperCase())}</span><span>${esc(data.settings.ownerName || "You")}<small>Benchhand ${esc(data.device.version || "0.3.0")}</small></span></div></aside>`;
}
function topbar() {
  return `<div class="topbar"><div class="breadcrumbs"><span>${esc(data.settings.workspaceName)}</span><span class="crumb-sep">/</span><strong>${pages[page]}</strong></div><div class="topbar-right"><button class="search-trigger" data-action="command">${icon("search")}<span>Jump to anything</span><kbd>Ctrl K</kbd></button><button class="icon-button" title="Review approvals" aria-label="Review approvals" data-action="navigate" data-page="approvals">${icon("approvals")}${pending().length ? '<span class="notification-dot"></span>' : ""}</button></div></div>`;
}
// What a teammate is doing now, in the words the lanes and the team table share.
function botState(b) {
  const mine = data.tasks.filter((t) => t.botId === b.id),
    waiting = mine.find((t) => t.waitingApproval),
    running = mine.find((t) => t.status === "running"),
    last = mine
      .filter((t) => ["completed", "failed", "canceled"].includes(t.status))
      .sort((x, y) => y.updatedAt - x.updatedAt)[0];
  if (waiting)
    return { key: "approval", text: "Waiting on you", task: waiting };
  if (running)
    return {
      key: "running",
      text: `Working · ${duration(Date.now() / 1000 - running.createdAt)}`,
      task: running,
    };
  if (last?.status === "failed" && Date.now() / 1000 - last.updatedAt < 86400)
    return { key: "failed", text: "Last run failed", task: last };
  return {
    key: "idle",
    text: last ? `Idle · last run ${relative(last.updatedAt)}` : "No runs yet",
    task: last,
  };
}
function teamLanes() {
  const end = Date.now() / 1000,
    start = end - 86400,
    pos = (ts) => ((Math.max(ts, start) - start) / 86400) * 100,
    tick = new Date(start * 1000);
  tick.setMinutes(0, 0, 0);
  do tick.setHours(tick.getHours() + 1);
  while (tick.getHours() % 6);
  const ticks = [];
  for (; tick.getTime() / 1000 < end - 5400; tick.setHours(tick.getHours() + 6))
    ticks.push(tick.getTime() / 1000);
  const lane = (b) => {
    const s = botState(b),
      runs = data.tasks.filter(
        (t) =>
          t.botId === b.id &&
          t.status !== "queued" &&
          (t.status === "running" || t.waitingApproval || t.updatedAt > start),
      );
    return `<div class="lane"><button class="lane-label" data-action="edit-bot" data-id="${esc(b.id)}">${avatar(b)}<span><strong>${esc(b.name)}</strong><small class="state-${s.key}">${esc(s.text)}</small></span></button><div class="lane-track">${runs
      .map((t) => {
        const until =
            t.status === "running" || t.waitingApproval ? end : t.updatedAt,
          left = pos(t.createdAt);
        return `<button class="run ${esc(stateOf(t))}" data-action="task-detail" data-id="${esc(t.id)}" data-left="${left.toFixed(2)}" data-width="${Math.max(pos(until) - left, 0.5).toFixed(2)}" title="${esc(t.title)} · ${status(t)}" aria-label="${esc(t.title)}, ${status(t)}"></button>`;
      })
      .join("")}</div></div>`;
  };
  return `<section class="panel lanes-panel">${section("Team, last 24 hours", "", `<span class="legend"><i class="key running"></i>Working<i class="key approval"></i>Waiting on you<i class="key failed"></i>Failed<i class="key completed"></i>Finished</span>`)}<div class="lanes">${data.bots.map(lane).join("") || `<p class="subtle">Add a teammate to see its work here.</p>`}<div class="lane axis" aria-hidden="true"><span></span><div class="lane-track">${ticks.map((t) => `<time data-left="${pos(t).toFixed(2)}">${clock(t)}</time>`).join("")}<time class="now">Now</time></div></div></div></section>`;
}
function waitingPanel() {
  const approvals = pending(),
    failed = data.tasks
      .filter(
        (t) =>
          t.status === "failed" && Date.now() / 1000 - t.updatedAt < 86400,
      )
      .slice(0, 3),
    rows = [
      ...approvals.slice(0, 4).map(
        (a) =>
          `<li><button class="queue-row" data-action="navigate" data-page="approvals"><span class="pill approval">Approve</span><span><strong>${esc(a.title)}</strong><small>${esc(data.tasks.find((t) => t.id === a.taskId)?.botName || "Teammate")} · ${esc(a.target)} · ${relative(a.createdAt)}</small></span></button></li>`,
      ),
      ...failed.map(
        (t) =>
          `<li><button class="queue-row" data-action="task-detail" data-id="${esc(t.id)}"><span class="pill failed">Failed</span><span><strong>${esc(t.title)}</strong><small>${esc(t.botName)} · ${relative(t.updatedAt)}</small></span></button></li>`,
      ),
    ];
  return `<section class="panel waiting-panel">${section("Waiting on you", rows.length ? String(rows.length) : "", approvals.length ? link("approvals", "Review all") : "")}${rows.length ? `<ul class="queue">${rows.join("")}</ul>` : `<p class="panel-empty">Nothing is waiting for you. Sends, posts and imported tool calls stop here until you decide.</p>`}</section>`;
}
function taskRows(list, compact = false) {
  return list
    .map(
      (t) =>
        `<button class="task-row ${compact ? "compact" : ""}" data-action="task-detail" data-id="${esc(t.id)}"><span class="task-row-text"><strong>${esc(t.title)}</strong>${!compact && t.description ? `<small>${esc(t.description)}</small>` : ""}</span><span class="task-bot">${esc(t.botName)}</span>${pill(t)}<time class="num">${relative(t.updatedAt)}</time></button>`,
    )
    .join("");
}
const taskHeader = () =>
  `<div class="list-header" aria-hidden="true"><span>Task</span><span>Teammate</span><span>Status</span><span class="num">Updated</span></div>`;
function routinesPanel() {
  const list = (data.schedules || [])
    .filter((s) => s.enabled && s.nextRunAt)
    .sort((a, b) => a.nextRunAt - b.nextRunAt)
    .slice(0, 3);
  return `<section class="panel">${section("Next routines", "", link("schedules", "All routines"))}${list.length ? `<ul class="plain-list">${list.map((s) => `<li><span><strong>${esc(s.name)}</strong><small>${esc(data.bots.find((b) => b.id === s.botId)?.name || "Teammate")}</small></span><time class="num">${esc(nextRun(s.nextRunAt))}</time></li>`).join("")}</ul>` : `<p class="panel-empty">No routines scheduled. ${link("schedules", "Create one")}</p>`}</section>`;
}
function nextRun(ts) {
  const d = new Date(ts * 1000),
    today = new Date(),
    tomorrow = new Date(Date.now() + 86400000);
  const day =
    d.toDateString() === today.toDateString()
      ? "Today"
      : d.toDateString() === tomorrow.toDateString()
        ? "Tomorrow"
        : d.toLocaleDateString(undefined, { weekday: "short" });
  return `${day} ${clock(ts)}`;
}
function modelsPanel() {
  const list = data.connections.filter((c) => c.kind === "model");
  return `<section class="panel">${section("Models", "", link("models", "Manage"))}${list.length ? `<ul class="plain-list">${list.map((c) => `<li><span><strong>${esc(c.label)}</strong><small>${esc(c.config.model)}</small></span><span class="subtle">${plural(data.bots.filter((b) => b.providerId === c.id).length, "teammate")}</span></li>`).join("")}</ul>` : `<p class="panel-empty">No model connected yet. ${link("models", "Connect one")}</p>`}</section>`;
}
function checklist() {
  const n = [
    !!data.settings.ownerName,
    data.connections.some((c) => c.kind === "model"),
    data.connections.some((c) => c.kind !== "model"),
  ];
  return `<button class="setup-banner" data-action="setup"><span><strong>Finish setting up</strong><small>Your name, a model, and one connected tool.</small></span><span class="setup-progress" aria-label="${n.filter(Boolean).length} of 3 done">${n.map((x) => `<i class="${x ? "done" : ""}"></i>`).join("")}</span><span class="subtle num">${n.filter(Boolean).length} of 3</span>${icon("chevron")}</button>`;
}
function overviewLine() {
  const working = data.tasks.filter((t) => t.status === "running").length,
    waiting = pending().length,
    failed = data.tasks.filter(
      (t) => t.status === "failed" && Date.now() / 1000 - t.updatedAt < 86400,
    ).length,
    parts = [
      working
        ? `${plural(working, "task")} running`
        : "No tasks running",
      waiting
        ? `<b class="warn">${plural(waiting, "action")} waiting for your approval</b>`
        : "",
      failed ? `<b class="bad">${plural(failed, "task")} failed today</b>` : "",
    ];
  return parts.filter(Boolean).join(" · ");
}
function homeView() {
  if (!data.tasks.some((t) => t.status === "completed")) return firstRunHome();
  const hasModel = data.connections.some((c) => c.kind === "model"),
    starters = [
      ["github", "Triage my GitHub issues"],
      ["slack", "Catch me up on Slack"],
      ["plan", "Turn a goal into a plan"],
    ];
  return `${heading(esc(data.settings.workspaceName || "My workspace"), overviewLine(), button("new-task", "New task"))}${!data.settings.setupComplete ? checklist() : ""}<section class="composer"><label class="visually-hidden" for="home-prompt">Task goal</label><textarea id="home-prompt" rows="2" aria-label="Task goal" placeholder="Give a teammate a task. Paste context, links, or a goal.">${esc(composerDraft)}</textarea><div class="composer-bottom"><label class="composer-select"><span>Assign to</span><select id="home-bot" aria-label="Assign to teammate">${data.bots.map((b) => `<option value="${esc(b.id)}" ${composerBot === b.id ? "selected" : ""}>${esc(b.name)} · ${esc(modelName(b))}</option>`).join("")}</select></label>${
    data.settings.showStarters
      ? `<div class="starters">${starters.map(([id, label]) => `<button class="starter" data-action="starter" data-template="${id}">${label}</button>`).join("")}</div>`
      : ""
  }${button(hasModel ? "submit-home" : "connect-model", hasModel ? "Start task" : "Connect a model", hasModel ? "arrow" : "model", "", "button primary")}</div></section><div class="grid two-one">${teamLanes()}${waitingPanel()}</div><div class="grid two-one"><section class="panel">${section("Recent tasks", `${data.tasks.filter((t) => t.status === "completed").length} completed`, link("tasks", "All tasks"))}${data.tasks.length ? `<div class="task-list">${taskHeader()}${taskRows(data.tasks.slice(0, 6), true)}</div>` : `<p class="panel-empty">No tasks yet. Write one above and choose who takes it.</p>`}</section><div class="stack">${routinesPanel()}${modelsPanel()}</div></div>${data.settings.showActivity ? `<p class="workspace-note">${icon("key")}<span>Tasks, results and history are stored on this computer. Keys live in your OS credential store.</span></p>` : ""}`;
}
function firstRunHome() {
  const model = data.connections.find((c) => c.kind === "model");
  const bot = data.bots.find((b) => b.providerId) || data.bots[0];
  if (bot && !composerBot) composerBot = bot.id;
  return `${heading(model ? "Try your first task" : "Start with a model", model ? `${esc(model.label)} is connected. Give your assistant a small job and watch it work.` : "Use a tool you already have, then give your assistant a job.", button("setup", "Personalize workspace", "settings", "", "button quiet"))}<div class="first-run-layout"><section class="panel first-run-primary">${model ? `${section("What would you like help with?")}<div class="first-task-folder"><span>${(data.folders || []).some((f) => f.botId === bot?.id) ? "Your assistant has a working folder connected." : "Working with your own files?"}</span><button class="text-button" data-action="navigate" data-page="folders">${(data.folders || []).some((f) => f.botId === bot?.id) ? "Manage folder" : "Add a folder (optional)"} ${icon("arrow")}</button></div><div class="first-task-example"><strong>Not sure where to start?</strong><p>Run a quick introduction. Your assistant will suggest useful first tasks without using any tools.</p><button class="button primary" data-action="first-task">${icon("play")} Try a simple task</button></div><div class="first-task-composer"><label class="field"><span>Or write your own task</span><textarea id="home-prompt" rows="3" aria-label="Task goal" placeholder="Help me plan a project, explain something, or work through an idea.">${esc(composerDraft)}</textarea></label><details><summary>Choose a teammate</summary><label class="field"><span>Assign to</span><select id="home-bot" aria-label="Assign to teammate">${data.bots.map((b) => `<option value="${esc(b.id)}" ${b.id === composerBot ? "selected" : ""}>${esc(b.name)} · ${esc(modelName(b))}</option>`).join("")}</select></label></details><button class="button secondary" data-action="submit-home">${icon("arrow")} Start task</button></div>` : `${section("Which tool do you already use?")}<p class="first-run-copy">Choose one. Benchhand uses its existing sign-in, so you don't need to find an API key.</p><div class="first-run-clients">${Object.entries(clientNames).map(([id, name]) => `<button class="first-run-choice" aria-label="Use ${name}" data-action="connect-cli" data-provider="${id}">${icon("terminal")}<span><strong>Use ${name}</strong><small>Use its existing sign-in on this computer</small></span>${icon("arrow")}</button>`).join("")}</div><details class="first-run-other"><summary>Use a local model or an API key instead</summary><div class="model-shortcuts"><button class="button secondary" data-action="connect-model" data-preset="ollama">Connect Ollama or LM Studio</button><button class="button secondary" data-action="connect-model" data-preset="openai">Connect a cloud API</button></div></details>`}</section><aside class="first-run-guide"><h2>How Benchhand works</h2><ol><li><strong>Choose your model</strong><p>Your existing signed-in tool, a local model, or a cloud provider.</p></li><li><strong>Give it one clear task</strong><p>Start small. You can add files, connected apps and more teammates later.</p></li><li><strong>Watch the work</strong><p>Open the task to see model output, tool requests and results. External writes wait for approval.</p></li></ol><p class="subtle">You can change the model, layout and preferences at any time.</p></aside></div>`;
}
function foldersView() {
  const folders = data.folders || [];
  return `${heading("Folders", "Work on projects and files already on this computer.", button("folder-connect", "Add a folder", "plus"))}<section class="panel">${section("Working folders", folders.length ? plural(folders.length, "connected folder") : "Choose a folder to get started")}${folders.length ? `<div class="folder-list">${folders.map((f) => { const bot = data.bots.find((b) => b.id === f.botId); return `<article class="folder-row">${icon("folders")}<div><h3>${esc(f.path.split(/[\\/]/).filter(Boolean).at(-1) || f.path)}</h3><p>${esc(f.path)}</p><small>${esc(bot?.name || "Assistant")} · reads allowed · changes need approval</small></div><div class="row-actions"><button class="button secondary small" data-action="folder-task" data-id="${esc(f.botId)}">Start a task here</button><button class="button quiet small" data-action="folder-detach" data-id="${esc(f.botId)}">Disconnect</button></div></article>`; }).join("")}</div>` : `<div class="folder-empty"><p>Connect a project, notes folder, or document workspace. Your assistant can read text files inside it and propose changes for you to review.</p><button class="button secondary" data-action="folder-connect">${icon("folders")} Choose a folder</button></div>`}</section><section class="folder-explanation"><h2>Your files stay where they are</h2><p>One working folder per teammate. File tools use paths inside that folder; links leading outside it are rejected. Changes to attached folders wait for your approval. Disconnecting does not delete or move files.</p><p>File contents needed for a task go to the model you select. Use a local model if those contents must remain on this computer.</p></section>`;
}
function folderForm() {
  openSheet(`${dialogHeading("Add a working folder", "Choose an existing folder. Your assistant can read it and propose file changes.")}<form id="folder-form"><div class="sheet-body"><label class="field"><span>Assistant</span><select name="botId">${data.bots.map((b) => `<option value="${esc(b.id)}">${esc(b.name)} · ${esc(b.role)}</option>`).join("")}</select></label><button type="button" class="button primary" data-action="folder-pick">${icon("folders")} Choose folder on this computer</button><p class="helper spaced">Every file change asks for approval. Stop this assistant’s running tasks before changing its working folder.</p><details class="cli-advanced"><summary>Enter a folder path instead</summary><label class="field"><span>Existing folder path</span><input name="path" placeholder="${data.device.os === "windows" ? "C:\\Users\\you\\Documents\\My project" : "/home/you/projects/my-project"}"></label><button type="submit" class="button secondary">Connect this path</button></details><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button type="button" class="button quiet" data-action="close-sheet">Cancel</button></div></form>`);
}
function filteredTasks() {
  const list = data.tasks.filter(
    (t) =>
      (taskFilter === "all" ||
        t.status === taskFilter ||
        (taskFilter === "attention" &&
          (t.status === "failed" || t.waitingApproval))) &&
      `${t.title} ${t.description} ${t.botName}`
        .toLowerCase()
        .includes(taskSearch.toLowerCase()),
  );
  return list.length
    ? taskHeader() + taskRows(list)
    : empty(
        "tasks",
        taskSearch ? "Nothing matches that search" : "No tasks here",
        "Try another filter, or give a teammate a new task.",
        button("new-task", "Create a task", "plus", "", "button secondary"),
      );
}
function tasksView() {
  const count = (id) =>
    id === "all"
      ? data.tasks.length
      : id === "attention"
        ? data.tasks.filter((t) => t.status === "failed" || t.waitingApproval)
            .length
        : data.tasks.filter((t) => t.status === id).length;
  return selectedTask
    ? taskDetail()
    : `${heading("Tasks", `${plural(data.tasks.length, "task")} · ${data.tasks.filter((t) => t.status === "running").length} running · ${pending().length} waiting on you`, button("new-task", "New task"))}<div class="filter-toolbar"><div class="tabs" role="tablist" aria-label="Task filters">${[
        ["all", "All"],
        ["running", "Working"],
        ["completed", "Completed"],
        ["attention", "Needs attention"],
      ]
        .map(
          ([id, label]) =>
            `<button class="tab ${taskFilter === id ? "active" : ""}" role="tab" aria-selected="${taskFilter === id}" data-action="task-filter" data-filter="${id}">${label} <span class="num">${count(id)}</span></button>`,
        )
        .join(
          "",
        )}</div><label class="search-field">${icon("search")}<input id="task-search" type="search" value="${esc(taskSearch)}" placeholder="Find a task" aria-label="Search tasks"></label></div><div id="task-list" class="task-list">${filteredTasks()}</div>`;
}
const stamp = (ts) =>
  new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
// Steps are read from the run's own events, so the list only shows work that happened.
function taskSteps(t) {
  const decisions = data.approvals
      .filter((a) => a.taskId === t.id)
      .sort((x, y) => x.createdAt - y.createdAt),
    open = (steps, ...states) => steps.findLast((s) => states.includes(s.state));
  let steps = [],
    asked = 0;
  for (const e of events) {
    const m = e.message,
      at = e.createdAt;
    let r;
    if (m === "Run started") steps = [];
    else if ((r = m.match(/^Running: (.+)$/))) {
      const waiting = open(steps, "approval");
      if (waiting)
        Object.assign(waiting, { label: r[1], state: "active", at, approved: true });
      else steps.push({ label: r[1], state: "active", at });
    } else if ((r = m.match(/^Tool (completed|reported an error): (.+)$/))) {
      const step = open(steps, "active");
      if (step)
        Object.assign(step, { state: r[1] === "completed" ? "done" : "error", at });
    } else if (m === "Waiting for your approval") {
      const a = decisions[asked++];
      steps.push({ label: a?.title || "Your approval", state: "approval", at });
    } else if (m === "You edited the inputs before approving") {
      const step = open(steps, "approval");
      if (step) step.edited = true;
    } else if (m === "Waiting for delegated work") {
      // A delegation call stays open until the child task reports back.
      const step = open(steps, "active");
      if (step) Object.assign(step, { label: "Delegated work", delegated: true });
      else steps.push({ label: "Delegated work", state: "active", at, delegated: true });
    }
    else if (m.startsWith("Thinking")) {
      const step = open(steps, "approval", "active");
      if (step?.state === "approval") Object.assign(step, { state: "rejected", at });
      else if (step?.delegated) Object.assign(step, { state: "done", at });
    } else if (m === "Task completed")
      steps.push({ label: "Write the result", state: "done", at, final: true });
    else if (m.startsWith("Run stopped")) {
      const step = open(steps, "active");
      if (step) Object.assign(step, { state: "error", at });
    }
  }
  const live = t.status === "running" || t.waitingApproval || t.waitingChild;
  if (t.status === "running" && !open(steps, "active", "approval"))
    steps.push({ label: "Decide the next step", state: "active" });
  if (live && !steps.some((s) => s.final))
    steps.push({ label: "Write the result", state: "waiting" });
  if (!live) for (const s of steps) if (s.state === "active") s.state = "stopped";
  return steps;
}
function stepsPanel(t) {
  const steps = taskSteps(t);
  if (!steps.length) return "";
  const word = {
      done: "Done",
      active: "Working",
      approval: "Waiting for you",
      error: "Error",
      rejected: "Rejected",
      stopped: "Stopped",
      waiting: "Not started",
    },
    done = steps.filter((s) => s.state === "done").length;
  return `<section class="panel steps-panel">${section("Progress", `${done} completed · updates as work proceeds`)}<ol class="steps">${steps.map((s) => `<li class="step ${s.state}"><i class="step-mark" aria-hidden="true">${s.state === "done" ? icon("check") : ""}</i><span class="step-label">${esc(s.label)}${s.edited ? "<small>Edited and approved by you</small>" : s.approved ? "<small>Approved by you</small>" : ""}</span><span class="step-state">${word[s.state]}${s.at && s.state !== "waiting" ? ` · <time class="num">${clock(s.at)}</time>` : ""}</span></li>`).join("")}</ol></section>`;
}
function taskSpotlight(t) {
  if (t.waitingApproval) return `<div class="task-spotlight waiting">${icon("approvals")}<span><strong>Waiting for your review</strong><small>Review the requested action to continue.</small></span></div>`;
  if (t.waitingChild) return `<div class="task-spotlight">${icon("team")}<span><strong>Waiting for delegated work</strong><small>The result will return to this task.</small></span></div>`;
  if (t.status !== "running") return "";
  const current = taskSteps(t).find((step) => step.state === "active")?.label || "Starting the task";
  return `<div class="task-spotlight">${icon("pulse")}<span><strong>${esc(t.botName)} is working</strong><small>${esc(current)}</small></span></div>`;
}
function taskDetail() {
  const t = data.tasks.find((t) => t.id === selectedTask);
  if (!t) {
    selectedTask = "";
    return tasksView();
  }
  const b = data.bots.find((b) => b.id === t.botId),
    a = pending().find((a) => a.taskId === t.id),
    routine = (data.schedules || []).find((s) => s.id === t.scheduleId),
    detail = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`,
    result = t.output
      ? `<article class="markdown">${markdown(t.output)}</article>`
      : t.status === "running"
        ? `<div class="working-state"><p class="subtle">The final result will appear here when the task finishes.</p></div>`
        : `<div class="task-brief"><p class="subtle">${t.waitingApproval ? "Waiting for your decision. Review the action above to continue." : t.waitingChild ? "Waiting for delegated work to finish." : t.status === "paused" ? "This task is paused. Review its activity for details." : t.status === "queued" ? "This is a draft. Run it when the brief is ready." : "No result yet. Run the task again to produce one."}</p></div>`;
  return `<button class="text-button back-button" data-action="task-back">${icon("back")} All tasks</button><header class="page-heading task-heading"><div><h1>${esc(t.title)}</h1><p>${pill(t)}<span>${avatar(b, true)} ${esc(t.botName)}</span><span>Started ${relative(t.createdAt)}</span></p>${t.description ? `<p class="task-description">${esc(t.description)}</p>` : ""}</div><div class="heading-actions">${["running", "queued", "paused"].includes(t.status) ? button("cancel-task", "Cancel", "stop", `data-id="${esc(t.id)}"`, "button secondary") : ""}${!t.waitingApproval && !t.waitingChild && t.status !== "running" ? button("run-task", t.status === "queued" ? "Run task" : "Run again", "play", `data-id="${esc(t.id)}"`) : ""}</div></header>${t.error ? `<div class="callout error">${icon("info")}<span>${esc(t.error)}</span></div>` : ""}${taskSpotlight(t)}<div class="task-layout"><div class="task-main">${a ? approvalCard(a) : ""}${stepsPanel(t)}${delegationDetail(t)}${activityPanel(t)}<section class="panel result-panel">${section("Result", "", t.output ? `<button class="icon-button" title="Copy result" aria-label="Copy result" data-action="copy-result">${icon("copy")}</button><button class="icon-button" title="Export Markdown" aria-label="Export Markdown" data-action="export-result">${icon("download")}</button>` : "")}${result}</section></div><aside class="task-rail"><section class="panel">${section("Details")}<dl class="detail-list">${detail("Teammate", `<span class="detail-bot">${avatar(b, true)}<span><strong>${esc(t.botName)}</strong>${b?.role ? `<small>${esc(b.role)}</small>` : ""}</span></span>`)}${detail("Model", esc(modelName(b)))}${t.workingFolder ? detail("Working folder", esc(t.workingFolder)) : ""}${detail("Created", `<time class="num">${stamp(t.createdAt)}</time>`)}${detail("Updated", `<time class="num">${relative(t.updatedAt || t.createdAt)}</time>`)}${routine ? detail("Routine", esc(routine.name)) : ""}</dl></section></aside></div>`;
}
function teamView() {
  return `${heading("Teammates", `${plural(data.bots.length, "teammate")} · each with its own model, instructions and private workspace`, button("edit-bot", "New teammate"))}<section class="panel"><div class="list-header team-header" aria-hidden="true"><span>Teammate</span><span>Model</span><span>Now</span><span class="num">Tasks</span></div>${data.bots.map(teammateCard).join("") || empty("team", "No teammates yet", "Create one and give it a role and a model.")}</section><p class="workspace-note">${icon("model")}<span>Every teammate can use the connected tools. Its model and instructions decide how it works.</span></p>`;
}
function teammateCard(b) {
  const s = botState(b);
  return `<button class="teammate-card" data-action="edit-bot" data-id="${esc(b.id)}">${avatar(b)}<span class="teammate-name"><strong>${esc(b.name)}</strong><small>${esc(b.role)}</small></span><span class="teammate-model">${esc(modelName(b))}</span><span class="state-${s.key}">${esc(s.text)}</span><span class="num">${data.tasks.filter((t) => t.botId === b.id).length}</span></button>`;
}
const catalog = [
  {
    id: "local",
    kind: "model",
    ic: "terminal",
    name: "Local models",
    tag: "On this computer",
    desc: "Ollama, LM Studio, vLLM, or any compatible local server.",
    sub: "No key needed for most local servers.",
  },
  {
    id: "cloud",
    kind: "model",
    ic: "globe",
    name: "Cloud models",
    tag: "Your API key",
    desc: "OpenAI, OpenRouter, Groq, or your own compatible endpoint.",
    sub: "Chat Completions and Responses APIs.",
  },
  {
    id: "github",
    kind: "github",
    ic: "github",
    name: "GitHub",
    tag: "Code and issues",
    desc: "Browse repositories, read open issues, and draft new ones.",
    sub: "Creating issues needs your approval.",
  },
  {
    id: "slack",
    kind: "slack",
    ic: "slack",
    name: "Slack",
    tag: "Channels",
    desc: "Read channel history, summarise threads, and draft updates.",
    sub: "Sending messages needs your approval.",
  },
  {
    id: "mcp",
    kind: "mcp",
    ic: "connections",
    name: "MCP servers",
    tag: "Your tools",
    desc: "Import a Streamable HTTP MCP server and discover its tools.",
    sub: "Each imported tool call needs your approval.",
  },
];
function connectionsView() {
  const cards = catalog.filter(
    (c) =>
      connectionFilter === "all" ||
      (connectionFilter === "models" ? c.kind === "model" : c.kind !== "model"),
  );
  const kindName = { model: "Model", github: "GitHub", slack: "Slack", mcp: "MCP server" };
  return `${heading("Connections", `${plural(data.connections.length, "connection")} · secrets stay in your OS credential store`, button("connect-mcp", "Add MCP server", "plus", "", "button secondary"))}${data.connections.length ? `<section class="panel">${section("Connected")}<div class="list-header connected-header" aria-hidden="true"><span>Name</span><span>Type</span><span class="num">Verified</span><span></span></div><div class="connected-list">${data.connections.map((c) => `<article class="connected-row"><span class="connection-identity">${icon(c.kind === "model" ? "model" : c.kind === "mcp" ? "connections" : c.kind)}<span><strong>${esc(c.label)}</strong><small>${esc(c.account)}</small></span></span><span class="subtle">${kindName[c.kind] || esc(c.kind)}</span><time class="num">${relative(c.verifiedAt)}</time><div class="row-actions">${c.kind !== "model" ? `<button class="button small secondary" data-action="browse" data-id="${esc(c.id)}">Browse</button>` : ""}<button class="icon-button" title="Test ${esc(c.label)}" aria-label="Test ${esc(c.label)}" data-action="test-connection" data-id="${esc(c.id)}">${icon("refresh")}</button><button class="icon-button" title="Manage ${esc(c.label)}" aria-label="Manage ${esc(c.label)}" data-action="edit-connection" data-id="${esc(c.id)}">${icon("settings")}</button></div></article>`).join("")}</div></section>` : ""}<section class="panel">${section("Add a connection")}<div class="tabs catalog-tabs" role="tablist">${[
    ["all", "All"],
    ["models", "Models"],
    ["apps", "Apps and tools"],
  ]
    .map(
      ([id, label]) =>
        `<button class="tab ${connectionFilter === id ? "active" : ""}" role="tab" aria-selected="${connectionFilter === id}" data-action="connection-filter" data-filter="${id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="catalog-list">${cards.map((c) => `<article class="catalog-card">${icon(c.ic)}<div class="catalog-text"><h3>${c.name}</h3><p>${c.desc}</p><small>${c.tag} · ${c.sub}</small></div><button class="button secondary" data-action="connect-catalog" data-kind="${c.kind}" data-preset="${c.id === "local" ? "ollama" : c.id === "cloud" ? "openai" : ""}">${icon("plus")} Connect ${c.kind === "model" ? "a model" : c.kind === "mcp" ? "a server" : c.name}</button></article>`).join("")}</div></section>`;
}
const fieldName = (k) =>
  String(k)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
const argText = (v) => (typeof v === "string" ? v : JSON.stringify(v));
function computerSentence(tool, x) {
  const at = (px, py) => `${px}, ${py}`,
    on = x.displayId !== undefined ? ` on display ${x.displayId}` : "";
  return (
    {
      computer_click: () =>
        `${x.count === 2 ? "Double-click" : "Click"}${x.button && x.button !== "left" ? ` the ${x.button} button` : ""} at ${at(x.x, x.y)}${on}`,
      computer_move: () => `Move the pointer to ${at(x.x, x.y)}${on}`,
      computer_drag: () => `Drag from ${at(x.x, x.y)} to ${at(x.toX, x.toY)}${on}`,
      computer_type: () => `Type “${x.text}” into the focused control`,
      computer_key: () => `Press ${x.keys}`,
      computer_scroll: () => `Scroll ${x.direction} by ${plural(x.steps, "step")}`,
    }[tool]?.() || "Use this computer"
  );
}
// A readable view of the proposed action. The exact inputs stay one click away.
function approvalPreview(a) {
  const x = a.arguments || {},
    tool = a.toolName || "",
    field = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  if (/^slack_send/.test(tool))
    return `<div class="action-preview"><dl class="preview-fields">${field("Channel", `<code>${esc(argText(x.channel))}</code>`)}</dl><p class="preview-message">${esc(argText(x.text))}</p></div>`;
  if (/^github_create_issue/.test(tool))
    return `<div class="action-preview"><dl class="preview-fields">${field("Repository", `<code>${esc(argText(x.repository))}</code>`)}${field("Title", `<strong>${esc(argText(x.title))}</strong>`)}</dl><article class="markdown preview-message">${markdown(argText(x.body))}</article></div>`;
  if (tool === "workspace_patch") return `<div class="action-preview"><dl class="preview-fields">${field("Folder", esc(a.target))}${field("File", `<code>${esc(argText(x.path))}</code>`)}</dl><strong>Replace</strong><pre class="file-change-preview">${esc(argText(x.old_text))}</pre><strong>With</strong><pre class="file-change-preview">${esc(argText(x.new_text))}</pre><p class="helper">The original text must still match exactly once when this runs.</p></div>`;
  if (tool === "workspace_write") return `<div class="action-preview"><dl class="preview-fields">${field("Folder", esc(a.target))}${field("File", `<code>${esc(argText(x.path))}</code>`)}</dl><strong>Proposed file content</strong><pre class="file-change-preview">${esc(argText(x.content))}</pre></div>`;
  if (tool.startsWith("computer_"))
    return `<div class="action-preview"><p class="preview-sentence">${esc(computerSentence(tool, x))}</p><p class="helper">Positions run from 0 to 1000 across the display.</p></div>`;
  const entries = Object.entries(x);
  return `<div class="action-preview"><dl class="preview-fields">${tool ? field("Tool", `<code>${esc(tool)}</code>`) : ""}${entries.map(([k, v]) => field(esc(fieldName(k)), `<span class="preview-value">${esc(argText(v))}</span>`)).join("") || field("Inputs", "None")}</dl></div>`;
}
function approvalEditor(a) {
  return `<div class="approval-editor">${Object.entries(a.arguments || {})
    .map(([k, v], i) => {
      // The control follows the original value's type, and drafts keep typing across refreshes.
      const draft = approvalDraft[k],
        attrs = `id="approval-arg-${i}" data-arg="${esc(k)}"`,
        label = esc(fieldName(k));
      if (typeof v === "boolean")
        return `<label class="toggle-field"><input type="checkbox" ${attrs} data-type="boolean" ${(draft ?? v) ? "checked" : ""}><span>${label}</span></label>`;
      if (typeof v === "number")
        return `<label class="field"><span>${label}</span><input type="number" step="any" ${attrs} data-type="number" value="${esc(draft ?? v)}"></label>`;
      if (typeof v === "string" && v.length < 70 && !v.includes("\n"))
        return `<label class="field"><span>${label}</span><input ${attrs} data-type="string" value="${esc(draft ?? v)}"></label>`;
      const text = draft ?? (typeof v === "string" ? v : JSON.stringify(v, null, 2));
      return `<label class="field"><span>${label}${typeof v === "string" ? "" : " (JSON)"}</span><textarea ${attrs} data-type="${typeof v === "string" ? "string" : "json"}" rows="${Math.min(14, Math.max(4, text.split("\n").length + 1))}">${esc(text)}</textarea></label>`;
    })
    .join("")}<p class="helper">You can change values but not add or remove fields. The edited inputs are what runs.</p><div class="form-error" role="alert" hidden></div></div>`;
}
function editedArguments(card, a) {
  const out = { ...a.arguments };
  for (const el of card.querySelectorAll("[data-arg]")) {
    const k = el.dataset.arg,
      type = el.dataset.type;
    if (type === "boolean") out[k] = el.checked;
    else if (type === "number") {
      const n = Number(el.value);
      if (el.value.trim() === "" || !Number.isFinite(n))
        throw new Error(`${fieldName(k)} must be a number.`);
      out[k] = n;
    } else if (type === "json") {
      try {
        out[k] = JSON.parse(el.value);
      } catch {
        throw new Error(`${fieldName(k)} must be valid JSON.`);
      }
    } else out[k] = el.value;
  }
  return out;
}
function approvalCard(a) {
  const t = data.tasks.find((t) => t.id === a.taskId),
    editing = editingApproval === a.id,
    id = `data-id="${esc(a.id)}"`;
  return `<article class="approval-card ${editing ? "editing" : ""}" tabindex="0" role="group" aria-label="${esc(a.title)}"><header><div><h3>${esc(a.title)}</h3><p>${esc(t?.botName || "Teammate")} · ${esc(a.target)} · ${relative(a.createdAt)}${t && t.id !== selectedTask ? ` · <button class="text-button" data-action="task-detail" data-id="${esc(t.id)}">${esc(t.title)}</button>` : ""}</p></div><span class="pill approval">${editing ? "Editing" : "Needs approval"}</span></header>${editing ? approvalEditor(a) : `${approvalPreview(a)}<details class="raw-inputs"><summary>Exact inputs</summary><pre class="approval-payload">${esc(JSON.stringify(a.arguments, null, 2))}</pre></details>`}<div class="approval-actions">${editing ? `<button class="button secondary" data-action="edit-approval" ${id}>Cancel edit</button><button class="button primary" data-action="decide" ${id} data-decision="approved" data-edited="true">${icon("check")} Approve edited action <span class="shortcut-hint" aria-hidden="true">Ctrl+Enter</span></button>` : `<button class="button secondary" data-action="decide" ${id} data-decision="rejected">Reject action</button><button class="button secondary" data-action="edit-approval" ${id}>${icon("edit")} Edit</button><button class="button primary" data-action="decide" ${id} data-decision="approved">${icon("check")} Approve & continue <span class="shortcut-hint" aria-hidden="true">Ctrl+Enter</span></button>`}</div></article>`;
}
function approvalsView() {
  const done = data.approvals.filter((a) => a.status !== "pending");
  return `${heading("Approvals", pending().length ? `${plural(pending().length, "action")} waiting · nothing runs until you decide` : "Sends, posts, issues and imported tool calls stop here for your decision")}<div class="approval-grid">${pending().length ? pending().map(approvalCard).join("") : `<section class="panel">${empty("approvals", "You’re all clear", "Nothing is waiting for your approval.")}</section>`}</div>${
    done.length
      ? `<section class="panel">${section("Previous decisions", plural(done.length, "decision"))}<div class="list-header decision-header" aria-hidden="true"><span>Action</span><span>Target</span><span>Decision</span><span class="num">When</span></div>${done
          .slice(0, 10)
          .map(
            (a) =>
              `<div class="decision-row"><strong>${esc(a.title)}</strong><span class="subtle">${esc(a.target)}</span><span class="pill ${a.status === "approved" ? "completed" : "canceled"}">${a.status === "approved" ? (a.edited ? "Approved, edited" : "Approved") : "Rejected"}</span><time class="num">${relative(a.createdAt)}</time></div>`,
          )
          .join("")}</section>`
      : ""
  }`;
}
function themeChoices() {
  return `<div class="theme-choices" role="group" aria-label="Theme">${[
    ["dark", "Dark", "moon"],
    ["light", "Light", "sun"],
    ["system", "System", "monitor"],
  ]
    .map(
      ([v, name, ic]) =>
        `<button class="theme-choice ${data.settings.theme === v ? "selected" : ""}" aria-pressed="${data.settings.theme === v}" data-action="set-pref" data-key="theme" data-value="${v}">${icon(ic)}<span>${name}</span></button>`,
    )
    .join("")}</div>`;
}
function accentChoices() {
  const current = accentOf(data.settings);
  return `<div class="accent-choices">${accents.map((v) => `<button class="color-swatch ${current === v ? "selected" : ""}" data-color="${v}" aria-label="Accent ${v}" aria-pressed="${current === v}" data-action="set-pref" data-key="accent" data-value="${v}"></button>`).join("")}<label class="custom-color" title="Custom accent">${icon("plus")}<input type="color" data-pref="accent" value="${esc(current)}" aria-label="Custom accent color"></label><span class="subtle accent-code num">${esc(current)}</span></div>`;
}
const toggle = (key, title, desc) =>
  `<label class="toggle-row"><span><strong>${title}</strong><small>${desc}</small></span><input class="toggle" type="checkbox" data-pref="${key}" ${data.settings[key] ? "checked" : ""}></label>`;
const settingRow = (title, desc, body, cls = "") =>
  `<section class="setting-row ${cls}"><div class="setting-label"><h2>${title}</h2><p>${desc}</p></div><div class="setting-panel">${body}</div></section>`;
function settingsView() {
  const s = data.settings;
  return `${heading("Preferences", "Saved on this computer and applied as you change them.", `<button class="text-button" data-action="setup">${icon("refresh")} Revisit guided setup</button>`)}<div class="settings">${settingRow(
    "Appearance",
    "Theme, accent and type for this workspace.",
    `<span class="field-label">Theme</span>${themeChoices()}<span class="field-label spaced">Accent</span>${accentChoices()}<div class="two-columns spaced"><label class="field"><span>Density</span><select data-pref="density"><option value="comfortable" ${s.density === "comfortable" ? "selected" : ""}>Comfortable</option><option value="compact" ${s.density === "compact" ? "selected" : ""}>Compact</option></select></label><label class="field"><span>Typeface</span><select data-pref="font"><option value="sans" ${s.font !== "mono" ? "selected" : ""}>Public Sans</option><option value="mono" ${s.font === "mono" ? "selected" : ""}>Monospace</option></select></label></div>${[
      ["fontSize", "Text size", 12, 18],
      ["radius", "Corner radius", 0, 16],
    ]
      .map(
        ([key, title, min, max]) =>
          `<label class="range-field"><span>${title}<output class="num">${s[key]}px</output></span><input type="range" min="${min}" max="${max}" step="1" data-pref="${key}" value="${s[key]}"></label>`,
      )
      .join(
        "",
      )}${toggle("sidebarCompact", "Compact sidebar", "Show icons only and give the work more width.")}${toggle("reduceMotion", "Reduced motion", "Turn off transitions.")}`,
  )}${settingRow(
    "Workspace",
    "Names, the first screen, and how long a run may go on.",
    `<div class="two-columns"><label class="field"><span>Workspace name</span><input data-pref="workspaceName" maxlength="60" value="${esc(s.workspaceName)}"></label><label class="field"><span>Your name</span><input data-pref="ownerName" maxlength="60" value="${esc(s.ownerName)}" placeholder="First name"></label></div><div class="two-columns spaced"><label class="field"><span>Open on</span><select data-pref="defaultView">${["home", "tasks", "team", "connections", "extensions", "schedules"].map((v) => `<option value="${v}" ${s.defaultView === v ? "selected" : ""}>${pages[v]}</option>`).join("")}</select></label><label class="field"><span>Maximum steps per run</span><input type="number" min="1" max="30" data-pref="maxSteps" value="${s.maxSteps}"></label></div>${toggle("showStarters", "Suggested tasks", "Show three starting points under the task box.")}${toggle("showActivity", "Storage note", "Show where tasks and keys are stored.")}`,
  )}${visionSettings()}${settingRow(
    "Backup",
    "Appearance and workspace preferences only. Keys and accounts are never exported.",
    `<div class="button-row"><button class="button secondary" data-action="export-settings">${icon("download")} Export preferences</button><label class="button quiet file-label">${icon("upload")} Import preferences<input type="file" accept="application/json,.json" id="import-settings"></label></div>`,
  )}${settingRow(
    "This computer",
    "Where Benchhand runs and the shortcuts it listens for.",
    `<dl class="facts"><div><dt>System</dt><dd>${esc(data.device.os)} · ${esc(data.device.arch)}</dd></div><div><dt>CPU threads</dt><dd class="num">${esc(data.device.threads)}</dd></div><div><dt>Storage</dt><dd>Local SQLite</dd></div><div><dt>Jump to anything</dt><dd><kbd>Ctrl K</kbd></dd></div><div><dt>New task</dt><dd><kbd>N</kbd></dd></div><div><dt>Close a panel</dt><dd><kbd>Esc</kbd></dd></div></dl>`,
  )}</div>`;
}
function setupView() {
  const names = ["Workspace", "Models", "Tools", "Theme"],
    models = data.connections.filter((c) => c.kind === "model");
  const content = [
    `<h1>Set up your workspace</h1><p class="setup-description">Benchhand runs a small team of AI bots on this computer. They take tasks and hand work to each other. Sending messages, creating issues and imported tool calls need approval. Cloud models and connected services receive the context sent to them.</p><label class="field"><span>Your name</span><input id="setup-owner" maxlength="60" placeholder="First name" value="${esc(data.settings.ownerName)}" autocomplete="given-name"></label><label class="field"><span>Workspace name</span><input id="setup-workspace" maxlength="60" value="${esc(data.settings.workspaceName)}"></label>`,
    `<h1>Choose where models run</h1><p class="setup-description">Use your signed-in Claude Code, Codex CLI or Gemini CLI, run a local model, or connect a cloud API. Each teammate can use a different one.</p><div class="setup-options"><button data-action="connect-cli" data-provider="claude">${icon("terminal")}<span><strong>Use a signed-in tool</strong><small>Claude Code, Codex CLI or Gemini CLI. Configure more in Models.</small></span>${icon("chevron")}</button><button data-action="connect-model" data-preset="ollama">${icon("terminal")}<span><strong>Keep it local</strong><small>Ollama, LM Studio, or another local server.</small></span>${icon("chevron")}</button><button data-action="connect-model" data-preset="openai">${icon("globe")}<span><strong>Use a cloud provider</strong><small>OpenAI, OpenRouter, Groq, or a compatible endpoint.</small></span>${icon("chevron")}</button></div>${models
      .map(
        (c) =>
          `<div class="setup-connected">${icon("check")}${esc(c.label)} · ${esc(c.account)}</div>`,
      )
      .join("")}`,
    `<h1>Connect your tools</h1><p class="setup-description">Teammates work inside the accounts you connect, with your token’s permissions. Anything that publishes or sends waits for you.</p><div class="setup-options">${catalog
      .filter((c) => c.kind !== "model")
      .map(
        (c) =>
          `<button data-action="connect-catalog" data-kind="${c.kind}">${icon(c.ic)}<span><strong>${c.name}</strong><small>${data.connections.some((x) => x.kind === c.kind) ? "Connected" : c.desc}</small></span>${icon(data.connections.some((x) => x.kind === c.kind) ? "check" : "plus")}</button>`,
      )
      .join("")}</div>`,
    `<h1>Pick a theme</h1><p class="setup-description">Both can be changed later in Preferences.</p><span class="field-label">Theme</span>${themeChoices()}<span class="field-label spaced">Accent</span>${accentChoices()}<div class="setup-ready">${icon("check")}<span><strong>Ready</strong><small>${plural(data.bots.length, "teammate")} · ${plural(data.connections.length, "connection")}</small></span></div>`,
  ][setupStep];
  return `<div class="setup-layout"><aside class="setup-side"><div class="brand">${brandMark()}<span>Benchhand</span></div><ol class="setup-steps">${names.map((n, i) => `<li class="${i === setupStep ? "current" : i < setupStep ? "complete" : ""}" ${i === setupStep ? 'aria-current="step"' : ""}><span>${n}</span>${i < setupStep ? icon("check") : ""}</li>`).join("")}</ol><dl class="setup-summary"><div><dt>Teammates</dt><dd>${data.bots.map((b) => esc(b.name)).join(", ") || "None yet"}</dd></div><div><dt>Models</dt><dd>${models.map((c) => esc(c.config.model)).join(", ") || "None yet"}</dd></div><div><dt>Stored</dt><dd>On this computer</dd></div></dl></aside><main class="setup-main"><div class="setup-top"><span class="subtle">Step ${setupStep + 1} of 4</span><button class="text-button" data-action="setup-skip">Explore first ${icon("arrow")}</button></div><div class="setup-content">${content}</div><footer class="setup-bottom">${setupStep ? '<button class="button quiet" data-action="setup-back">Back</button>' : "<span></span>"}<button class="button primary" data-action="setup-next">${setupStep === 3 ? "Open my workspace" : "Continue"}${icon("arrow")}</button></footer></main></div>`;
}
function render() {
  const firstTaskOptionsOpen = root.querySelector(".first-task-composer details")?.open;
  const transcript = root.querySelector(".activity-stream");
  const transcriptScroll = transcript?.scrollTop || 0;
  const follow = transcript && transcript.scrollHeight - transcript.clientHeight - transcriptScroll < 40;
  const expanded = [...root.querySelectorAll("[data-trace-id] details[open]")].map((el) => el.closest("[data-trace-id]").dataset.traceId);
  const focused = document.activeElement;
  const preserve =
    root.contains(focused) && focused.matches("input,textarea,select");
  const selector = preserve
    ? focused.id
      ? `#${CSS.escape(focused.id)}`
      : focused.dataset.pref
        ? `[data-pref="${focused.dataset.pref}"]`
        : ""
    : "";
  const value = preserve ? focused.value : null;
  const caret = preserve ? focused.selectionStart : null;
  const scroll = window.scrollY;
  applyTheme();
  root.innerHTML = setupOpen
    ? setupView()
    : `<div class="shell ${data.settings.sidebarCompact ? "compact-sidebar" : ""}">${sidebar()}<div class="main-area">${topbar()}<main class="page-content" id="main-content">${(
        {
          home: homeView,
          tasks: tasksView,
          team: teamView,
          connections: connectionsView,
          models: modelsView,
          folders: foldersView,
          extensions: marketplaceView,
          schedules: schedulesView,
          computer: computerView,
          approvals: approvalsView,
          settings: settingsView,
        }[page] || homeView
      )()}</main></div></div>`;
  if (!setupOpen && page === "settings")
    root
      .querySelector(".settings")
      .insertAdjacentHTML("beforeend", advancedSettings() + phoneSettings());
  colors(root);
  for (const id of expanded) root.querySelector(`[data-trace-id="${CSS.escape(id)}"] details`)?.setAttribute("open", "");
  if (firstTaskOptionsOpen) root.querySelector(".first-task-composer details")?.setAttribute("open", "");
  const nextTranscript = root.querySelector(".activity-stream");
  if (nextTranscript) nextTranscript.scrollTop = follow || !transcript ? nextTranscript.scrollHeight : transcriptScroll;
  if (selector) {
    const replacement = root.querySelector(selector);
    if (replacement) {
      replacement.value = value;
      replacement.focus({ preventScroll: true });
      if (caret !== null) replacement.setSelectionRange(caret, caret);
    }
  }
  window.scrollTo(0, scroll);
}
function visionSettings() {
  return `<section class="setting-row"><div class="setting-label"><h2>Vision</h2><p>A vision companion describes images from MCP tools for teammates on text-only models. Images go to the connection you choose.</p></div><div class="setting-panel"><label class="field"><span>Vision companion</span><select data-pref="visionProviderId"><option value="">None · use each model’s own capabilities</option>${data.connections
    .filter((c) => c.kind === "model" && c.config.vision)
    .map(
      (c) =>
        `<option value="${esc(c.id)}" ${data.settings.visionProviderId === c.id ? "selected" : ""}>${esc(c.label)} · ${esc(c.config.model)}</option>`,
    )
    .join(
      "",
    )}</select><small class="helper">Mark a connection as image capable in its model settings to list it here.</small></label></div></section>`;
}
async function refresh() {
  data = await invoke("bootstrap");
  if (selectedTask)
    events = await invoke("task_events", { taskId: selectedTask });
  const firstLoad = !started;
  if (firstLoad) {
    page = data.settings.defaultView || "home";
    setupOpen = false;
    setupStep = Math.min(
      3,
      Number(localStorage.getItem("teammate-setup-step")) || 0,
    );
    started = true;
  }
  render();
  if (firstLoad) featureNavigate(page).catch((e) => notify(e, true));
}
function navigate(next) {
  page = next;
  selectedTask = "";
  taskSearch = "";
  render();
  document.querySelector("#main-content")?.scrollTo(0, 0);
  if (next === "models") { if (!libraryLoaded) loadLibrary(); if (clientScan === "idle") scanModelClients(); }
  featureNavigate(next).catch((e) => notify(e, true));
}
const bytesLabel = (bytes) =>
  bytes >= 1e9
    ? `${(bytes / 1e9).toFixed(1)} GB`
    : `${Math.round(bytes / 1e6)} MB`;
function modelsView() {
  const count = data.connections.filter((c) => c.kind === "model").length;
  return `${heading("Models", "Choose how your teammates work.", `<button class="button primary" data-action="model-tab" data-tab="available">${icon("plus")} Add model</button>`)}<div class="model-tabs" role="group" aria-label="Model views">${[["connected", `Connected <span class="model-tab-count">${count}</span>`], ["available", "Available"], ["local", "Local models"]].map(([id,label]) => `<button class="model-tab ${modelTab === id ? "active" : ""}" aria-pressed="${modelTab === id}" data-action="model-tab" data-tab="${id}">${label}</button>`).join("")}</div>${modelTab === "connected" ? modelHub() : modelTab === "available" ? availableModels() : modelLibrary()}`;
}
function modelLibrary() {
  const downloads = data.downloads || [];
  return `<div class="library-heading"><h2>Local model library</h2><button class="text-button" data-action="external" data-url="https://ollama.com/download">Get Ollama ${icon("external")}</button></div>
  <div class="grid one-one"><section class="panel library-runtime">${section("Ollama runtime")}<p class="subtle">Benchhand reads and downloads models through the Ollama server below.</p><div class="runtime-address"><label class="field"><span>Server URL</span><input id="model-host" type="url" value="${esc(modelHost)}" aria-label="Ollama server URL"></label>${button("load-library", "Refresh library", "refresh", "", "button secondary")}</div></section>
  <section class="panel download-panel">${section("Download a model", "", `<button class="text-button" data-action="external" data-url="https://ollama.com/library">Ollama library ${icon("external")}</button>`)}<p class="subtle">Any tag Ollama supports, including Hugging Face GGUF tags. Check the licence and memory needs first.</p><form id="download-form"><input name="model" aria-label="Model to download" placeholder="qwen3:8b or hf.co/owner/model:Q4_K_M" required maxlength="200">${button("", "Download model", "download", 'type="submit"', "button secondary")}</form></section></div>
  ${downloads.length ? `<section class="panel">${section("Downloads")}<div class="download-list">${downloads.map((d) => `<article class="download-row"><div><strong>${esc(d.model)}</strong><small>${esc(d.status)}${d.total ? ` · <span class="num">${bytesLabel(Number(d.completed))} of ${bytesLabel(Number(d.total))}</span>` : ""}</small>${d.total ? `<progress max="${Number(d.total)}" value="${Number(d.completed)}" aria-label="Download progress"></progress>` : ""}</div>${d.state === "downloading" ? button("cancel-download", "Cancel", "close", `data-id="${esc(d.id)}"`, "button quiet small") : d.state === "completed" ? button("connect-installed", "Use model", "plus", `data-model="${esc(d.model)}"`, "button secondary small") : `<span class="pill canceled">${esc(d.state === "canceled" ? "Canceled" : d.state)}</span>`}</article>`).join("")}</div></section>` : ""}
  <section class="panel">${section("Installed", libraryLoaded ? plural(installedModels.length, "model") : "")}${libraryError ? `<div class="callout error">${icon("info")}<span>${esc(libraryError)}</span></div>` : ""}${installedModels.length ? `<div class="list-header model-header" aria-hidden="true"><span>Model</span><span>Parameters</span><span>Quantization</span><span class="num">On disk</span><span></span></div><div class="catalog-list">${installedModels.map((m) => `<article class="catalog-card model-row"><h3>${esc(m.name)}</h3><span class="subtle">${esc(m.details?.parameter_size || "—")}</span><span class="subtle">${esc(m.details?.quantization_level || m.details?.format || "—")}</span><span class="num">${bytesLabel(Number(m.size || 0))}</span><button class="button secondary small" data-action="connect-installed" data-model="${esc(m.name)}">Use this model</button></article>`).join("")}</div>` : empty("model", libraryLoaded ? "No models installed" : "Looking for Ollama…", "Start Ollama, refresh the library, then download a model by its tag.")}</section>`;
}
async function loadLibrary() {
  modelHost = document.querySelector("#model-host")?.value.trim() || modelHost;
  try {
    const r = await invoke("local_models", { baseUrl: modelHost });
    installedModels = r.models;
    libraryError = "";
  } catch (e) {
    installedModels = [];
    libraryError = String(e);
  }
  libraryLoaded = true;
  if (page === "models") render();
}
function browserSetup() {
  openSheet(
    `${dialogHeading("Connect a browser server", "Teammates drive a real browser through the open source Playwright MCP server.")}<div class="sheet-body"><ol class="setup-guide"><li><h3>Start the server</h3><p>With Node.js installed, run this command in a terminal. It opens a separate browser profile when used.</p><pre>npx @playwright/mcp@latest --port 8931</pre><button class="text-button" data-action="copy-browser-command">${icon("copy")} Copy command</button></li><li><h3>Connect it</h3><p>Keep the server running, then verify the endpoint below. Browser actions wait for your approval.</p><code>http://localhost:8931/mcp</code></li><li><h3>Give a teammate a task</h3><p>Use native tool calling or Structured actions. Accessibility snapshots let text models understand page controls.</p></li></ol><button class="text-button" data-action="external" data-url="https://github.com/microsoft/playwright-mcp">Read the server documentation ${icon("external")}</button></div><div class="sheet-footer"><button class="button quiet" data-action="close-sheet">Later</button><button class="button primary" data-action="connect-playwright">${icon("connections")} Connect browser server</button></div>`,
  );
}
function openSheet(html, wide = false) {
  sheet.className = wide ? "wide-sheet" : "";
  sheet.innerHTML = html;
  if (!sheet.open) sheet.showModal();
  colors(sheet);
  const firstInput = sheet.querySelector(
    "input:not([type=hidden]):not([type=color]),textarea",
  );
  (firstInput || sheet.querySelector("button"))?.focus();
}
function closeSheet() {
  sheet.close();
  sheet.innerHTML = "";
  editingConnection = null;
  editingBot = null;
  explorer = null;
}
const dialogHeading = (title, desc = "") =>
  `<div class="sheet-heading"><div><h2 id="dialog-title">${title}</h2>${desc ? `<p>${desc}</p>` : ""}</div><button class="icon-button" type="button" data-action="close-sheet" aria-label="Close panel">${icon("close")}</button></div>`;
function formError(e) {
  const target = sheet.querySelector(".form-error");
  if (target) {
    target.textContent = String(e).replace(/^Error: /, "");
    target.hidden = false;
  } else notify(e, true);
}
function busy(el, on, label = "Working…") {
  if (!el) return;
  if (on) {
    el.dataset.original = el.innerHTML;
    el.disabled = true;
    el.innerHTML = `<span class="loader small"></span>${label}`;
  } else {
    el.disabled = false;
    if (el.dataset.original) el.innerHTML = el.dataset.original;
  }
}
function connectionForm(kind = "model", preset = "", connection = null) {
  if (kind === "model" && (clientNames[preset] || connection?.config.protocol === "cli")) {
    return cliConnectionForm(clientNames[preset] ? preset : connection.config.cli, connection);
  }
  editingConnection = connection;
  const c = connection?.config || {},
    p = providers[preset] || providers[kind === "model" ? "ollama" : "custom"];
  let help = "";
  if (kind === "github")
    help = `<strong>A fine-grained personal access token.</strong><p>Grant repository metadata and issues read access. Add issues write access to create issues after approval.</p><button type="button" class="text-button" data-action="external" data-url="https://github.com/settings/personal-access-tokens/new">Create a GitHub token ${icon("external")}</button>`;
  else if (kind === "slack")
    help = `<strong>A Slack bot or user token.</strong><p>Recommended scopes: channels:read, groups:read, channels:history, groups:history, and chat:write for approved messages. Invite your app to the channels it should read.</p><button type="button" class="text-button" data-action="external" data-url="https://api.slack.com/apps">Open Slack apps ${icon("external")}</button>`;
  else if (kind === "mcp")
    help =
      "<strong>A Streamable HTTP MCP server.</strong><p>Connecting discovers its tools. Each imported tool call waits for your approval.</p>";
  else
    help =
      "<p>Start your local runtime first. Ollama uses port 11434; LM Studio commonly uses 1234. Local connections usually need no API key.</p>";
  openSheet(
    `${dialogHeading(connection ? `Manage ${esc(connection.label)}` : kind === "model" ? "Connect a model" : `Connect ${kind === "mcp" ? "an MCP server" : kind === "github" ? "GitHub" : "Slack"}`)}<form id="connection-form" data-kind="${kind}"><div class="sheet-body"><div class="connection-help">${help}</div><label class="field"><span>Connection name</span><input name="label" maxlength="80" value="${esc(connection?.label || (kind === "model" ? p.label : kind === "mcp" ? "My MCP server" : kind === "github" ? "GitHub" : "Slack"))}" required></label>${
      kind === "model"
        ? `<label class="field"><span>Provider preset</span><select id="provider-preset">${Object.entries(
            providers,
          )
            .map(
              ([id, pv]) =>
                `<option value="${id}" ${id === (preset || "ollama") ? "selected" : ""}>${pv.label}</option>`,
            )
            .join("")}</select></label>`
        : ""
    }${["model", "mcp"].includes(kind) ? `<label class="field"><span>${kind === "model" ? "API base URL" : "Streamable HTTP endpoint"}</span><input name="baseUrl" type="url" value="${esc(c.baseUrl || (kind === "model" ? p.url : ""))}" placeholder="${kind === "model" ? "http://127.0.0.1:11434/v1" : "https://your-server.example/mcp"}" required></label>` : ""}<label class="field"><span>${kind === "github" ? "Personal access token" : kind === "slack" ? "Slack token" : "API key / bearer token"} ${["model", "mcp"].includes(kind) ? "<small>Optional</small>" : ""}</span><input name="secret" type="password" autocomplete="new-password" placeholder="${connection?.config.hasSecret ? "Saved securely · leave blank to keep" : "Stored in your OS credential store"}" ${["github", "slack"].includes(kind) && !connection ? "required" : ""}></label>${kind === "model" ? `<div class="two-columns"><label class="field"><span>Protocol</span><select name="protocol"><option value="chat" ${(c.protocol || p.protocol) === "chat" ? "selected" : ""}>Chat Completions</option><option value="responses" ${(c.protocol || p.protocol) === "responses" ? "selected" : ""}>Responses API</option></select></label><label class="field"><span>Tool calling</span><select name="toolMode"><option value="native" ${!c.toolMode || c.toolMode === "native" ? "selected" : ""}>Native tools</option><option value="structured" ${c.toolMode === "structured" ? "selected" : ""}>Structured actions</option><option value="off" ${c.toolMode === "off" ? "selected" : ""}>Text only · tools off</option></select></label></div><div class="field"><label for="model-id">Model</label><div class="input-action"><input name="model" id="model-id" list="model-options" value="${esc(c.model || "")}" placeholder="Discover models, then select one" required><button type="button" class="button secondary" data-action="discover-models">${icon("refresh")} Discover</button></div><datalist id="model-options"></datalist><span class="helper" id="discovery-result">Use Structured actions for local models that need a JSON action adapter.</span></div>` : `<label class="toggle-row"><span><strong>Available to teammates</strong><small>Expose this connection’s tools during task runs.</small></span><input class="toggle" type="checkbox" name="enabledForAgents" ${c.enabledForAgents !== false ? "checked" : ""}></label>`}<div class="form-error" role="alert" hidden></div><p class="secure-note">${icon("key")} Secrets stay in your OS credential store and are never included in task prompts.</p>${connection ? `<button type="button" class="text-button danger" data-action="confirm-disconnect">${icon("trash")} Disconnect</button><div class="disconnect-confirm" hidden><p>Disconnect this service and remove its saved secret? Active tasks will pause.</p><button type="button" class="button danger" data-action="disconnect" data-id="${esc(connection.id)}">Disconnect service</button></div>` : ""}</div><div class="sheet-footer"><button type="button" class="button quiet" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">${icon("connections")} Verify & ${connection ? "save" : "connect"}</button></div></form>`,
  );
  if (kind === "model")
    sheet
      .querySelector(".form-error")
      .insertAdjacentHTML(
        "beforebegin",
        `<label class="toggle-row"><span><strong>This model accepts images</strong><small>Enable for a vision capable model. Tool images can then be included in its context.</small></span><input type="checkbox" class="toggle" name="vision" ${c.vision ? "checked" : ""}></label><label class="toggle-row"><span><strong>Request reasoning summaries</strong><small>For reasoning models using the Responses API. Your provider must support summary requests.</small></span><input type="checkbox" class="toggle" name="reasoningSummary" ${c.reasoningSummary ? "checked" : ""}></label>`,
      );
}
function connectionInput() {
  const f = sheet.querySelector("#connection-form"),
    v = new FormData(f);
  return {
    id: editingConnection?.id || "",
    kind: f.dataset.kind,
    label: v.get("label"),
    secret: v.get("secret") || "",
    config: {
      baseUrl: v.get("baseUrl") || "",
      model: v.get("model") === "__custom" ? v.get("customModel") : v.get("model") || "",
      reasoningEffort: v.get("reasoningEffort") || "default",
      protocol: v.get("protocol") || "chat",
      toolMode: v.get("toolMode") || "native",
      vision: v.get("vision") === "on",
      reasoningSummary: v.get("reasoningSummary") === "on",
      ...(v.get("cli") ? { cli: v.get("cli"), executable: v.get("executable") || "", protocol: "cli", toolMode: "structured", vision: false } : {}),
      enabledForAgents: v.get("enabledForAgents") === "on",
    },
  };
}
let cliCatalog = [], cliCatalogRequest = 0;
const cliPresets = {
  codex: ["gpt-6.1-sol","gpt-6-sol","gpt-6-astra","gpt-6-luna","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"].map(id => ({id,name:id.replace("gpt-","GPT-").replaceAll("-"," "),efforts:["low","medium","high","xhigh","max"]})),
  claude: [{id:"sonnet",name:"Sonnet"},{id:"opus",name:"Opus"},{id:"haiku",name:"Haiku"}],
  gemini: ["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"].map(id=>({id,name:id})),
  copilot: ["gpt-5.3-codex","gpt-5.6-luna","claude-haiku-4.5"].map(id=>({id,name:id})),
  qwen: ["qwen3-coder-plus","qwen3-coder-flash"].map(id=>({id,name:id})),
  opencode: [],
};
function cliModelOptions(provider, selected = "default", models = []) {
  const reported = new Set(models.map(m => m.id));
  cliCatalog = [...models, ...(cliPresets[provider] || []).filter(m => !reported.has(m.id))];
  const known = selected === "default" || cliCatalog.some(m => m.id === selected);
  const options = rows => rows.map(m => `<option value="${esc(m.id)}" ${m.id === selected ? "selected" : ""}>${esc(m.name || m.id)}</option>`).join("");
  const target = sheet.querySelector("#cli-model-fields");
  target.innerHTML = `<label class="field"><span>Model</span><select name="model" id="cli-model"><option value="default" ${selected === "default" ? "selected" : ""}>Client default</option>${models.length ? `<optgroup label="Reported by your installed client">${options(models)}</optgroup>` : ""}<optgroup label="${["claude"].includes(provider) ? "Client model aliases" : "Known model IDs · account access required"}">${options(cliCatalog.filter(m => !reported.has(m.id)))}</optgroup><option value="__custom" ${!known ? "selected" : ""}>Custom model ID…</option></select></label><label class="field" id="cli-custom-model" ${known ? "hidden" : ""}><span>Custom model ID</span><input name="customModel" maxlength="200" value="${esc(!known ? selected : "")}" ${known ? "" : "required"}></label><label class="field" id="cli-effort-field" ${["gemini","qwen"].includes(provider) ? "hidden" : ""}><span>Reasoning effort</span><select name="reasoningEffort" id="cli-effort" aria-label="Reasoning effort"></select><small class="helper">Higher effort can take longer and use more of your plan.</small></label><p class="helper" id="cli-catalog-status" role="status">${["codex","opencode"].includes(provider) ? "Loading models from your installed CLI…" : "Known choices are not an account model list. Your CLI resolves model IDs; access depends on its version and your account. Use Custom model ID for any other supported model."}</p>`;
  updateCliEfforts();
}
function updateCliEfforts(preferred = "default") {
  const provider = sheet.querySelector("#cli-provider").value;
  const value = sheet.querySelector("#cli-model").value;
  const model = cliCatalog.find(m => m.id === value);
  const efforts = ["gemini","qwen"].includes(provider) ? [] : model?.efforts || (provider === "claude" ? ["low","medium","high","max"] : ["low","medium","high","xhigh","max"]);
  const choices = efforts.map(e => typeof e === "string" ? e : e.reasoningEffort);
  sheet.querySelector("#cli-effort").innerHTML = `<option value="default">Model default</option>${choices.map(e => `<option value="${esc(e)}">${esc(e[0].toUpperCase()+e.slice(1))}</option>`).join("")}`;
  sheet.querySelector("#cli-effort").value = choices.includes(preferred) ? preferred : "default";
  const custom = sheet.querySelector("#cli-custom-model");
  custom.hidden = value !== "__custom";
  custom.querySelector("input").required = value === "__custom";
}
async function loadCliCatalog(selected = "default", effort = "default") {
  const request = ++cliCatalogRequest;
  const form = sheet.querySelector("#connection-form");
  const provider = form.querySelector("#cli-provider").value;
  cliModelOptions(provider, selected);
  updateCliEfforts(effort);
  if (!["codex","opencode"].includes(provider)) return;
  try {
    const result = await invoke("list_cli_models", {config:{cli:provider,executable:form.querySelector("[name=executable]").value}});
    if (request !== cliCatalogRequest || sheet.querySelector("#connection-form") !== form || form.querySelector("#cli-provider").value !== provider) return;
    if (!Array.isArray(result?.models)) throw new Error("Install the latest desktop build to discover models.");
    const current = form.querySelector("#cli-model").value;
    const saved = current === "__custom" ? form.querySelector("[name=customModel]").value : current;
    const savedEffort = form.querySelector("#cli-effort").value;
    cliModelOptions(provider, saved, result.models);
    updateCliEfforts(savedEffort);
    form.querySelector("#cli-catalog-status").textContent = `${result.models.length} models reported by your CLI. Other model IDs require account access; connecting checks installation, and the first task checks model access.`;
  } catch(e) {
    if (request === cliCatalogRequest && sheet.querySelector("#connection-form") === form) form.querySelector("#cli-catalog-status").textContent = `Model discovery unavailable: ${String(e)} You can choose a listed ID or enter your own.`;
  }
}
function cliConnectionForm(provider = "claude", connection = null) {
  editingConnection = connection;
  const c = connection?.config || {}, name = clientNames[c.cli || provider] || clientNames.claude;
  openSheet(`${dialogHeading(connection ? `Manage ${esc(connection.label)}` : `Connect ${name}`, "Choose a model using your existing sign-in.")}<form id="connection-form" data-kind="model"><div class="sheet-body"><input type="hidden" name="protocol" value="cli"><label class="field"><span>Installed tool</span><select name="cli" id="cli-provider">${Object.entries(clientNames).map(([id, title]) => `<option value="${id}" ${id === (c.cli || provider) ? "selected" : ""}>${title}</option>`).join("")}</select></label><div id="cli-model-fields"></div><button type="button" class="text-button" data-action="open-cli-docs" data-provider="${c.cli || provider}">Installation and sign-in instructions ${icon("external")}</button><p class="helper">Optional clients are installed separately. OpenCode, Copilot and Qwen adapters are experimental. Each client may keep its own local session logs and configuration.</p><details class="cli-advanced"><summary>Model and connection settings</summary><label class="field"><span>Connection name</span><input name="label" required maxlength="80" value="${esc(connection?.label || name)}"></label><label class="field"><span>Executable location</span><input name="executable" value="${esc(c.executable || "")}" placeholder="Automatic · find on PATH"><small class="helper">Optional native executable or installed JavaScript entry. Windows command shims are not supported.</small></label><button type="button" class="button secondary small" data-action="refresh-cli-models">Refresh models</button></details><details class="cli-advanced"><summary>How this connection works</summary><p class="helper">No API key needed. Sign in with the official CLI first. Benchhand keeps authentication with it and sends text context through its command interface. Tool requests use Benchhand’s approval flow. A vision companion can describe screenshots.</p></details><div class="form-error" role="alert" hidden></div>${connection ? `<button type="button" class="text-button danger" data-action="confirm-disconnect">Disconnect</button><div class="disconnect-confirm" hidden><p>Remove this model connection?</p><button type="button" class="button danger" data-action="disconnect" data-id="${esc(connection.id)}">Disconnect service</button></div>` : ""}</div><div class="sheet-footer"><button type="button" class="button quiet" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">Check installation & connect</button></div></form>`);
  loadCliCatalog(c.model || "default", c.reasoningEffort || "default");
}
async function scanModelClients() {
  if (clientScan === "scanning") return;
  clientScan = "scanning"; clientError = ""; render();
  try { const result = await invoke("detect_model_clients"); if (!Array.isArray(result)) throw new Error("Client detection requires the latest desktop build."); modelClients = result; clientScan = "done"; }
  catch (e) { clientScan = "error"; clientError = String(e); }
  render();
}
function modelConnectionType(c) {
  if (c.config.protocol === "cli") return "Signed-in CLI";
  try {
    const host = new URL(c.config.baseUrl).hostname;
    if (host === "localhost" || host === "[::1]" || /^127\./.test(host)) return "Local server";
  } catch {}
  return "API connection";
}
function modelHub() {
  const connections = data.connections.filter((c) => c.kind === "model");
  return `<div class="model-overview"><section class="panel connected-models">${section("Ready to use", "Saved model connections for your teammates.")}${connections.length ? `<div class="model-connections">${connections.map((c) => `<article class="model-connection"><span class="model-symbol">${icon(modelConnectionType(c) === "Signed-in CLI" ? "terminal" : modelConnectionType(c) === "Local server" ? "model" : "globe")}</span><div><strong>${esc(c.label)}</strong><small>${esc(c.config.model)}${c.config.reasoningEffort && c.config.reasoningEffort !== "default" ? ` · ${esc(c.config.reasoningEffort)} effort` : ""} · ${modelConnectionType(c)}</small></div><span class="subtle model-assigned">${plural(data.bots.filter((b) => b.providerId === c.id).length, "teammate")}</span><button class="button secondary small" data-action="edit-connection" data-id="${esc(c.id)}">Manage</button></article>`).join("")}</div>` : `<div class="model-empty"><p>No models connected yet. Choose a signed-in tool, local server, or cloud API to get started.</p><button class="button secondary" data-action="model-tab" data-tab="available">${icon("plus")} Add a model</button></div>`}${connections.length ? `<div class="model-next"><strong>Bring another model</strong><p>Connect a signed-in tool, local server, or cloud provider.</p><button class="text-button" data-action="model-tab" data-tab="available">Explore available models ${icon("arrow")}</button></div>` : ""}<p class="model-footnote">${icon("info")} Usage and availability depend on the selected provider.</p></section><aside class="panel model-assignments">${section("For your teammates", "Choose the default model for each teammate.")}${data.bots.length ? data.bots.map((b) => `<div class="model-assignment">${avatar(b)}<span><strong>${esc(b.name)}</strong><small>${esc(modelName(b))}</small></span><button class="button secondary small" data-action="edit-bot" data-id="${esc(b.id)}" aria-label="Change model for ${esc(b.name)}">Change</button></div>`).join("") : `<p class="panel-empty">Create a teammate to assign a model.</p>`}<p class="model-footnote">${icon("approvals")} API keys saved in Benchhand use your operating system’s credential store.</p></aside></div>`;
}
function availableModels() {
  return `<div class="available-models"><section class="panel model-clients">${section("Use your signed-in tools", "Installed separately · use your existing sign-in", button("scan-model-clients", clientScan === "scanning" ? "Scanning…" : "Scan this computer", "refresh", clientScan === "scanning" ? "disabled" : "", "button secondary small"))}<p class="model-intro">Choose a tool you already use. Requests use its provider account.</p><div class="client-list">${Object.entries(clientNames).map(([id, name]) => { const found = modelClients.find((c) => c.provider === id); return `<article class="client-row"><span class="client-name">${icon("terminal")}<span><strong>${name}</strong><small>${found?.installed ? esc(found.version) : clientScan === "scanning" ? "Checking installation…" : found ? "Not found automatically · install or set a path" : "Sign in with its CLI, then connect"}</small></span></span><span class="client-status ${found?.installed ? "available" : ""}">${found?.installed ? "Installed" : ""}</span><span class="client-actions"><button class="text-button small" data-action="open-cli-docs" data-provider="${id}">Setup<span class="visually-hidden"> ${name}</span></button><button class="button secondary small" data-action="connect-cli" data-provider="${id}">Connect<span class="visually-hidden"> ${name}</span></button></span></article>`; }).join("")}</div>${clientError ? `<p class="model-intro" role="alert">${esc(clientError)}</p>` : ""}</section><section class="panel model-other">${section("Connect another provider", "Use a local server or an API key.")}<div class="model-shortcuts"><button class="button secondary" data-action="connect-model" data-preset="ollama">${icon("model")} Connect local server</button><button class="button secondary" data-action="connect-model" data-preset="openai">${icon("globe")} Connect cloud API</button></div></section></div>`;
}
function activityEvent(event) {
  try { const parsed = JSON.parse(event.message); if (parsed && typeof parsed.kind === "string") return { ...event, ...parsed }; } catch {}
  return { ...event, kind: "status", title: event.message, detail: "" };
}
function activityPanel(t) {
  const decoded = events.map(activityEvent), groups = [];
  for (const event of decoded) {
    const previous = groups.at(-1);
    if (["model_output", "reasoning_summary"].includes(event.kind) && previous?.kind === event.kind) previous.detail += event.detail;
    else groups.push({ ...event });
  }
  const filtered = groups.filter((e) => activityFilter === "all" || (activityFilter === "tools" ? e.kind.startsWith("tool_") : ["model_output", "reasoning_summary", "request", "usage", "timing"].includes(e.kind)));
  return `<section class="panel activity-transcript">${section("Live activity", t.status === "running" ? "Updating as the model works" : plural(events.length, "event"), button("export-activity", "Export transcript", "download", "", "button quiet small"))}<div class="activity-toolbar"><div class="tabs" role="tablist" aria-label="Activity filter">${[["all", "Everything"], ["model", "Model"], ["tools", "Tools"]].map(([id, label]) => `<button role="tab" aria-selected="${activityFilter === id}" class="tab ${activityFilter === id ? "active" : ""}" data-action="activity-filter" data-filter="${id}">${label}</button>`).join("")}</div><span class="subtle">${esc(modelName(data.bots.find((b) => b.id === t.botId)))}</span></div><details class="transparency-note"><summary>What this transcript shows</summary><p>Provider reasoning appears when supplied. Private internal thinking is not available. Model output is unverified until a tool confirms it.</p></details><ol class="activity-stream">${filtered.length ? filtered.map((e) => `<li data-trace-id="${esc(e.id || e.createdAt + e.kind)}" class="trace-event trace-${esc(e.kind)}"><time class="num">${clock(e.createdAt)}</time><div><strong>${e.kind === "tool_proposal" ? "Proposed: " : e.kind === "tool_input" ? "Ran: " : e.kind === "tool_result" ? "Result: " : ""}${esc(e.title)}</strong>${e.detail ? ((e.kind.startsWith("tool_") && e.kind !== "tool_decision") || e.kind === "usage" ? `<details><summary>${e.kind === "tool_proposal" ? "Inspect proposed inputs" : e.kind === "tool_input" ? "Inspect inputs used" : e.kind === "tool_result" ? "Inspect result" : "Inspect token usage"}</summary><pre>${esc(e.detail)}</pre></details>` : `<p class="trace-content">${esc(e.detail)}</p>`) : ""}</div></li>`).join("") : `<li class="trace-empty">${activityFilter === "tools" ? "Tool proposals, decisions and results will appear here as work progresses." : "Activity will appear here when you run this task."}</li>`}</ol></section>`;
}
function botForm(id = "") {
  const b = data.bots.find((b) => b.id === id);
  editingBot = b;
  openSheet(
    `${dialogHeading(b ? `Edit ${esc(b.name)}` : "New teammate", "A name, a role, instructions, and the model it runs on.")}<form id="bot-form"><div class="sheet-body"><div class="bot-profile-preview">${avatar(b || { name: "New", color: data.settings.accent })}<span>${b ? esc(b.role || "Teammate") : "Its initial and colour mark its work across the app."}</span></div><div class="two-columns"><label class="field"><span>Name</span><input name="name" maxlength="60" value="${esc(b?.name || "")}" placeholder="Nova" required></label><label class="field"><span>Color</span><input type="color" name="color" value="${esc(b?.color || data.settings.accent)}" aria-label="Teammate color"></label></div><label class="field"><span>Role</span><input name="role" maxlength="100" value="${esc(b?.role || "")}" placeholder="Writing partner"></label><label class="field"><span>Short description</span><textarea name="description" rows="2" maxlength="300" placeholder="What this teammate is best at">${esc(b?.description || "")}</textarea></label><label class="field"><span>Model connection</span><select name="providerId"><option value="">Choose a model connection</option>${data.connections
      .filter((c) => c.kind === "model")
      .map(
        (c) =>
          `<option value="${esc(c.id)}" ${b?.providerId === c.id ? "selected" : ""}>${esc(c.label)} · ${esc(c.config.model)}</option>`,
      )
      .join(
        "",
      )}</select><small class="helper">Connect a CLI, local model or cloud API in Models, then assign it here.</small></label><label class="field"><span>Instructions</span><textarea name="instructions" rows="7" maxlength="12000" placeholder="Its expertise, how it should work, and what a good result looks like">${esc(b?.instructions || "")}</textarea></label><div class="form-error" role="alert" hidden></div>${b ? `<button type="button" class="text-button danger" data-action="delete-bot" data-id="${esc(b.id)}">${icon("trash")} Remove teammate</button>` : ""}</div><div class="sheet-footer"><button type="button" class="button quiet" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">${icon("check")} Save teammate</button></div></form>`,
  );
}
function newTask(title = "", description = "", botId = "") {
  openSheet(
    `${dialogHeading("New task", "A clear goal and the context behind it give the best result.")}<form id="task-form"><div class="sheet-body"><label class="field"><span>Task</span><input name="title" maxlength="160" placeholder="Summarise this week’s open issues" value="${esc(title)}" required></label><label class="field"><span>Context and expected result</span><textarea name="description" rows="7" maxlength="16000" placeholder="Background, links, and what a good result looks like">${esc(description)}</textarea></label><label class="field"><span>Teammate</span><select name="botId">${data.bots.map((b) => `<option value="${esc(b.id)}" ${b.id === botId ? "selected" : ""}>${esc(b.name)} · ${esc(b.role)}</option>`).join("")}</select></label><div class="form-error" role="alert" hidden></div><div class="secure-note">${icon("approvals")} Teammates ask before publishing, sending, or using imported tools.</div></div><div class="sheet-footer"><button class="button secondary" type="submit" value="draft">Save draft</button><button class="button primary" type="submit" value="run">${icon("play")} Create & run</button></div></form>`,
  );
}
function download(name, text, type = "application/json") {
  const a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function preference(key, value) {
  const previous = { ...data.settings };
  data.settings[key] = value;
  applyTheme();
  try {
    data.settings = await invoke("save_settings", { settings: data.settings });
    render();
  } catch (e) {
    data.settings = previous;
    applyTheme();
    notify(e, true);
  }
}
function commandPalette() {
  openSheet(
    `${dialogHeading("Jump to")}<div class="command-search">${icon("search")}<input id="command-input" placeholder="Pages, teammates and tasks" aria-label="Command search" autocomplete="off"></div><div id="command-results"></div><div class="command-footer"><kbd>Enter</kbd> to open <kbd>Esc</kbd> to close</div>`,
    true,
  );
  commandResults("");
  sheet.querySelector("#command-input").focus();
}
function commandResults(q) {
  const list = [
    ...Object.entries(pages).map(([id, name]) => ({
      name,
      sub: "Page",
      ic: id,
      action: "navigate",
      attrs: `data-page="${id}"`,
    })),
    ...data.bots.map((b) => ({
      name: b.name,
      sub: b.role,
      ic: "team",
      action: "edit-bot",
      attrs: `data-id="${esc(b.id)}"`,
    })),
    ...data.tasks.slice(0, 20).map((t) => ({
      name: t.title,
      sub: t.botName,
      ic: "tasks",
      action: "task-detail",
      attrs: `data-id="${esc(t.id)}"`,
    })),
  ]
    .filter((e) => `${e.name} ${e.sub}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 10);
  sheet.querySelector("#command-results").innerHTML = list.length
    ? list
        .map(
          (e) =>
            `<button class="command-option" data-action="${e.action}" ${e.attrs}>${icon(e.ic)}<span><strong>${esc(e.name)}</strong><small>${esc(e.sub)}</small></span>${icon("arrow")}</button>`,
        )
        .join("")
    : empty("search", "No matches", "Try a task name, teammate, or page.");
}
async function explore(id, action = "", args = {}) {
  const c = data.connections.find((c) => c.id === id);
  if (!c) return;
  const method =
    action ||
    (c.kind === "github"
      ? "repositories"
      : c.kind === "slack"
        ? "channels"
        : "tools");
  explorer = { id, method, args };
  openSheet(
    `${dialogHeading(esc(c.label), esc(c.account))}<div class="sheet-body explorer-body"><div class="loading-state"><span class="loader"></span>Loading from ${esc(c.label)}…</div></div>`,
    true,
  );
  try {
    const r = await invoke("browse_connection", {
      connectionId: id,
      action: method,
      arguments: args,
    });
    if (!explorer || explorer.id !== id) return;
    const list = Array.isArray(r) ? r : r.tools || [];
    sheet.querySelector(".explorer-body").innerHTML =
      `${["issues", "history"].includes(method) ? `<button class="text-button back-button" data-action="browse" data-id="${esc(id)}">${icon("back")} Back to list</button>` : ""}<div class="explorer-toolbar"><span>${list.length} ${method === "history" ? "recent messages" : method}</span><button class="button small secondary" data-action="explorer-task">${icon("plus")} Use in a task</button></div>${list.length ? list.map((item) => (method === "repositories" ? `<button class="resource-card" data-action="repo-issues" data-id="${esc(id)}" data-repository="${esc(item.fullName)}">${icon("github")}<span><strong>${esc(item.fullName)}</strong><p>${esc(item.description || "No description.")}</p><small>${esc(item.language || "Repository")} · ${item.openIssues} open issues${item.private ? " · Private" : ""}</small></span>${icon("chevron")}</button>` : method === "channels" ? `<button class="resource-card" data-action="channel-history" data-id="${esc(id)}" data-channel="${esc(item.id)}"><span class="channel-hash">#</span><span><strong>${esc(item.name)}</strong><p>${esc(item.topic || "No topic set.")}</p></span>${icon("chevron")}</button>` : method === "issues" ? `<article class="resource-card"><span class="issue-number">#${item.number}</span><span><strong>${esc(item.title)}</strong><p>${esc((item.body || "").slice(0, 500))}</p><button class="text-button" data-action="external" data-url="${esc(item.url)}">Open issue ${icon("external")}</button></span></article>` : method === "history" ? `<article class="message-card"><small>${esc(item.user || "Slack")} · ${new Date(Number(item.ts) * 1000).toLocaleString()}</small><p>${esc(item.text)}</p></article>` : `<article class="resource-card">${icon("terminal")}<span><strong>${esc(item.name)}</strong><p>${esc(item.description || "Imported tool")}</p><span class="pill approval">Approval required</span></span></article>`)).join("") : empty("connections", "Nothing to show yet", "Check your token permissions and the resources this connection can access.")}`;
  } catch (e) {
    sheet.querySelector(".explorer-body").innerHTML =
      `<div class="callout error">${icon("info")}<span>${esc(e)}</span></div><button class="button secondary" data-action="browse" data-id="${esc(id)}">${icon("refresh")} Try again</button>`;
  }
}
async function detail(id) {
  selectedTask = id;
  page = "tasks";
  events = await invoke("task_events", { taskId: id });
  render();
}
async function handleAction(el) {
  const a = el.dataset.action,
    id = el.dataset.id;
  if (await featureAction(el)) return;
  switch (a) {
    case "more-tools":
      moreTools = !moreTools; localStorage.setItem("benchhand-more-tools", moreTools ? "1" : "0"); render();
      break;
    case "folder-connect":
      folderForm();
      break;
    case "folder-pick": {
      const botId = sheet.querySelector("[name=botId]").value;
      busy(el, true, "Choose a folder…");
      try { const folder = await invoke("pick_workspace_folder", {botId}); if (folder) { closeSheet(); await refresh(); notify("Folder connected. File changes will ask for approval."); } } finally { busy(el, false); }
      break;
    }
    case "folder-detach":
      await invoke("detach_workspace_folder", {botId: id}); await refresh(); notify("Folder disconnected. Your files remain in place.");
      break;
    case "folder-task":
      newTask("", "Work in the attached folder. Inspect the relevant files before proposing changes.", id);
      break;
    case "first-task":
      composerDraft = "Introduce yourself in two sentences and suggest three useful first tasks I can try in Benchhand. Say which would need connected tools. Do not use any tools yet.";
      document.querySelector("#home-prompt").value = composerDraft;
      document.querySelector('[data-action="submit-home"]').click();
      break;
    case "scan-model-clients":
      await scanModelClients();
      break;
    case "model-tab":
      if (["connected", "available", "local"].includes(el.dataset.tab)) {
        modelTab = el.dataset.tab;
        render();
        document.querySelector(`.model-tab[data-tab="${modelTab}"]`)?.focus();
      }
      break;
    case "open-cli-docs":
      await invoke("open_external", {url:clientDocs[sheet.querySelector("#cli-provider")?.value || el.dataset.provider]});
      break;
    case "refresh-cli-models": {
      const f = sheet.querySelector("#connection-form");
      const selected = f.querySelector("[name=model]").value;
      await loadCliCatalog(selected === "__custom" ? f.querySelector("[name=customModel]").value : selected, f.querySelector("[name=reasoningEffort]").value);
      break;
    }
    case "connect-cli":
      cliConnectionForm(el.dataset.provider);
      break;
    case "activity-filter":
      activityFilter = el.dataset.filter;
      render();
      break;
    case "export-activity":
      download(`benchhand-activity-${selectedTask}.json`, JSON.stringify({ task: data.tasks.find((t) => t.id === selectedTask), events: events.map(activityEvent) }, null, 2));
      break;
    case "load-library":
      await loadLibrary();
      break;
    case "cancel-download":
      await invoke("cancel_download", { downloadId: id });
      await refresh();
      break;
    case "connect-installed":
      connectionForm("model", "ollama");
      sheet.querySelector("[name=baseUrl]").value =
        modelHost.replace(/\/$/, "").replace(/\/v1$/, "") + "/v1";
      sheet.querySelector("[name=model]").value = el.dataset.model;
      sheet.querySelector("[name=label]").value = el.dataset.model;
      break;
    case "import-extension":
      pluginImport();
      break;
    case "browser-setup":
      browserSetup();
      break;
    case "copy-browser-command":
      await navigator.clipboard.writeText(
        "npx @playwright/mcp@latest --port 8931",
      );
      notify("Server command copied.");
      break;
    case "connect-playwright":
      connectionForm("mcp");
      sheet.querySelector("[name=baseUrl]").value = "http://localhost:8931/mcp";
      sheet.querySelector("[name=label]").value = "Browser · Playwright";
      break;
    case "navigate":
      if (sheet.open) closeSheet();
      navigate(el.dataset.page);
      break;
    case "close-sheet":
      closeSheet();
      break;
    case "command":
      commandPalette();
      break;
    case "setup":
      setupOpen = true;
      setupStep = 0;
      render();
      break;
    case "setup-skip":
      data.settings.setupComplete = true;
      data.settings = await invoke("save_settings", {
        settings: data.settings,
      });
      setupOpen = false;
      render();
      break;
    case "setup-back":
      setupStep = Math.max(0, setupStep - 1);
      render();
      break;
    case "setup-next":
      if (setupStep === 0) {
        data.settings.ownerName = document
          .querySelector("#setup-owner")
          .value.trim();
        data.settings.workspaceName = document
          .querySelector("#setup-workspace")
          .value.trim();
        data.settings = await invoke("save_settings", {
          settings: data.settings,
        });
      }
      if (setupStep === 3) {
        data.settings.setupComplete = true;
        data.settings = await invoke("save_settings", {
          settings: data.settings,
        });
        setupOpen = false;
        localStorage.removeItem("teammate-setup-step");
        notify("Setup complete.");
      } else {
        setupStep++;
        localStorage.setItem("teammate-setup-step", setupStep);
      }
      render();
      break;
    case "set-pref":
      await preference(el.dataset.key, el.dataset.value);
      break;
    case "connect-model":
      connectionForm("model", el.dataset.preset || "ollama");
      break;
    case "connect-mcp":
      connectionForm("mcp");
      break;
    case "connect-catalog":
      connectionForm(el.dataset.kind, el.dataset.preset);
      break;
    case "edit-connection": {
      const c = data.connections.find((c) => c.id === id);
      connectionForm(c.kind, "custom", c);
      break;
    }
    case "discover-models":
      busy(el, true, "Discovering");
      try {
        const r = await invoke("probe_model", { input: connectionInput() });
        sheet.querySelector("#model-options").innerHTML = r.models
          .map((m) => `<option value="${esc(m)}">`)
          .join("");
        const input = sheet.querySelector("[name=model]");
        if (!input.value) input.value = r.models[0];
        sheet.querySelector("#discovery-result").textContent =
          `${r.models.length} models found. Select a model or type its name.`;
      } catch (e) {
        formError(e);
      } finally {
        busy(el, false);
      }
      break;
    case "test-connection":
      busy(el, true, "Testing");
      try {
        await invoke("test_connection", { connectionId: id });
        await refresh();
        notify("Connection verified.");
      } finally {
        busy(el, false);
      }
      break;
    case "confirm-disconnect":
      sheet.querySelector(".disconnect-confirm").hidden = false;
      break;
    case "disconnect":
      busy(el, true, "Disconnecting");
      await invoke("remove_connection", { connectionId: id });
      closeSheet();
      await refresh();
      notify("Connection removed and saved secret deleted.");
      break;
    case "edit-bot":
      botForm(id);
      break;
    case "delete-bot":
      await invoke("delete_bot", { botId: id });
      closeSheet();
      await refresh();
      notify("Teammate removed.");
      break;
    case "new-task":
      newTask();
      break;
    case "task-detail":
      if (sheet.open) closeSheet();
      await detail(id);
      break;
    case "task-back":
      selectedTask = "";
      render();
      break;
    case "task-filter":
      taskFilter = el.dataset.filter;
      render();
      break;
    case "connection-filter":
      connectionFilter = el.dataset.filter;
      render();
      break;
    case "run-task":
      busy(el, true, "Starting");
      await invoke("start_task", { taskId: id });
      await refresh();
      break;
    case "cancel-task":
      await invoke("cancel_task", { taskId: id });
      await refresh();
      notify("Task canceled.");
      break;
    case "edit-approval":
      editingApproval = editingApproval === id ? "" : id;
      approvalDraft = {};
      render();
      break;
    case "decide": {
      const card = el.closest(".approval-card"),
        approval = data.approvals.find((a) => a.id === id);
      let edited;
      if (el.dataset.edited && approval) {
        try {
          edited = editedArguments(card, approval);
        } catch (error) {
          const box = card.querySelector(".form-error");
          box.textContent = error.message;
          box.hidden = false;
          break;
        }
      }
      busy(el, true, "Recording");
      await invoke("decide_approval", {
        approvalId: id,
        decision: el.dataset.decision,
        ...(edited ? { arguments: edited } : {}),
      });
      editingApproval = "";
      approvalDraft = {};
      await refresh();
      notify("Decision saved.");
      break;
    }
    case "copy-result":
      await navigator.clipboard.writeText(
        data.tasks.find((t) => t.id === selectedTask)?.output || "",
      );
      notify("Result copied.");
      break;
    case "export-result": {
      const t = data.tasks.find((t) => t.id === selectedTask);
      download(
        `${t.title.replace(/[^a-z0-9 -]/gi, "").slice(0, 60) || "result"}.md`,
        `# ${t.title}\n\n${t.output}`,
        "text/markdown",
      );
      notify("Result exported.");
      break;
    }
    case "submit-home": {
      const text = document.querySelector("#home-prompt").value.trim();
      if (!text) {
        document.querySelector("#home-prompt").focus();
        notify("Write the task first.");
        break;
      }
      const botId = document.querySelector("#home-bot").value;
      busy(el, true, "Starting");
      const taskId = await invoke("create_task", {
        title: text.split("\n")[0].slice(0, 160),
        description: text,
        botId,
      });
      composerDraft = "";
      try {
        await invoke("start_task", { taskId });
      } catch (e) {
        notify(e, true);
      }
      await refresh();
      await detail(taskId);
      break;
    }
    case "starter": {
      const kind = el.dataset.template;
      if (
        ["github", "slack"].includes(kind) &&
        !data.connections.some((c) => c.kind === kind)
      ) {
        connectionForm(kind);
        break;
      }
      if (kind === "github")
        newTask(
          "Triage my open GitHub issues",
          "List my repositories, identify the most active one, and review its open issues. Suggest a prioritized action plan and save it as issue-triage.md. Do not publish anything.",
          "code",
        );
      else if (kind === "slack")
        newTask(
          "Catch me up on Slack",
          "List accessible Slack channels. Read a relevant channel and summarize decisions, blockers, and action items. Do not send any messages.",
          "operations",
        );
      else
        newTask(
          "Turn my goal into a practical plan",
          "My goal is: [add your goal]. Break it into milestones, dependencies, and the first three concrete actions. Save the plan as plan.md.",
          "operations",
        );
      break;
    }
    case "external":
      await invoke("open_external", { url: el.dataset.url });
      break;
    case "browse":
      await explore(id);
      break;
    case "repo-issues":
      await explore(id, "issues", { repository: el.dataset.repository });
      break;
    case "channel-history":
      await explore(id, "history", { channel: el.dataset.channel });
      break;
    case "explorer-task": {
      const e = explorer,
        c = data.connections.find((c) => c.id === e.id);
      closeSheet();
      newTask(
        `Help me with ${c.label}`,
        `Use the ${c.label} connection. ${e.method === "issues" ? `Review open issues in ${e.args.repository}.` : e.method === "history" ? `Read recent messages in Slack channel ${e.args.channel}.` : "Explore available context."} Summarize what matters and suggest next actions.`,
      );
      break;
    }
    case "export-settings":
      download(
        "benchhand-preferences.json",
        JSON.stringify(
          {
            format: "teammate-preferences",
            version: 1,
            settings: data.settings,
          },
          null,
          2,
        ),
      );
      notify("Preferences exported. No secrets included.");
      break;
  }
}
document.addEventListener("click", (event) => {
  const link = event.target.closest(".markdown a");
  if (link) {
    event.preventDefault();
    invoke("open_external", { url: link.href }).catch((e) => notify(e, true));
    return;
  }
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  handleAction(el).catch((e) => {
    busy(el, false);
    if (sheet.open) formError(e);
    else notify(e, true);
  });
});
sheet.addEventListener("cancel", () => {
  editingConnection = null;
  editingBot = null;
  explorer = null;
});
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) {
    const r = sheet.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeSheet();
  }
});
document.addEventListener("submit", async (event) => {
  if (event.target.id === "folder-form") {
    event.preventDefault(); const v = new FormData(event.target); const submitter = event.submitter; busy(submitter, true);
    try { await invoke("attach_workspace_folder", {botId:v.get("botId"),path:v.get("path")}); closeSheet(); await refresh(); notify("Folder connected. File changes will ask for approval."); } catch (e) { formError(e); busy(submitter, false); }
    return;
  }
  if (event.target.id === "download-form") {
    event.preventDefault();
    const model = new FormData(event.target).get("model");
    try {
      modelHost = document.querySelector("#model-host").value.trim();
      await invoke("download_model", { baseUrl: modelHost, model });
      await refresh();
      notify("Download started. You can keep working.");
    } catch (e) {
      notify(e, true);
    }
    return;
  }
  if (event.target.id === "extension-form") {
    event.preventDefault();
    try {
      const file = event.target.querySelector("#plugin-file")?.files?.[0];
      if (file) {
        if (file.size > 10_000_000)
          throw new Error("Use a plugin smaller than 10 MB.");
        if (file.name.toLowerCase().endsWith(".zip")) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let text = "";
          for (const b of bytes) text += String.fromCharCode(b);
          pluginInitialValues = {};
          pluginReview(
            await invoke("import_plugin", {
              manifest: btoa(text),
              bundle: true,
            }),
          );
        } else await importManifest(await file.text());
      } else {
        const text = new FormData(event.target).get("manifest");
        if (text.length > 1_000_000)
          throw new Error("Use a manifest smaller than 1 MB.");
        await importManifest(text);
      }
    } catch (e) {
      formError(e);
    }
    return;
  }
  if (!["connection-form", "bot-form", "task-form"].includes(event.target.id))
    return;
  event.preventDefault();
  const form = event.target,
    submitter = event.submitter;
  busy(
    submitter,
    true,
    form.id === "connection-form" ? "Verifying…" : "Saving…",
  );
  form.querySelector(".form-error").hidden = true;
  try {
    if (form.id === "connection-form") {
      await invoke("save_connection", { input: connectionInput() });
      closeSheet();
      if (page === "models") modelTab = "connected";
      await refresh();
      notify("Connected and verified.");
    } else if (form.id === "bot-form") {
      await invoke("save_bot", {
        bot: {
          ...Object.fromEntries(new FormData(form)),
          id: editingBot?.id || "",
        },
      });
      closeSheet();
      await refresh();
      notify("Teammate saved.");
    } else {
      const values = Object.fromEntries(new FormData(form)),
        taskId = await invoke("create_task", values),
        run = submitter?.value === "run";
      closeSheet();
      await refresh();
      if (run) {
        try {
          await invoke("start_task", { taskId });
        } catch (e) {
          notify(e, true);
        }
      }
      await refresh();
      await detail(taskId);
      if (!run) notify("Draft saved.");
    }
  } catch (e) {
    formError(e);
    busy(submitter, false);
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.id === "home-prompt") composerDraft = el.value;
  // Unsaved approval edits survive the live refresh while a task runs.
  if (el.matches("[data-arg]"))
    approvalDraft[el.dataset.arg] = el.type === "checkbox" ? el.checked : el.value;
  if (el.id === "task-search") {
    taskSearch = el.value;
    document.querySelector("#task-list").innerHTML = filteredTasks();
    colors(root);
  }
  if (el.id === "command-input") commandResults(el.value);
  if (el.matches("[data-pref]") && ["range", "color"].includes(el.type)) {
    data.settings[el.dataset.pref] =
      el.type === "range" ? Number(el.value) : el.value;
    applyTheme();
    const output = el.closest(".range-field")?.querySelector("output");
    if (output) output.textContent = `${el.value}px`;
    if (el.type === "color") {
      const code = document.querySelector(".accent-code");
      if (code) code.textContent = el.value;
    }
  }
});
document.addEventListener("change", async (event) => {
  const el = event.target;
  if (el.id === "home-bot") composerBot = el.value;
  try {
    if (el.matches("[data-pref]"))
      await preference(
        el.dataset.pref,
        el.type === "checkbox"
          ? el.checked
          : ["range", "number"].includes(el.type)
            ? Number(el.value)
            : el.value,
      );
    if (el.id === "cli-provider") {
      sheet.querySelector("[name=label]").value = clientNames[el.value];
      await loadCliCatalog();
    }
    if (el.id === "cli-model") updateCliEfforts();
    if (el.id === "provider-preset") {
      const p = providers[el.value];
      sheet.querySelector("[name=baseUrl]").value = p.url;
      sheet.querySelector("[name=label]").value = p.label;
      sheet.querySelector("[name=protocol]").value = p.protocol;
      sheet.querySelector("[name=model]").value = "";
      sheet.querySelector("#model-options").innerHTML = "";
    }
    if (el.id === "import-settings" && el.files?.[0]) {
      const f = el.files[0];
      if (f.size > 256000)
        throw new Error("Use a preferences file smaller than 256 KB.");
      const imported = JSON.parse(await f.text());
      if (imported.format !== "teammate-preferences" || !imported.settings)
        throw new Error("This is not a Benchhand preferences export.");
      data.settings = await invoke("save_settings", {
        settings: imported.settings,
      });
      render();
      notify("Preferences imported.");
    }
  } catch (e) {
    notify(e, true);
  }
});
document.addEventListener("keydown", (e) => {
  const typing = e.target.matches("input,textarea,select,[contenteditable]");
  const card = e.target.closest(".approval-card");
  if (card && !sheet.open && !setupOpen && !e.repeat && !e.isComposing) {
    const approve = card.querySelector('[data-action="decide"][data-decision="approved"]');
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key === "Enter" &&
        (e.target === card || e.target === approve) && approve && !approve.disabled) {
      e.preventDefault();
      approve.click();
      return;
    }
    if (e.key === "Escape" && card.classList.contains("editing")) {
      e.preventDefault();
      const id = card.querySelector('[data-action="edit-approval"]').dataset.id;
      editingApproval = "";
      approvalDraft = {};
      render();
      [...document.querySelectorAll(".approval-card")].find((item) =>
        item.querySelector('[data-action="edit-approval"]')?.dataset.id === id)?.focus();
      return;
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (sheet.open) closeSheet();
    commandPalette();
  } else if (
    !typing &&
    !sheet.open &&
    !setupOpen &&
    e.key.toLowerCase() === "n"
  ) {
    e.preventDefault();
    newTask();
  }
  if (e.target.id === "command-input" && e.key === "Enter") {
    e.preventDefault();
    sheet.querySelector(".command-option")?.click();
  }
  if (e.target.id === "command-input" && e.key === "ArrowDown") {
    e.preventDefault();
    sheet.querySelector(".command-option")?.focus();
  }
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (data.settings.theme === "system") applyTheme();
});
async function boot() {
  try {
    await refresh();
    if (page === "models") { loadLibrary(); scanModelClients(); }
    if (window.__TAURI__?.event?.listen)
      await window.__TAURI__.event.listen("workspace-updated", () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(
          () => refresh().catch((e) => notify(e, true)),
          200,
        );
      });
    if (window.__TAURI__?.event?.listen)
      await window.__TAURI__.event.listen("model-download", () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => refresh().catch(() => {}), 350);
      });
    setInterval(() => {
      if (
        !document.hidden &&
        (data.tasks.some((t) => t.status === "running") ||
          (data.downloads || []).some((d) => d.state === "downloading"))
      )
        refresh().catch(() => {});
    }, 2000);
  } catch (e) {
    root.innerHTML = `<main class="startup-error">${brandMark()}<h1>The workspace could not open</h1><p>${esc(e)}</p><p>Use the desktop application to access local storage and connections.</p><button class="button secondary" id="retry-start">${icon("refresh")} Try again</button></main>`;
    document.querySelector("#retry-start").onclick = boot;
  }
}
boot();
