const navItems = [
  ["home", "Home", "M8 3.5 2.8 8v8.7h4.1v-5.1h6.2v5.1h4.1V8L12 3.5"],
  ["bots", "Bots", "M8 7.5V5.8a4 4 0 0 1 8 0v1.7M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM8 13h.01M16 13h.01M9 17h6"],
  ["tasks", "Tasks", "M6 4h12a2 2 0 0 1 2 2v13H4V6a2 2 0 0 1 2-2ZM8 9h8M8 13h8M8 17h5"],
  ["approvals", "Approvals", "M12 3 20 6v5c0 5.1-3.4 8.2-8 10-4.6-1.8-8-4.9-8-10V6l8-3ZM8.5 11.5l2.2 2.2 4.8-5"],
  ["marketplace", "Marketplace", "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
  ["models", "Models", "M12 3 20 7.5 12 12 4 7.5 12 3ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5"],
  ["settings", "Settings", "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.1-1.2L14 3h-4l-.4 2.6a7.7 7.7 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 2.1 1.2L10 21h4l.4-2.6a7.7 7.7 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5A7 7 0 0 0 19 12Z"],
];

const botFaces = { research: "R", operations: "O", code: "C" };
const botClasses = { research: "avatar-research", operations: "avatar-operations", code: "avatar-code" };
const pageTitles = {
  home: ["Good morning!", "Your AI teammates are ready when you are."],
  bots: ["Your bots", "Set up specialized teammates for the work you do."],
  tasks: ["Tasks", "Create work, keep track of it, and review what is waiting."],
  approvals: ["Approvals", "Review consequential actions before a bot takes them."],
  marketplace: ["Marketplace", "Add integrations, routines, and bot templates."],
  models: ["Models", "Choose where each bot gets its intelligence."],
  settings: ["Settings", "Manage your local workspace and app preferences."],
};

let dashboard = { bots: [], tasks: [], approvals: [], queuedCount: 0, completedCount: 0, pendingApprovalCount: 0 };
let currentPage = "home";
let selectedTaskId = null;
let toastTimer;
const appRoot = document.querySelector("#app-root");
const taskDialog = document.querySelector("#new-task-modal");
const toast = document.querySelector("#toast");

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function localFallback() {
  const defaults = {
    bots: [
      { id: "research", name: "Research", role: "Research teammate", description: "Find, analyze, and synthesize information.", modelLabel: "Not connected" },
      { id: "operations", name: "Operations", role: "Operations teammate", description: "Keep recurring work organized and moving.", modelLabel: "Not connected" },
      { id: "code", name: "Code", role: "Software teammate", description: "Build, fix, and improve software.", modelLabel: "Not connected" },
    ],
    tasks: [{ id: "example-task", title: "Research AI meeting note tools", description: "Example task. Connect a model before assigning real work.", botId: "research", botName: "Research", status: "queued", createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000, isDemo: true }],
    approvals: [{ id: "example-approval", taskId: "example-task", taskTitle: "Research AI meeting note tools", botName: "Research", title: "Send recommendation to Product team", target: "product-team@example.com", summary: "Example approval only. No email will be sent.", status: "pending", createdAt: Date.now() / 1000, isDemo: true }],
  };
  try {
    return JSON.parse(localStorage.getItem("teammate-preview-data")) || defaults;
  } catch {
    return defaults;
  }
}

async function invoke(command, args = {}) {
  const nativeInvoke = window.__TAURI__?.core?.invoke;
  if (nativeInvoke) return nativeInvoke(command, args);
  const data = localFallback();
  if (command === "get_dashboard") return { ...data, queuedCount: data.tasks.filter((task) => task.status === "queued").length, completedCount: data.tasks.filter((task) => task.status === "completed").length, pendingApprovalCount: data.approvals.filter((item) => item.status === "pending").length };
  if (command === "create_task") {
    const bot = data.bots.find((item) => item.id === args.botId);
    const task = { id: crypto.randomUUID(), title: args.title, description: args.description, botId: args.botId, botName: bot?.name || "Research", status: "queued", createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000, isDemo: false };
    data.tasks.unshift(task);
    localStorage.setItem("teammate-preview-data", JSON.stringify(data));
    return task;
  }
  if (command === "cancel_task") {
    const task = data.tasks.find((item) => item.id === args.taskId);
    if (!task || !["queued", "running", "paused"].includes(task.status)) throw new Error("This task can no longer be canceled");
    task.status = "canceled";
    localStorage.setItem("teammate-preview-data", JSON.stringify(data));
    return;
  }
  if (command === "decide_approval") {
    const approval = data.approvals.find((item) => item.id === args.approvalId);
    if (!approval?.isDemo) throw new Error("External actions are not connected in this prototype");
    approval.status = args.decision;
    localStorage.setItem("teammate-preview-data", JSON.stringify(data));
    return;
  }
  throw new Error(`Unknown app command: ${command}`);
}

async function refresh() {
  try {
    dashboard = await invoke("get_dashboard");
  } catch (error) {
    dashboard = localFallback();
    showToast(`Could not load local workspace: ${error}`);
  }
  render();
}

function icon(name) {
  const path = navItems.find(([id]) => id === name)?.[2] || "M12 3 20 7.5 12 12 4 7.5 12 3ZM4 12l8 4.5 8-4.5";
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
}

function botAvatar(bot, small = false) {
  const initials = botFaces[bot.id] || esc(bot.name.slice(0, 1));
  return `<span class="${small ? "mini-avatar" : `avatar ${botClasses[bot.id] || ""}`}" aria-hidden="true">${initials}</span>`;
}

function statusLabel(status) {
  return ({ queued: "Queued", running: "In progress", paused: "Paused", completed: "Completed", failed: "Failed", canceled: "Canceled" })[status] || status;
}

function statusPill(status) {
  return `<span class="status-pill status-${esc(status)}">${esc(statusLabel(status))}</span>`;
}

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - Number(timestamp || 0)));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function sidebar() {
  return `<aside class="sidebar">
    <div class="brand"><span class="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15.5 9.4 7M10.6 17 15 9M16.7 17.2 19 13" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3.2"/><circle cx="5" cy="16" r="2" fill="currentColor"/><circle cx="9.5" cy="6" r="2" fill="currentColor"/><circle cx="11" cy="18" r="2" fill="currentColor"/><circle cx="15.2" cy="8" r="2" fill="currentColor"/><circle cx="18.5" cy="13" r="2" fill="currentColor"/></svg></span><span class="brand-copy"><span class="brand-name">Teammate</span><span class="brand-subtitle">Local AI, real work.</span></span></div>
    <p class="nav-label">Workspace</p>
    <nav class="nav-list" aria-label="Main navigation">${navItems.map(([id, label]) => `<button class="nav-item" data-action="navigate" data-page="${id}" ${currentPage === id ? 'aria-current="page"' : ""}><span class="nav-icon">${icon(id)}</span><span class="nav-text">${label}</span>${id === "approvals" && dashboard.pendingApprovalCount ? `<span class="nav-badge">${dashboard.pendingApprovalCount}</span>` : ""}</button>`).join("")}</nav>
    <div class="sidebar-bottom"><div class="workspace-status"><span class="status-dot"></span><div><strong>Local workspace</strong><small>Execution setup needed</small></div><span class="chevron">›</span></div><span class="sidebar-version">Desktop preview · v0.1.0</span></div>
  </aside>`;
}

function notice() {
  return `<section class="notice"><span class="notice-icon">i</span><div><strong>Connect a model to start work</strong><p>Your bots and tasks are saved on this device. Model execution, app integrations, and computer control are the next build stages.</p></div><button class="notice-action" data-action="navigate" data-page="models">Set up models →</button></section>`;
}

function botCard(bot) {
  const task = dashboard.tasks.find((item) => item.botId === bot.id && ["queued", "running", "paused"].includes(item.status));
  return `<article class="bot-card"><div class="bot-card-top">${botAvatar(bot)}<div><h3>${esc(bot.name)}</h3><div class="bot-role">${esc(bot.role)}</div></div></div><p class="bot-description">${esc(bot.description)}</p><div class="bot-card-footer"><span class="model-needed"><span class="tiny-dot"></span>${task ? `Task waiting · ${esc(task.title)}` : "Model setup needed"}</span><button class="text-link" data-action="navigate" data-page="models">Configure</button></div></article>`;
}

function taskTable(tasks, limit = 5) {
  if (!tasks.length) return `<div class="empty-state"><div><strong>No tasks yet</strong><p>Create a task and give one of your bots a goal. It will be saved locally until a model is connected.</p></div></div>`;
  return `<div class="task-table-wrap"><table class="task-table"><thead><tr><th>Task</th><th>Assigned to</th><th>Status</th><th>Updated</th></tr></thead><tbody>${tasks.slice(0, limit).map((task) => `<tr><td><button class="task-title-button" data-action="view-task" data-task="${esc(task.id)}">${esc(task.title)}</button>${task.isDemo ? '<span class="demo-tag">EXAMPLE</span>' : ""}</td><td><span class="task-assignee">${botAvatar({ id: task.botId, name: task.botName }, true)}${esc(task.botName)}</span></td><td>${statusPill(task.status)}</td><td>${relativeTime(task.updatedAt)}</td></tr>`).join("")}</tbody></table></div>`;
}

function homeView() {
  const sorted = [...dashboard.tasks].sort((a, b) => b.updatedAt - a.updatedAt);
  const pending = dashboard.approvals.find((item) => item.status === "pending");
  return `<div class="main-layout"><main class="main-content">
    <header class="topbar"><div><h1>${pageTitles.home[0]}</h1><p>${pageTitles.home[1]}</p></div><div class="topbar-actions"><span class="prototype-pill"><span class="status-dot"></span>Execution setup next</span><button class="button button-primary" data-action="open-new-task"><span class="icon-inline">＋</span>New task</button></div></header>
    ${notice()}
    <section><div class="section-heading"><div><h2>Your team</h2><p>Choose a teammate for the work you want done.</p></div><button class="text-link" data-action="navigate" data-page="bots">Manage team →</button></div><div class="team-grid">${dashboard.bots.map(botCard).join("")}</div></section>
    <section><div class="section-heading"><div><h2>Quick actions</h2><p>Pick up where you left off.</p></div></div><div class="quick-grid">
      <button class="quick-card" data-action="open-new-task"><span class="quick-icon">＋</span><span><strong>New task</strong><small>Give a bot a goal to complete</small></span></button>
      <button class="quick-card" data-action="navigate" data-page="approvals"><span class="quick-icon">✓</span><span><strong>Review approvals</strong><small>${dashboard.pendingApprovalCount} waiting for your review</small></span></button>
      <button class="quick-card" data-action="navigate" data-page="marketplace"><span class="quick-icon">▦</span><span><strong>Browse marketplace</strong><small>Explore integrations and routines</small></span></button>
    </div></section>
    <section><div class="section-heading"><div><h2>Recent tasks</h2><p>${dashboard.queuedCount} queued · ${dashboard.completedCount} completed</p></div><button class="text-link" data-action="navigate" data-page="tasks">View all →</button></div>${taskTable(sorted, 5)}</section>
  </main><aside class="activity-rail"><div class="rail-heading"><h2>Activity</h2><span class="text-link">Local</span></div>
    <section class="rail-section"><h3 class="rail-section-title">Needs your attention <span class="count">${dashboard.pendingApprovalCount}</span></h3>${pending ? `<div class="rail-card"><div class="rail-card-title"><span class="rail-card-icon">!</span><span>${esc(pending.title)}</span></div><p>${esc(pending.summary)}</p><div class="rail-card-action"><button class="button button-quiet button-small" data-action="navigate" data-page="approvals">Review approval</button></div></div>` : `<div class="rail-card"><div class="rail-card-title"><span class="rail-card-icon">✓</span><span>All caught up</span></div><p>New requests will appear here.</p></div>`}</section>
    <section class="rail-section"><h3 class="rail-section-title">Workspace</h3><div class="local-card"><span class="local-icon">⌂</span><span><strong>This device</strong><small>Tasks stored locally</small></span></div><div class="rail-mini">Nothing leaves this device until you connect a cloud model or external integration.</div></section>
  </aside></div>`;
}

function botsView() {
  return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.bots[0]}</h1><p>${pageTitles.bots[1]}</p></div><button class="button button-primary" data-action="navigate" data-page="models">Connect a model</button></header>${notice()}<section class="bot-list">${dashboard.bots.map(botCard).join("")}</section></main>`;
}

function tasksView() {
  const selected = dashboard.tasks.find((task) => task.id === selectedTaskId);
  if (!selected) return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.tasks[0]}</h1><p>${pageTitles.tasks[1]}</p></div><button class="button button-primary" data-action="open-new-task"><span class="icon-inline">＋</span>New task</button></header>${notice()}${taskTable(dashboard.tasks, 100)}</main>`;
  return `<main class="main-content"><header class="page-header"><div><button class="text-link" data-action="clear-task">← Back to tasks</button><h1 style="margin-top:12px">${esc(selected.title)}</h1><p>${esc(selected.description || "No extra details provided.")}</p></div>${statusPill(selected.status)}</header>
    ${selected.isDemo ? `<div class="notice"><span class="notice-icon">i</span><div><strong>Example task</strong><p>This sample shows how tasks appear. Connect a model before assigning real work.</p></div></div>` : notice()}
    <section class="page-card"><div class="task-detail-head"><div><h2>Task activity</h2><p>${esc(selected.botName)} · Created ${relativeTime(selected.createdAt)}</p></div>${["queued", "paused", "running"].includes(selected.status) ? `<button class="button button-danger button-small" data-action="cancel-task" data-task="${esc(selected.id)}">Cancel task</button>` : ""}</div>
      <div class="timeline"><div class="timeline-item"><span class="timeline-mark">1</span><div class="timeline-copy"><strong>Task saved on this device</strong><p>${relativeTime(selected.createdAt)} · It will stay queued until a model is configured.</p></div></div><div class="timeline-item"><span class="timeline-mark timeline-mark-blue">2</span><div class="timeline-copy"><strong>Execution not connected</strong><p>Next: choose a local runtime or add a cloud model API key.</p></div></div></div>
    </section></main>`;
}

function approvalsView() {
  const approvals = dashboard.approvals;
  return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.approvals[0]}</h1><p>${pageTitles.approvals[1]}</p></div></header><div class="notice"><span class="notice-icon">i</span><div><strong>Safe preview</strong><p>Approval controls currently update this local demo only. No external action is connected or will be sent.</p></div></div>${approvals.length ? approvals.map((item) => `<article class="approval-card ${item.status !== "pending" ? "approval-complete" : ""}"><div class="approval-top"><span class="approval-icon">${item.status === "pending" ? "!" : "✓"}</span><div><h2>${item.status === "pending" ? "Approval needed" : `Example ${esc(item.status)}`}</h2><p>${esc(item.botName)} · ${relativeTime(item.createdAt)}${item.isDemo ? ' · <span class="demo-tag">EXAMPLE ONLY</span>' : ""}</p></div></div><div class="approval-target"><small>Proposed action</small><strong>${esc(item.title)}</strong><span>${esc(item.target)}</span></div><p style="margin:0;color:var(--muted);font-size:11px;line-height:1.55">${esc(item.summary)}</p>${item.status === "pending" && item.isDemo ? `<div class="approval-demo-note"><span>i</span><span>This only records a sample decision. No email will be sent.</span></div><div class="approval-actions"><button class="button button-primary button-small" data-action="decide-approval" data-approval="${esc(item.id)}" data-decision="approved">Approve example</button><button class="button button-quiet button-small" data-action="decide-approval" data-approval="${esc(item.id)}" data-decision="rejected">Reject example</button></div>` : ""}</article>`).join("") : `<div class="page-card empty-state"><div><strong>No approvals waiting</strong><p>When a connected bot proposes a sensitive action, you will be able to review it here.</p></div></div>`}</main>`;
}

function modelsView() {
  return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.models[0]}</h1><p>${pageTitles.models[1]}</p></div></header><div class="notice"><span class="notice-icon">i</span><div><strong>Model connections are the next implementation step</strong><p>This first desktop slice stores bots and tasks locally. Cloud API keys will be added through the operating system credential store, and local models will show format and hardware support before download.</p></div></div><section class="page-card"><h2>Local models</h2><p>Download and run compatible models on this device. Download support and runtime support will be shown separately.</p><div class="model-row"><div class="model-provider"><span class="model-provider-mark">L</span><span><strong>Local runtime</strong><small>Not configured yet</small></span></div><span class="status-pill status-paused">Coming next</span></div></section><section class="page-card"><h2>Shared agent tools</h2><p>Every local model will connect to the same agent runtime, so tool access does not depend on a model vendor.</p><div class="catalog-grid"><div class="catalog-tile"><strong>Computer use</strong><p>Controlled desktop actions with per-action permission checks.</p></div><div class="catalog-tile"><strong>Chrome &amp; browser</strong><p>Persistent bot browser sessions, page interaction, and accessible page content.</p></div><div class="catalog-tile"><strong>MCP &amp; plugins</strong><p>Imported tools appear in the shared catalog after permission review.</p></div><div class="catalog-tile"><strong>Files &amp; workspace</strong><p>Bot-scoped files and tools, isolated from your personal folders by default.</p></div></div><div class="settings-row"><span><strong>Vision route</strong><small>Text-only local models can use an optional local vision model to interpret screenshots and images.</small></span><span class="status-pill status-paused">Planned</span></div></section><section class="page-card"><h2>Cloud providers</h2><p>Add your API keys to use hosted models. Keys will be stored in your operating system's secure credential store.</p><div class="catalog-grid"><div class="catalog-tile"><strong>OpenAI-compatible</strong><p>Provider name, endpoint, model, and API key.</p></div><div class="catalog-tile"><strong>Native providers</strong><p>Provider-specific features and tool capabilities.</p></div></div></section></main>`;
}

function marketplaceView() {
  return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.marketplace[0]}</h1><p>${pageTitles.marketplace[1]}</p></div><button class="button button-quiet" disabled>Import catalog</button></header><div class="notice"><span class="notice-icon">i</span><div><strong>Extension system comes after the task core</strong><p>Catalogs will show each publisher, version, source, and requested permissions before install. Native plugin code will not run inside the main app process.</p></div></div><section class="page-card"><h2>Planned catalog types</h2><div class="catalog-grid"><div class="catalog-tile"><strong>Integrations</strong><p>Connect apps and tool servers, starting with MCP.</p></div><div class="catalog-tile"><strong>Bot templates</strong><p>Reusable roles, instructions, and safe defaults.</p></div><div class="catalog-tile"><strong>Routines</strong><p>Repeatable workflows with triggers and approval rules.</p></div><div class="catalog-tile"><strong>Model sources</strong><p>Browse model metadata, license terms, files, and revisions.</p></div></div></section></main>`;
}

function settingsView() {
  return `<main class="main-content"><header class="page-header"><div><h1>${pageTitles.settings[0]}</h1><p>${pageTitles.settings[1]}</p></div></header><section class="page-card"><h2>This device</h2><p>Teammate stores task data in your local application data folder.</p><div class="settings-row"><span><strong>Storage</strong><small>SQLite database with write-ahead logging</small></span><span class="status-pill status-completed">Local</span></div><div class="settings-row"><span><strong>Model execution</strong><small>No model provider or local runtime is connected yet</small></span><span class="status-pill status-queued">Not set up</span></div><div class="settings-row"><span><strong>Desktop build</strong><small>Windows and Linux packaging is configured for the release pipeline</small></span><span class="status-pill status-paused">Preview</span></div></section><section class="page-card"><h2>Privacy by default</h2><p>Bot instructions, tasks, and approvals remain on this device until you connect a cloud model or an external integration. Provider secrets will be isolated from plugin credentials.</p></section></main>`;
}

function render() {
  const content = ({ home: homeView, bots: botsView, tasks: tasksView, approvals: approvalsView, models: modelsView, marketplace: marketplaceView, settings: settingsView })[currentPage] || homeView;
  appRoot.innerHTML = `<div class="app-shell">${sidebar()}${content()}</div>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function openNewTask() {
  const select = document.querySelector("#task-bot");
  select.innerHTML = dashboard.bots.map((bot) => `<option value="${esc(bot.id)}">${esc(bot.name)} — ${esc(bot.role)}</option>`).join("");
  taskDialog.showModal();
  document.querySelector("#task-title").focus();
}

appRoot.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;
  try {
    if (action === "navigate") { currentPage = button.dataset.page; selectedTaskId = null; render(); }
    if (action === "open-new-task") openNewTask();
    if (action === "view-task") { currentPage = "tasks"; selectedTaskId = button.dataset.task; render(); }
    if (action === "clear-task") { selectedTaskId = null; render(); }
    if (action === "cancel-task") {
      await invoke("cancel_task", { taskId: button.dataset.task });
      await refresh();
      showToast("Task canceled and saved locally.");
    }
    if (action === "decide-approval") {
      await invoke("decide_approval", { approvalId: button.dataset.approval, decision: button.dataset.decision });
      await refresh();
      showToast("Example decision saved. No email was sent.");
    }
  } catch (error) {
    showToast(String(error).replace(/^Error: /, ""));
  }
});

document.querySelector("#new-task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const task = await invoke("create_task", { title: form.get("title"), description: form.get("description"), botId: form.get("botId") });
    taskDialog.close();
    event.currentTarget.reset();
    selectedTaskId = task.id;
    currentPage = "tasks";
    await refresh();
    showToast("Task saved locally. Connect a model to start it.");
  } catch (error) {
    showToast(String(error).replace(/^Error: /, ""));
  }
});

refresh();
