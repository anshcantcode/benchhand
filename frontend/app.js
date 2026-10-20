const paths = {
  home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
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
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  play: "m8 5 11 7-11 7V5Z",
  stop: "M6 6h12v12H6Z",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z",
  model: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
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
  file: "M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8M8 17h6",
  info: "M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  back: "M19 12H5m6-6-6 6 6 6",
  sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2",
  moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
  monitor: "M3 3h18v14H3V3ZM8 21h8M12 17v4",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.spark}"/></svg>`;
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
  libraryError = "";
const accents = [
  "#b4a0ff",
  "#8bd7b6",
  "#83c9f4",
  "#efb47c",
  "#eb97b6",
  "#b6c7cc",
];
const pages = {
  home: "Overview",
  tasks: "Tasks",
  team: "Teammates",
  connections: "Connections",
  approvals: "Approvals",
  models: "Model library",
  extensions: "Extensions",
  settings: "Preferences",
};
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
    background: s.background || "glow",
  }))
    h.dataset[k] = v;
  h.style.setProperty(
    "--accent",
    /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : "#b4a0ff",
  );
  h.style.setProperty("--base-font", `${Number(s.fontSize) || 14}px`);
  h.style.setProperty("--radius", `${Number(s.radius ?? 14)}px`);
}
function colors(scope = document) {
  scope.querySelectorAll("[data-color]").forEach((e) => {
    if (/^#[0-9a-f]{6}$/i.test(e.dataset.color))
      e.style.setProperty("--bot-color", e.dataset.color);
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
const pending = () => data.approvals.filter((a) => a.status === "pending");
const modelName = (b) =>
  data.connections.find((c) => c.id === b?.providerId)?.config.model ||
  "Choose a model";
const avatar = (b, small = false) =>
  `<span class="avatar ${small ? "small" : ""}" data-color="${esc(b?.color || "#b4a0ff")}">${esc((b?.name || "T").slice(0, 2))}</span>`;
const status = (t) =>
  t.waitingApproval
    ? "Needs approval"
    : {
        queued: "Draft",
        running: "Working",
        paused: "Paused",
        completed: "Completed",
        failed: "Needs attention",
        canceled: "Canceled",
      }[t.status] || t.status;
const pill = (t) =>
  `<span class="pill ${t.waitingApproval ? "approval" : esc(t.status)}"><i></i>${status(t)}</span>`;
const button = (
  action,
  label,
  ic = "plus",
  attrs = "",
  cls = "button primary",
) =>
  `<button class="${cls}" data-action="${action}" ${attrs}>${icon(ic)}<span>${label}</span></button>`;
const heading = (eyebrow, title, sub, actions = "") =>
  `<header class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${sub}</p></div><div class="heading-actions">${actions}</div></header>`;
const section = (title, sub = "", action = "") =>
  `<div class="section-heading"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${action}</div>`;
const empty = (ic, title, body, action = "") =>
  `<div class="empty-state"><span class="empty-icon">${icon(ic)}</span><h3>${title}</h3><p>${body}</p>${action}</div>`;
const markdown = (text) =>
  window.marked && window.DOMPurify
    ? DOMPurify.sanitize(marked.parse(text || ""), {
        USE_PROFILES: { html: true },
      })
    : `<p class="plain-output">${esc(text)}</p>`;
function orbit() {
  return `<div class="orbit-art" aria-hidden="true"><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="orbit-center">${icon("spark")}</div>${["github", "slack", "model", "terminal"].map((n, i) => `<span class="orbit-node node-${i}">${icon(n)}</span>`).join("")}<span class="art-caption">A workspace that works with you.</span></div>`;
}
function sidebar() {
  const running = data.tasks.filter((t) => t.status === "running").length;
  return `<aside class="sidebar"><button class="brand" data-action="navigate" data-page="home"><span class="brand-symbol">${icon("spark")}</span><span>teammate<span class="brand-dot">.</span></span></button><button class="workspace-button" data-action="navigate" data-page="settings"><span class="workspace-monogram">${esc((data.settings.workspaceName || "My workspace")[0])}</span><span><strong>${esc(data.settings.workspaceName)}</strong><small>Personal workspace</small></span>${icon("chevron")}</button><div class="nav-caption">WORKSPACE</div><nav aria-label="Main navigation">${["home", "tasks", "team", "models", "connections", "extensions", "approvals"].map((id) => `<button class="nav-item ${page === id ? "active" : ""}" data-action="navigate" data-page="${id}" aria-label="${pages[id]}" title="${pages[id]}" ${page === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${pages[id]}</span>${id === "approvals" && pending().length ? `<b class="nav-count">${pending().length}</b>` : ""}</button>`).join("")}</nav><div class="sidebar-spacer"></div><div class="local-status"><i class="status-dot ${running ? "pulsing" : ""}"></i><span>${running ? `${running} tasks running` : "Your workspace is local"}<small>${data.connections.filter((c) => c.kind === "model").length} model connections</small></span></div><button class="nav-item ${page === "settings" ? "active" : ""}" data-action="navigate" data-page="settings" aria-label="Preferences" title="Preferences">${icon("settings")}<span>Preferences</span></button><div class="sidebar-footer"><span class="profile-avatar">${esc((data.settings.ownerName || "You")[0])}</span><span>${esc(data.settings.ownerName || "Your workspace")}<small>Teammate ${esc(data.device.version || "0.2.0")}</small></span></div></aside>`;
}
function topbar() {
  return `<div class="topbar"><div class="breadcrumbs"><span>${esc(data.settings.workspaceName)}</span>${icon("chevron")}<strong>${pages[page]}</strong></div><div class="topbar-right"><button class="search-trigger" data-action="command">${icon("search")}<span>Jump to anything</span><kbd>Ctrl K</kbd></button><button class="icon-button" title="Review approvals" data-action="navigate" data-page="approvals">${icon("approvals")}${pending().length ? '<span class="notification-dot"></span>' : ""}</button></div></div>`;
}
function teammateCard(b) {
  const active = data.tasks.some(
    (t) => t.botId === b.id && t.status === "running",
  );
  return `<button class="teammate-card" data-action="edit-bot" data-id="${esc(b.id)}"><div class="teammate-top">${avatar(b)}<span class="round-arrow">${icon("arrow")}</span></div><h3>${esc(b.name)}</h3><span class="role-label">${esc(b.role)}</span><p>${esc(b.description)}</p><div class="teammate-footer"><i class="status-dot ${active ? "pulsing" : ""}"></i><span>${active ? "Working on a task" : esc(modelName(b))}</span></div></button>`;
}
function taskRows(list) {
  return list
    .map(
      (t) =>
        `<button class="task-row" data-action="task-detail" data-id="${esc(t.id)}"><span class="task-state ${t.waitingApproval ? "approval" : esc(t.status)}">${icon(t.status === "completed" ? "check" : t.status === "running" ? "spark" : t.waitingApproval ? "approvals" : "file")}</span><span class="task-row-text"><strong>${esc(t.title)}</strong><small>${esc(t.botName)}<span>·</span>${relative(t.updatedAt)}</small></span>${pill(t)}<span class="row-chevron">${icon("chevron")}</span></button>`,
    )
    .join("");
}
function checklist() {
  const n = [
    !!data.settings.ownerName,
    data.connections.some((c) => c.kind === "model"),
    data.connections.some((c) => c.kind !== "model"),
  ];
  return `<button class="setup-banner" data-action="setup"><span class="setup-banner-icon">${icon("spark")}</span><span class="setup-banner-copy"><strong>Make yourself at home</strong><small>Connect your intelligence, bring your apps, make it yours.</small></span><span class="setup-progress">${n.map((x) => `<i class="${x ? "done" : ""}"></i>`).join("")}<small>${n.filter(Boolean).length} of 3</small></span>${icon("arrow")}</button>`;
}
function homeView() {
  const h = new Date().getHours(),
    g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
    name = data.settings.ownerName
      ? `, ${esc(data.settings.ownerName.split(" ")[0])}`
      : "",
    hasModel = data.connections.some((c) => c.kind === "model");
  return `${heading("YOUR PERSONAL WORKSPACE", `${g}${name}<span class="heading-period">.</span>`, "A little less busywork. A lot more possibility.", button("new-task", "New task"))}<section class="hero"><div class="hero-copy"><span class="hero-label">YOUR IDEAS, IN MOTION</span><h2>Big plans.<br><em>A little help.</em></h2><p>Give your teammates a goal.<br>Make room for the work that matters.</p></div>${orbit()}<div class="composer"><textarea id="home-prompt" rows="2" aria-label="Task goal" placeholder="What can we take off your plate?">${esc(composerDraft)}</textarea><div class="composer-bottom"><div class="composer-select">${icon("team")}<select id="home-bot" aria-label="Assign to teammate">${data.bots.map((b) => `<option value="${esc(b.id)}" ${composerBot === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div><span class="composer-hint">${hasModel ? "Your models. Your workspace." : "Connect a model to start."}</span>${button(hasModel ? "submit-home" : "connect-model", hasModel ? "Start task" : "Connect a model", hasModel ? "arrow" : "model")}</div></div></section>${!data.settings.setupComplete ? checklist() : ""}<section>${section("Your team", "A little expertise for every kind of work.", `<button class="text-button" data-action="navigate" data-page="team">Manage team ${icon("arrow")}</button>`)}<div class="team-grid">${data.bots.slice(0, 3).map(teammateCard).join("")}</div></section>${
    data.settings.showStarters
      ? `<section>${section("A good place to start")}<div class="starter-grid">${[
          [
            "github",
            "Tame the issue backlog",
            "Turn open issues into an action plan.",
          ],
          [
            "slack",
            "Catch up without the scroll",
            "Find what matters in your channels.",
          ],
          [
            "plan",
            "Make a plan that sticks",
            "Turn a big goal into useful next steps.",
          ],
        ]
          .map(
            ([id, title, desc]) =>
              `<button class="starter" data-action="starter" data-template="${id}"><span class="app-mark ${id}">${icon(id === "plan" ? "spark" : id)}</span><span><strong>${title}</strong><small>${desc}</small></span>${icon("arrow")}</button>`,
          )
          .join("")}</div></section>`
      : ""
  }<section>${section("Recent work", `${data.tasks.filter((t) => t.status === "completed").length} completed · ${data.tasks.filter((t) => t.status === "running").length} in progress`, `<button class="text-button" data-action="navigate" data-page="tasks">All tasks ${icon("arrow")}</button>`)}<div class="panel task-list">${data.tasks.length ? taskRows(data.tasks.slice(0, 5)) : empty("tasks", "Room for your first win", "Your tasks and finished work will collect here.", button("new-task", "Create a task", "plus", "", "button secondary"))}</div></section>${data.settings.showActivity ? `<div class="workspace-note">${icon("key")}<span>Private by design. Tasks stay on this device. Connections use your own accounts and keys.</span></div>` : ""}`;
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
    ? taskRows(list)
    : empty(
        "tasks",
        taskSearch ? "Nothing matched that search" : "A clear canvas",
        "Try another filter, or give a teammate a new task.",
        button("new-task", "Create a task", "plus", "", "button secondary"),
      );
}
function tasksView() {
  return selectedTask
    ? taskDetail()
    : `${heading("THE WORK, ALL IN ONE PLACE", "From idea to done.", "Start something new, pick up a draft, or revisit a result.", button("new-task", "New task"))}<div class="filter-toolbar"><div class="tabs" aria-label="Task filters">${[
        ["all", "All tasks"],
        ["running", "Working"],
        ["completed", "Completed"],
        ["attention", "Needs attention"],
      ]
        .map(
          ([id, label]) =>
            `<button class="tab ${taskFilter === id ? "active" : ""}" data-action="task-filter" data-filter="${id}">${label}</button>`,
        )
        .join(
          "",
        )}</div><label class="search-field">${icon("search")}<input id="task-search" type="search" value="${esc(taskSearch)}" placeholder="Find a task…" aria-label="Search tasks"></label></div><div id="task-list" class="panel task-list">${filteredTasks()}</div>`;
}
function taskDetail() {
  const t = data.tasks.find((t) => t.id === selectedTask);
  if (!t) {
    selectedTask = "";
    return tasksView();
  }
  const b = data.bots.find((b) => b.id === t.botId),
    a = pending().find((a) => a.taskId === t.id);
  return `<button class="text-button back-button" data-action="task-back">${icon("back")} All tasks</button><header class="task-heading"><div>${pill(t)}<h1>${esc(t.title)}</h1><p>${avatar(b, true)} ${esc(t.botName)} <span>·</span> ${esc(modelName(b))}</p></div><div class="heading-actions">${["running", "queued", "paused"].includes(t.status) ? button("cancel-task", "Cancel", "stop", `data-id="${esc(t.id)}"`, "button secondary") : ""}${!t.waitingApproval && t.status !== "running" ? button("run-task", t.status === "queued" ? "Run task" : "Run again", "play", `data-id="${esc(t.id)}"`) : ""}</div></header>${t.error ? `<div class="callout error">${icon("info")}<span>${esc(t.error)}</span></div>` : ""}${a ? approvalCard(a) : ""}<div class="task-detail-grid"><section class="panel result-panel"><div class="panel-heading"><h2>${t.output ? "The result" : "Your task"}</h2><div>${t.output ? `<button class="icon-button" title="Copy result" data-action="copy-result">${icon("copy")}</button><button class="icon-button" title="Export Markdown" data-action="export-result">${icon("download")}</button>` : ""}</div></div>${t.output ? `<article class="markdown">${markdown(t.output)}</article>` : t.status === "running" ? `<div class="working-state"><div class="thinking-orb">${icon("spark")}</div><h3>${esc(t.botName)} is on it.</h3><p>${esc(events.at(-1)?.message || "Starting your task…")}</p><span class="animated-dots"><i></i><i></i><i></i></span></div>` : `<div class="task-brief"><h3>${esc(t.title)}</h3><p>${esc(t.description || "No additional details.")}</p>${t.status === "queued" ? '<span class="subtle">Ready when you are. Run this task to get started.</span>' : ""}</div>`}</section><aside class="panel activity-panel"><div class="panel-heading"><h2>Activity</h2><span class="subtle">${events.length} events</span></div><ol class="timeline">${events.map((e, i) => `<li><i class="timeline-dot ${i === events.length - 1 && t.status === "running" ? "live" : ""}"></i><div><p>${esc(e.message)}</p><time>${new Date(e.createdAt * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</time></div></li>`).join("")}</ol><div class="activity-footnote">${icon("approvals")} External changes wait for your approval.</div></aside></div>`;
}
function teamView() {
  return `${heading("A TEAM THAT FITS YOU", "Different strengths.<br>One shared workspace.", "Give each teammate its own role, instructions, personality, and model.", button("edit-bot", "New teammate"))}<div class="team-grid expanded">${data.bots.map(teammateCard).join("")}<button class="add-teammate" data-action="edit-bot">${icon("plus")}<strong>A role only you can imagine</strong><span>Create a teammate from scratch</span></button></div><div class="info-strip">${icon("model")}<span>Every teammate can use connected tools. Its model and instructions shape how it works.</span></div>`;
}
const catalog = [
  {
    id: "local",
    kind: "model",
    ic: "terminal",
    name: "Local intelligence",
    tag: "ON YOUR DEVICE",
    desc: "Bring Ollama, LM Studio, vLLM, or a compatible local server.",
    sub: "Your hardware. Your models. Your rules.",
  },
  {
    id: "cloud",
    kind: "model",
    ic: "globe",
    name: "Cloud intelligence",
    tag: "BRING YOUR KEY",
    desc: "Connect OpenAI, OpenRouter, Groq, or your own compatible endpoint.",
    sub: "Chat Completions and Responses APIs.",
  },
  {
    id: "github",
    kind: "github",
    ic: "github",
    name: "GitHub",
    tag: "CODE & PROJECTS",
    desc: "Explore repositories, understand open issues, and draft new ones.",
    sub: "Publishing issues requires your approval.",
  },
  {
    id: "slack",
    kind: "slack",
    ic: "slack",
    name: "Slack",
    tag: "TEAM COMMUNICATION",
    desc: "Read channel context, catch up, and prepare thoughtful updates.",
    sub: "Sending messages requires your approval.",
  },
  {
    id: "mcp",
    kind: "mcp",
    ic: "connections",
    name: "MCP servers",
    tag: "BRING YOUR TOOLS",
    desc: "Import a Streamable HTTP MCP server and discover its tools.",
    sub: "Review imported tool calls before they run.",
  },
];
function connectionsView() {
  const cards = catalog.filter(
    (c) =>
      connectionFilter === "all" ||
      (connectionFilter === "models" ? c.kind === "model" : c.kind !== "model"),
  );
  return `${heading("YOUR WORK, CONNECTED", "Bring your world in.", "Choose your intelligence. Connect the tools you already use.", button("connect-mcp", "Add MCP server", "plus", "", "button secondary"))}${data.connections.length ? `<section>${section("Connected to your workspace", `${data.connections.length} connections · secrets saved in your OS credential store`)}<div class="connected-list">${data.connections.map((c) => `<article class="connected-row"><span class="app-mark ${esc(c.kind)}">${icon(c.kind === "model" ? "model" : c.kind === "mcp" ? "connections" : c.kind)}</span><span class="connection-identity"><strong>${esc(c.label)} <i class="verified-dot"></i></strong><small>${esc(c.account)}</small></span><span class="last-verified">Verified ${relative(c.verifiedAt)}</span><div class="row-actions">${c.kind !== "model" ? `<button class="button small secondary" data-action="browse" data-id="${esc(c.id)}">Browse</button>` : ""}<button class="icon-button" title="Test ${esc(c.label)}" data-action="test-connection" data-id="${esc(c.id)}">${icon("refresh")}</button><button class="icon-button" title="Manage ${esc(c.label)}" data-action="edit-connection" data-id="${esc(c.id)}">${icon("settings")}</button></div></article>`).join("")}</div></section>` : ""}<section>${section("Make more possible")}<div class="tabs catalog-tabs">${[
    ["all", "All connections"],
    ["models", "Models"],
    ["apps", "Apps & tools"],
  ]
    .map(
      ([id, label]) =>
        `<button class="tab ${connectionFilter === id ? "active" : ""}" data-action="connection-filter" data-filter="${id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="catalog-grid">${cards.map((c) => `<article class="catalog-card"><div class="catalog-card-top"><span class="app-mark large ${c.kind}">${icon(c.ic)}</span><span class="catalog-tag">${c.tag}</span></div><h3>${c.name}</h3><p>${c.desc}</p><small>${c.sub}</small><button class="button secondary" data-action="connect-catalog" data-kind="${c.kind}" data-preset="${c.id === "local" ? "ollama" : c.id === "cloud" ? "openai" : ""}">${icon("plus")} Connect ${c.kind === "model" ? "a model" : c.kind === "mcp" ? "a server" : c.name}</button></article>`).join("")}</div></section>`;
}
function approvalCard(a) {
  return `<article class="approval-card"><div class="approval-header"><span class="approval-emblem">${icon("approvals")}</span><div><span class="eyebrow">YOUR CALL</span><h3>${esc(a.title)}</h3><p>${esc(a.target)} · ${relative(a.createdAt)}</p></div></div><p>${esc(a.summary)}</p><pre class="approval-payload">${esc(JSON.stringify(a.arguments, null, 2))}</pre><div class="approval-actions"><button class="button secondary" data-action="decide" data-id="${esc(a.id)}" data-decision="rejected">Reject action</button><button class="button primary" data-action="decide" data-id="${esc(a.id)}" data-decision="approved">${icon("check")} Approve & continue</button></div></article>`;
}
function approvalsView() {
  return `${heading("YOU STAY IN CONTROL", "A moment for your judgment.", "Review the exact changes your teammates want to make.")}<div class="approval-grid">${pending().length ? pending().map(approvalCard).join("") : empty("approvals", "You’re all clear", "Publishing, sending, and imported tool calls will wait here for your review.")}</div>${
    data.approvals.some((a) => a.status !== "pending")
      ? `<section>${section("Previous decisions")}<div class="panel">${data.approvals
          .filter((a) => a.status !== "pending")
          .slice(0, 10)
          .map(
            (a) =>
              `<div class="decision-row">${icon(a.status === "approved" ? "check" : "close")}<span><strong>${esc(a.title)}</strong><small>${esc(a.target)}</small></span><span class="subtle">${esc(a.status)}</span></div>`,
          )
          .join("")}</div></section>`
      : ""
  }`;
}
function themeChoices() {
  return `<div class="theme-choices">${[
    ["dark", "Midnight", "moon"],
    ["light", "Daylight", "sun"],
    ["system", "System", "monitor"],
  ]
    .map(
      ([v, name, ic]) =>
        `<button class="theme-choice ${data.settings.theme === v ? "selected" : ""}" data-action="set-pref" data-key="theme" data-value="${v}"><span class="theme-preview ${v}"><i></i><i></i><i></i></span><span>${icon(ic)}${name}${data.settings.theme === v ? icon("check") : ""}</span></button>`,
    )
    .join("")}</div>`;
}
function accentChoices() {
  return `<div class="accent-choices">${accents.map((v) => `<button class="color-swatch ${data.settings.accent === v ? "selected" : ""}" data-color="${v}" aria-label="Accent ${v}" data-action="set-pref" data-key="accent" data-value="${v}">${data.settings.accent === v ? icon("check") : ""}</button>`).join("")}<label class="custom-color" title="Custom accent">${icon("plus")}<input type="color" data-pref="accent" value="${esc(data.settings.accent)}" aria-label="Custom accent color"></label><span class="subtle accent-code">${esc(data.settings.accent)}</span></div>`;
}
const toggle = (key, title, desc) =>
  `<label class="toggle-row"><span><strong>${title}</strong><small>${desc}</small></span><input class="toggle" type="checkbox" data-pref="${key}" ${data.settings[key] ? "checked" : ""}></label>`;
function settingsView() {
  const s = data.settings;
  return `${heading("YOUR SPACE, YOUR WAY", "Make it unmistakably yours.", "Changes save on this device and preview immediately.")}<div class="preferences-grid"><div><section class="panel preference-section"><div class="panel-heading"><h2>Look & feel</h2>${icon("sun")}</div><div class="preference-body"><label class="field-label">Theme</label>${themeChoices()}<label class="field-label spaced">Your accent</label>${accentChoices()}<div class="two-columns spaced"><label class="field"><span>Density</span><select data-pref="density"><option value="comfortable" ${s.density === "comfortable" ? "selected" : ""}>Comfortable</option><option value="compact" ${s.density === "compact" ? "selected" : ""}>Compact</option></select></label><label class="field"><span>Typography</span><select data-pref="font"><option value="sans" ${s.font === "sans" ? "selected" : ""}>Clean sans serif</option><option value="mono" ${s.font === "mono" ? "selected" : ""}>Monospace</option></select></label></div>${[
    ["fontSize", "Text size", 12, 18],
    ["radius", "Corner radius", 0, 24],
  ]
    .map(
      ([key, title, min, max]) =>
        `<label class="range-field"><span>${title}<output>${s[key]}px</output></span><input type="range" min="${min}" max="${max}" step="1" data-pref="${key}" value="${s[key]}"></label>`,
    )
    .join(
      "",
    )}${toggle("sidebarCompact", "Compact sidebar", "Keep just the icons and give your work more room.")}${toggle("reduceMotion", "Reduced motion", "Use fewer transitions and animations.")}<label class="field spaced"><span>Workspace atmosphere</span><select data-pref="background"><option value="glow" ${s.background === "glow" ? "selected" : ""}>Subtle ambient glow</option><option value="flat" ${s.background === "flat" ? "selected" : ""}>Quiet, flat surfaces</option></select></label></div></section><section class="panel preference-section"><div class="panel-heading"><h2>Workspace & behavior</h2>${icon("settings")}</div><div class="preference-body"><div class="two-columns"><label class="field"><span>Workspace name</span><input data-pref="workspaceName" maxlength="60" value="${esc(s.workspaceName)}"></label><label class="field"><span>Your name</span><input data-pref="ownerName" maxlength="60" value="${esc(s.ownerName)}" placeholder="What should we call you?"></label></div><div class="two-columns spaced"><label class="field"><span>Open on</span><select data-pref="defaultView">${["home", "tasks", "team", "connections"].map((v) => `<option value="${v}" ${s.defaultView === v ? "selected" : ""}>${pages[v]}</option>`).join("")}</select></label><label class="field"><span>Maximum steps per run</span><input type="number" min="1" max="30" data-pref="maxSteps" value="${s.maxSteps}"></label></div>${toggle("showStarters", "Show quick starts", "Useful starting points on your overview.")}${toggle("showActivity", "Show privacy note", "A quiet reminder of where your data lives.")}</div></section>${visionSettings()}</div><aside class="preferences-aside"><section class="panel"><div class="panel-heading"><h2>Keep your setup</h2></div><div class="preference-body"><p class="subtle">Export your appearance and workspace preferences. Keys and connected accounts are never included.</p><button class="button secondary full" data-action="export-settings">${icon("download")} Export preferences</button><label class="button quiet full file-label">${icon("upload")} Import preferences<input type="file" accept="application/json,.json" id="import-settings"></label></div></section><section class="panel"><div class="panel-heading"><h2>A few shortcuts</h2></div><div class="shortcut-list"><span>Jump to anything <kbd>Ctrl K</kbd></span><span>New task <kbd>N</kbd></span><span>Close a panel <kbd>Esc</kbd></span></div></section><section class="panel device-card">${icon("monitor")}<h3>Built for this device</h3><p>${esc(data.device.os)} · ${esc(data.device.arch)}<br>${data.device.threads} CPU threads available</p><span class="pill completed"><i></i>Local storage</span></section><button class="text-button" data-action="setup">${icon("spark")} Revisit guided setup</button></aside></div>`;
}
function setupView() {
  const names = ["Your space", "Intelligence", "Connections", "Your style"];
  const content = [
    `<span class="eyebrow">WELCOME TO YOUR NEXT CHAPTER</span><h1>A little help.<br>A lot more you.</h1><p class="setup-description">A personal team for your ideas, projects, and everyday work. Let’s make it feel like home.</p><label class="field"><span>What should we call you?</span><input id="setup-owner" maxlength="60" placeholder="Your first name" value="${esc(data.settings.ownerName)}" autocomplete="given-name"></label><label class="field"><span>Name your workspace</span><input id="setup-workspace" maxlength="60" value="${esc(data.settings.workspaceName)}"></label>`,
    `<span class="eyebrow">CHOOSE YOUR INTELLIGENCE</span><h1>Your favorite models.<br>Your choice.</h1><p class="setup-description">Run models on this computer or connect a cloud provider with your own API key.</p><div class="setup-options"><button data-action="connect-model" data-preset="ollama">${icon("terminal")}<span><strong>Keep it local</strong><small>Ollama, LM Studio, or another local server.</small></span>${icon("arrow")}</button><button data-action="connect-model" data-preset="openai">${icon("globe")}<span><strong>Connect the cloud</strong><small>Use your key and choose a model.</small></span>${icon("arrow")}</button></div>${data.connections
      .filter((c) => c.kind === "model")
      .map(
        (c) =>
          `<div class="setup-connected">${icon("check")}${esc(c.label)} · ${esc(c.account)}</div>`,
      )
      .join(
        "",
      )}<p class="helper">Add multiple providers and assign a different model to each teammate.</p>`,
    `<span class="eyebrow">BRING YOUR WORK ALONG</span><h1>Fewer tabs.<br>More context.</h1><p class="setup-description">Let your teammates work with the tools you already use. You control every connection.</p><div class="setup-apps">${catalog
      .filter((c) => c.kind !== "model")
      .map(
        (c) =>
          `<button data-action="connect-catalog" data-kind="${c.kind}"><span class="app-mark ${c.kind}">${icon(c.ic)}</span><span><strong>${c.name}</strong><small>${data.connections.some((x) => x.kind === c.kind) ? "Connected" : "Connect your account or server"}</small></span>${icon(data.connections.some((x) => x.kind === c.kind) ? "check" : "plus")}</button>`,
      )
      .join(
        "",
      )}</div><p class="helper">GitHub and Slack use the permissions of your token. External changes and imported tool calls wait for approval.</p>`,
    `<span class="eyebrow">FINISHING TOUCHES</span><h1>Make space<br>for your style.</h1><p class="setup-description">Start with a theme and a color that feels like you. Everything can be changed later.</p>${themeChoices()}<label class="field-label spaced">Choose your accent</label>${accentChoices()}<div class="setup-ready">${icon("check")}<span><strong>Your team is ready to meet you.</strong><small>${data.bots.length} editable teammates · ${data.connections.length} connections · your workspace</small></span></div>`,
  ][setupStep];
  return `<div class="setup-layout"><aside class="setup-visual"><button class="brand" data-action="setup-skip"><span class="brand-symbol">${icon("spark")}</span><span>teammate.</span></button>${orbit()}<div class="setup-visual-copy"><span class="eyebrow">BUILT AROUND YOU</span><h2>Your models.<br>Your tools.<br><em>Your possibilities.</em></h2><p>An open workspace for the way you think.</p></div><span class="setup-local">${icon("key")} Local first. Yours always.</span></aside><main class="setup-main"><div class="setup-top"><div class="step-indicators">${names.map((n, i) => `<span class="${i === setupStep ? "current" : i < setupStep ? "complete" : ""}" title="${n}">${i < setupStep ? icon("check") : i + 1}</span>`).join("")}</div><button class="text-button" data-action="setup-skip">Explore first ${icon("arrow")}</button></div><div class="setup-content">${content}</div><footer class="setup-bottom"><span>STEP ${setupStep + 1} OF 4 <b>${names[setupStep]}</b></span><div>${setupStep ? '<button class="button quiet" data-action="setup-back">Back</button>' : ""}<button class="button primary" data-action="setup-next">${setupStep === 3 ? "Open my workspace" : "Continue"}${icon("arrow")}</button></div></footer></main></div>`;
}
function render() {
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
          extensions: extensionsView,
          approvals: approvalsView,
          settings: settingsView,
        }[page] || homeView
      )()}</main></div></div>`;
  colors(root);
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
  return `<section class="panel preference-section"><div class="panel-heading"><h2>Vision for your whole team</h2>${icon("globe")}</div><div class="preference-body"><p class="subtle">A vision companion describes images returned by MCP tools for teammates using text models. Images are sent to the connection you choose.</p><label class="field spaced"><span>Vision companion</span><select data-pref="visionProviderId"><option value="">None · use each model’s own capabilities</option>${data.connections
    .filter((c) => c.kind === "model" && c.config.vision)
    .map(
      (c) =>
        `<option value="${esc(c.id)}" ${data.settings.visionProviderId === c.id ? "selected" : ""}>${esc(c.label)} · ${esc(c.config.model)}</option>`,
    )
    .join(
      "",
    )}</select><small class="helper">Mark an image capable connection in its model settings to make it available here.</small></label></div></section>`;
}
async function refresh() {
  data = await invoke("bootstrap");
  if (selectedTask)
    events = await invoke("task_events", { taskId: selectedTask });
  if (!started) {
    page = data.settings.defaultView || "home";
    setupOpen = !data.settings.setupComplete;
    setupStep = Math.min(
      3,
      Number(localStorage.getItem("teammate-setup-step")) || 0,
    );
    started = true;
  }
  render();
}
function navigate(next) {
  page = next;
  selectedTask = "";
  taskSearch = "";
  render();
  document.querySelector("#main-content")?.scrollTo(0, 0);
  if (next === "models" && !libraryLoaded) loadLibrary();
}
const bytesLabel = (bytes) =>
  bytes >= 1e9
    ? `${(bytes / 1e9).toFixed(1)} GB`
    : `${Math.round(bytes / 1e6)} MB`;
function modelsView() {
  const downloads = data.downloads || [];
  return `${heading("INTELLIGENCE, ON YOUR TERMS", "A home for your models.", "Download through Ollama, connect a local runtime, and choose what powers your team.", button("external", "Get Ollama", "external", 'data-url="https://ollama.com/download"', "button secondary"))}
  <section class="panel library-runtime"><div><span class="app-mark model">${icon("terminal")}</span><div><h2>Your Ollama runtime</h2><p>Downloads stay in Ollama’s library and can be shared with your other apps.</p></div></div><div class="runtime-address"><label class="field"><span>Server URL</span><input id="model-host" type="url" value="${esc(modelHost)}" aria-label="Ollama server URL"></label>${button("load-library", "Refresh library", "refresh", "", "button secondary")}</div></section>
  <section class="panel download-panel"><div><span class="eyebrow">SOMETHING NEW TO THINK WITH</span><h2>Bring a model home.</h2><p class="subtle">Enter any model tag supported by Ollama. Check the model’s license and hardware requirements before downloading.</p></div><form id="download-form"><input name="model" aria-label="Model to download" placeholder="e.g. qwen3:8b or hf.co/owner/model:Q4_K_M" required maxlength="200">${button("", "Download model", "download", 'type="submit"')}</form><button class="text-button" data-action="external" data-url="https://ollama.com/library">Explore the Ollama model library ${icon("external")}</button></section>
  ${downloads.length ? `<section>${section("Downloads")}<div class="panel download-list">${downloads.map((d) => `<article class="download-row"><span class="app-mark model">${icon(d.state === "completed" ? "check" : "download")}</span><div><strong>${esc(d.model)}</strong><small>${esc(d.status)}</small>${d.total ? `<progress max="${Number(d.total)}" value="${Number(d.completed)}" aria-label="Download progress"></progress><small>${bytesLabel(Number(d.completed))} of ${bytesLabel(Number(d.total))}</small>` : ""}</div>${d.state === "downloading" ? button("cancel-download", "Cancel", "close", `data-id="${esc(d.id)}"`, "button quiet small") : d.state === "completed" ? button("connect-installed", "Use model", "plus", `data-model="${esc(d.model)}"`, "button secondary small") : ""}</article>`).join("")}</div></section>` : ""}
  <section>${section("Installed models", `${installedModels.length} models in this runtime`)}${libraryError ? `<div class="callout error">${icon("info")}<span>${esc(libraryError)}</span></div>` : ""}<div class="catalog-grid">${installedModels.length ? installedModels.map((m) => `<article class="catalog-card"><span class="app-mark large model">${icon("model")}</span><h3>${esc(m.name)}</h3><p>${esc(m.details?.parameter_size || "Local model")} · ${esc(m.details?.quantization_level || m.details?.format || "Ollama")}</p><small>${bytesLabel(Number(m.size || 0))} on disk</small><button class="button secondary" data-action="connect-installed" data-model="${esc(m.name)}">${icon("plus")} Use this model</button></article>`).join("") : empty("model", libraryLoaded ? "Your library is ready for a model." : "Finding your local intelligence…", "Start Ollama, refresh this library, then download a model by name.")}</div></section>`;
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
function extensionsView() {
  return `${heading("A WORKSPACE THAT GROWS WITH YOU", "More possibilities. Open doors.", "Bring in tools through MCP. Every connected model uses the same tool layer.", button("import-extension", "Import extension", "upload", "", "button primary"))}
  <div class="extension-feature"><div><span class="eyebrow">BROWSER AUTOMATION</span><h2>A capable pair of hands<br><em>for the web.</em></h2><p>Connect Microsoft’s Playwright MCP server. Your teammates can read page structure and use browser tools with local or cloud models.</p><button class="button primary" data-action="browser-setup">${icon("globe")} Set up browser tools</button></div><div class="browser-art" aria-hidden="true"><div><i></i><i></i><i></i></div><span>${icon("globe")}</span><b>Your browser. Your workflow.</b></div></div>
  <section>${section("Your open tool library", "Connect services directly, or import your own HTTP MCP configuration.")}<div class="catalog-grid">${[
    [
      "github",
      "GitHub",
      "Repositories, open issues, and approved publishing.",
      "connect-catalog",
      'data-kind="github"',
    ],
    [
      "slack",
      "Slack",
      "Read channel context and send messages after approval.",
      "connect-catalog",
      'data-kind="slack"',
    ],
    [
      "connections",
      "Your MCP server",
      "Add browser, computer, search, or business tools exposed by your server.",
      "connect-mcp",
      "",
    ],
  ]
    .map(
      ([ic, title, desc, action, attrs]) =>
        `<article class="catalog-card"><span class="app-mark large ${ic}">${icon(ic)}</span><h3>${title}</h3><p>${desc}</p><small>${ic === "connections" ? "Streamable HTTP · bring your endpoint" : "Built into Teammate"}</small><button class="button secondary" data-action="${action}" ${attrs}>${icon("plus")} Connect</button></article>`,
    )
    .join(
      "",
    )}</div></section><div class="info-strip">${icon("info")}<span>Extensions run through connected services. Computer control requires a compatible tool server. Vision requires an image capable model or a vision companion; a text model cannot see pixels on its own.</span></div>`;
}
function browserSetup() {
  openSheet(
    `${dialogHeading("BROWSER TOOLS", "Meet your browser teammate.", "A real browser connection, powered by the open source Playwright MCP server.")}<div class="sheet-body"><ol class="setup-guide"><li><h3>Start the server</h3><p>With Node.js installed, run this command in a terminal. It opens a separate browser profile when used.</p><pre>npx @playwright/mcp@latest --port 8931</pre><button class="text-button" data-action="copy-browser-command">${icon("copy")} Copy command</button></li><li><h3>Connect to Teammate</h3><p>Keep the server running, then verify the endpoint below. Imported browser actions will wait for your approval.</p><code>http://localhost:8931/mcp</code></li><li><h3>Give a teammate a goal</h3><p>Use native tool calling or Structured actions. Accessibility snapshots let text models understand page controls.</p></li></ol><button class="text-button" data-action="external" data-url="https://github.com/microsoft/playwright-mcp">Read the server documentation ${icon("external")}</button></div><div class="sheet-footer"><button class="button quiet" data-action="close-sheet">Later</button><button class="button primary" data-action="connect-playwright">${icon("connections")} Connect browser server</button></div>`,
  );
}
function importExtension() {
  openSheet(
    `${dialogHeading("YOUR OPEN TOOLBOX", "Bring your own extension.", "Import an HTTP MCP config or a Teammate extension manifest. Review the endpoint before connecting.")}<form id="extension-form"><div class="sheet-body"><label class="field"><span>Extension JSON</span><textarea name="manifest" rows="12" required spellcheck="false" placeholder='{"name":"My tools","url":"http://localhost:8931/mcp"}'></textarea></label><p class="helper">Also accepts an mcpServers object with a url entry. Command based stdio servers need an HTTP bridge. Credentials are entered in the connection form.</p><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button class="button quiet" type="button" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">Review connection ${icon("arrow")}</button></div></form>`,
  );
}
function openSheet(html, wide = false) {
  sheet.className = wide ? "wide-sheet" : "";
  sheet.innerHTML = html;
  if (!sheet.open) sheet.showModal();
  colors(sheet);
  const firstInput = sheet.querySelector("input:not([type=hidden]):not([type=color]),textarea");
  (firstInput || sheet.querySelector("button"))?.focus();
}
function closeSheet() {
  sheet.close();
  sheet.innerHTML = "";
  editingConnection = null;
  editingBot = null;
  explorer = null;
}
const dialogHeading = (label, title, desc = "") =>
  `<div class="sheet-heading"><div><span class="eyebrow">${label}</span><h2 id="dialog-title">${title}</h2>${desc ? `<p>${desc}</p>` : ""}</div><button class="icon-button" type="button" data-action="close-sheet" aria-label="Close panel">${icon("close")}</button></div>`;
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
  editingConnection = connection;
  const c = connection?.config || {},
    p = providers[preset] || providers[kind === "model" ? "ollama" : "custom"];
  let help = "";
  if (kind === "github")
    help = `<strong>A personal access token, scoped to your work.</strong><p>Grant repository metadata and issues read access. Add issues write access to create issues after approval.</p><button type="button" class="text-button" data-action="external" data-url="https://github.com/settings/personal-access-tokens/new">Create a GitHub token ${icon("external")}</button>`;
  else if (kind === "slack")
    help = `<strong>Connect a Slack app token.</strong><p>Recommended scopes: channels:read, groups:read, channels:history, groups:history, and chat:write for approved messages. Invite your app to the channels it should read.</p><button type="button" class="text-button" data-action="external" data-url="https://api.slack.com/apps">Open Slack apps ${icon("external")}</button>`;
  else if (kind === "mcp")
    help =
      "<strong>Bring tools from your own server.</strong><p>Connecting discovers its tools. Each imported tool call pauses for your review.</p>";
  else
    help =
      "<p>Start your local runtime first. Ollama uses port 11434; LM Studio commonly uses 1234. Local connections usually need no API key.</p>";
  openSheet(
    `${dialogHeading("YOUR CONNECTIONS", connection ? `Manage ${esc(connection.label)}` : kind === "model" ? "Connect your intelligence" : `Connect ${kind === "mcp" ? "an MCP server" : kind === "github" ? "GitHub" : "Slack"}`)}<form id="connection-form" data-kind="${kind}"><div class="sheet-body"><div class="connection-help">${help}</div><label class="field"><span>Connection name</span><input name="label" maxlength="80" value="${esc(connection?.label || (kind === "model" ? p.label : kind === "mcp" ? "My MCP server" : kind === "github" ? "GitHub" : "Slack"))}" required></label>${
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
        `<label class="toggle-row"><span><strong>This model accepts images</strong><small>Enable for a vision capable model. Tool images can then be included in its context.</small></span><input type="checkbox" class="toggle" name="vision" ${c.vision ? "checked" : ""}></label>`,
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
      model: v.get("model") || "",
      protocol: v.get("protocol") || "chat",
      toolMode: v.get("toolMode") || "native",
      vision: v.get("vision") === "on",
      enabledForAgents: v.get("enabledForAgents") === "on",
    },
  };
}
function botForm(id = "") {
  const b = data.bots.find((b) => b.id === id);
  editingBot = b;
  openSheet(
    `${dialogHeading("YOUR TEAM", b ? `Meet ${esc(b.name)}` : "A new kind of teammate", "Give it a name, a point of view, and the intelligence to match.")}<form id="bot-form"><div class="sheet-body"><div class="bot-profile-preview">${avatar(b || { name: "New", color: data.settings.accent })}<span>${b ? "Make this teammate your own." : "A blank slate for your next good idea."}</span></div><div class="two-columns"><label class="field"><span>Name</span><input name="name" maxlength="60" value="${esc(b?.name || "")}" placeholder="e.g. Nova" required></label><label class="field"><span>Color</span><input type="color" name="color" value="${esc(b?.color || data.settings.accent)}" aria-label="Teammate color"></label></div><label class="field"><span>Role</span><input name="role" maxlength="100" value="${esc(b?.role || "")}" placeholder="e.g. Your writing partner"></label><label class="field"><span>A short introduction</span><textarea name="description" rows="2" maxlength="300" placeholder="What is this teammate best at?">${esc(b?.description || "")}</textarea></label><label class="field"><span>Model connection</span><select name="providerId"><option value="">Choose a model connection</option>${data.connections
      .filter((c) => c.kind === "model")
      .map(
        (c) =>
          `<option value="${esc(c.id)}" ${b?.providerId === c.id ? "selected" : ""}>${esc(c.label)} · ${esc(c.config.model)}</option>`,
      )
      .join(
        "",
      )}</select><small class="helper">Connect a model from Connections to assign it here.</small></label><label class="field"><span>Instructions & personality</span><textarea name="instructions" rows="7" maxlength="12000" placeholder="Describe its expertise, how it should work, and what a great result looks like…">${esc(b?.instructions || "")}</textarea></label><div class="form-error" role="alert" hidden></div>${b ? `<button type="button" class="text-button danger" data-action="delete-bot" data-id="${esc(b.id)}">${icon("trash")} Remove teammate</button>` : ""}</div><div class="sheet-footer"><button type="button" class="button quiet" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">${icon("check")} Save teammate</button></div></form>`,
  );
}
function newTask(title = "", description = "", botId = "") {
  openSheet(
    `${dialogHeading("A LITTLE HELP STARTS HERE", "What’s the goal?", "Clear context helps your teammate do its best work.")}<form id="task-form"><div class="sheet-body"><label class="field"><span>Task</span><input name="title" maxlength="160" placeholder="What would you like done?" value="${esc(title)}" required></label><label class="field"><span>Context & desired outcome</span><textarea name="description" rows="7" maxlength="16000" placeholder="Add background and what a good result looks like…">${esc(description)}</textarea></label><label class="field"><span>Who’s on it?</span><select name="botId">${data.bots.map((b) => `<option value="${esc(b.id)}" ${b.id === botId ? "selected" : ""}>${esc(b.name)} · ${esc(b.role)}</option>`).join("")}</select></label><div class="form-error" role="alert" hidden></div><div class="secure-note">${icon("approvals")} Teammates ask before publishing, sending, or using imported tools.</div></div><div class="sheet-footer"><button class="button secondary" type="submit" value="draft">Save draft</button><button class="button primary" type="submit" value="run">${icon("play")} Create & run</button></div></form>`,
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
    `${dialogHeading("A SHORTCUT TO YOUR WORKSPACE", "Where would you like to go?")}<div class="command-search">${icon("search")}<input id="command-input" placeholder="Search pages, teammates, and tasks…" aria-label="Command search" autocomplete="off"></div><div id="command-results"></div><div class="command-footer"><kbd>Enter</kbd> to open <kbd>Esc</kbd> to close</div>`,
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
    `${dialogHeading("CONNECTED WORK", esc(c.label), esc(c.account))}<div class="sheet-body explorer-body"><div class="loading-state"><span class="loader"></span>Fetching your workspace…</div></div>`,
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
      `${["issues", "history"].includes(method) ? `<button class="text-button back-button" data-action="browse" data-id="${esc(id)}">${icon("back")} Back to list</button>` : ""}<div class="explorer-toolbar"><span>${list.length} ${method === "history" ? "recent messages" : method}</span><button class="button small secondary" data-action="explorer-task">${icon("spark")} Use in a task</button></div>${list.length ? list.map((item) => (method === "repositories" ? `<button class="resource-card" data-action="repo-issues" data-id="${esc(id)}" data-repository="${esc(item.fullName)}">${icon("github")}<span><strong>${esc(item.fullName)}</strong><p>${esc(item.description || "No description.")}</p><small>${esc(item.language || "Repository")} · ${item.openIssues} open issues${item.private ? " · Private" : ""}</small></span>${icon("chevron")}</button>` : method === "channels" ? `<button class="resource-card" data-action="channel-history" data-id="${esc(id)}" data-channel="${esc(item.id)}"><span class="channel-hash">#</span><span><strong>${esc(item.name)}</strong><p>${esc(item.topic || "No topic set.")}</p></span>${icon("chevron")}</button>` : method === "issues" ? `<article class="resource-card"><span class="issue-number">#${item.number}</span><span><strong>${esc(item.title)}</strong><p>${esc((item.body || "").slice(0, 500))}</p><button class="text-button" data-action="external" data-url="${esc(item.url)}">Open issue ${icon("external")}</button></span></article>` : method === "history" ? `<article class="message-card"><small>${esc(item.user || "Slack")} · ${new Date(Number(item.ts) * 1000).toLocaleString()}</small><p>${esc(item.text)}</p></article>` : `<article class="resource-card">${icon("terminal")}<span><strong>${esc(item.name)}</strong><p>${esc(item.description || "Imported tool")}</p><span class="pill approval">Approval required</span></span></article>`)).join("") : empty("connections", "Nothing to show yet", "Check your token permissions and the resources this connection can access.")}`;
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
  switch (a) {
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
      importExtension();
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
        notify("Welcome to your workspace. Make something good.");
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
        notify("Connection verified. Ready for work.");
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
    case "decide":
      busy(el, true, "Recording");
      await invoke("decide_approval", {
        approvalId: id,
        decision: el.dataset.decision,
      });
      await refresh();
      notify("Decision saved. Your teammate is continuing.");
      break;
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
        notify("Tell your teammate what you’d like done.");
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
        "teammate-preferences.json",
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
      const text = new FormData(event.target).get("manifest");
      if (text.length > 256000)
        throw new Error("Use a manifest smaller than 256 KB.");
      let manifest = JSON.parse(text);
      if (manifest.mcpServers) {
        const entry = Object.entries(manifest.mcpServers).find(
          ([, v]) => v.url,
        );
        if (!entry)
          throw new Error(
            "This config contains command based servers. Start an HTTP bridge, then connect its URL.",
          );
        manifest = { name: entry[0], ...entry[1] };
      }
      const endpoint = manifest.url || manifest.baseUrl;
      if (!endpoint)
        throw new Error("Include a url for the HTTP MCP endpoint.");
      const url = new URL(endpoint);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error(
          "Use an HTTP endpoint without embedded credentials or query strings.",
        );
      connectionForm("mcp");
      sheet.querySelector("[name=baseUrl]").value = url.href;
      sheet.querySelector("[name=label]").value = String(
        manifest.name || "Imported tools",
      ).slice(0, 80);
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
      await refresh();
      notify("Connected and verified. Ready when you are.");
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
      if (!run) notify("Draft saved. Run it when you’re ready.");
    }
  } catch (e) {
    formError(e);
    busy(submitter, false);
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.id === "home-prompt") composerDraft = el.value;
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
        throw new Error("This is not a Teammate preferences export.");
      data.settings = await invoke("save_settings", {
        settings: imported.settings,
      });
      render();
      notify("Your preferences are home.");
    }
  } catch (e) {
    notify(e, true);
  }
});
document.addEventListener("keydown", (e) => {
  const typing = e.target.matches("input,textarea,select,[contenteditable]");
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
    root.innerHTML = `<main class="startup-error"><span class="brand-symbol">${icon("spark")}</span><h1>Your workspace couldn’t open.</h1><p>${esc(e)}</p><p>Use the desktop application to access local storage and connections.</p><button class="button secondary" id="retry-start">${icon("refresh")} Try again</button></main>`;
    document.querySelector("#retry-start").onclick = boot;
  }
}
boot();
