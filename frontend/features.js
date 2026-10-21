let marketSource = "featured",
  marketQuery = "",
  marketEntries = [],
  marketCursor = "",
  marketLoaded = false,
  marketBusy = false,
  marketError = "",
  marketTab = "discover",
  pluginPlan = null,
  pluginInitialValues = {},
  computerImage = null,
  desktopStatus = null,
  remoteStatus = null,
  remotePairing = null;
const emptyState = (title, body, ic) => empty(ic, title, body);
const localTime = (ts) =>
  ts ? new Date(ts * 1000).toLocaleString() : "No next run";
function marketplaceView() {
  const sources = data.pluginSources || [
    { id: "featured", label: "Featured tools" },
    { id: "registry", label: "Official MCP Registry" },
  ];
  const installed = data.plugins || [];
  const kindOf = (m) =>
    m.runtime ? "Tool server" : m.theme ? "Theme" : "Teammate pack";
  return `${heading("Marketplace", "MCP servers, teammate packs and themes. Review the publisher, version and access before anything installs.", `<button class="button secondary" data-action="plugin-sources">${icon("connections")} Catalogs</button>${button("import-extension", "Import plugin", "upload")}`)}
  <div class="filter-toolbar"><div class="tabs" role="tablist">${["discover", "installed"].map((t) => `<button class="tab ${marketTab === t ? "active" : ""}" role="tab" aria-selected="${marketTab === t}" data-action="market-tab" data-id="${t}">${t === "discover" ? "Discover" : `Installed <span class="num">${installed.length}</span>`}</button>`).join("")}</div>${marketTab === "discover" ? `<form id="market-search" class="market-search"><select id="market-source" aria-label="Catalog">${sources.map((s) => `<option value="${esc(s.id)}" ${marketSource === s.id ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select><label class="search-field">${icon("search")}<input name="query" type="search" value="${esc(marketQuery)}" placeholder="Search tools and servers" aria-label="Search marketplace"></label><button class="button secondary" ${marketBusy ? "disabled" : ""}>Search</button></form>` : ""}</div>
  ${
    marketTab === "installed"
      ? `<section class="panel">${installed.length ? `<div class="catalog-list">${installed.map((p) => `<article class="catalog-card plugin-row"><div class="catalog-text"><h3>${esc(p.manifest.name)}</h3><p>${esc(p.manifest.description || p.id)}</p><small><span class="num">v${esc(p.manifest.version)}</span> · ${esc(kindOf(p.manifest))} · ${esc(p.source)} · ${plural((p.connectionIds || []).length, "server")} · ${plural((p.botIds || []).length, "teammate template")}</small></div><span class="tag ${p.enabled ? "on" : ""}">${p.enabled ? "Enabled" : "Disabled"}</span><div class="card-actions"><button class="button secondary small" data-action="plugin-toggle" data-id="${esc(p.id)}" data-enabled="${!p.enabled}">${p.enabled ? "Disable" : "Enable"}</button>${p.source !== "local" ? `<button class="text-button" data-action="plugin-review" data-id="${esc(p.id)}" data-source="${esc(p.source)}">Check update</button>` : ""}${p.manifest.theme ? `<button class="text-button" data-action="plugin-theme" data-id="${esc(p.id)}">Apply theme</button>` : ""}<button class="icon-button" title="Uninstall ${esc(p.manifest.name)}" aria-label="Uninstall ${esc(p.manifest.name)}" data-action="plugin-uninstall" data-id="${esc(p.id)}">${icon("trash")}</button></div></article>`).join("")}</div>` : empty("extensions", "No plugins installed", "Install one from Discover, or import a manifest or bundle.")}</section>`
      : `${marketError ? `<div class="callout error">${icon("info")}<span>${esc(marketError)} <button class="text-button" data-action="market-retry">Try again</button></span></div>` : ""}<section class="panel" aria-busy="${marketBusy}">${section(sources.find((s) => s.id === marketSource)?.label || "Results", marketBusy ? "Searching…" : plural(marketEntries.length, "result"), `<button class="text-button" data-action="browser-setup">Connect an existing browser server ${icon("arrow")}</button>`)}<div class="catalog-list">${marketEntries.map((p) => `<article class="catalog-card plugin-row"><div class="catalog-text"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><small>${esc(p.id)} · ${p.version === "catalog" ? "exact version resolved at review" : `<span class="num">v${esc(p.version)}</span>`}</small></div><span class="tag">${marketSource === "registry" ? "Registry" : marketSource === "featured" ? "Featured" : "Signed catalog"}</span><button class="button secondary small" data-action="plugin-review" data-id="${esc(p.id)}" data-source="${esc(marketSource)}">${installed.some((i) => i.id === p.id) ? "Review update" : "Review & install"}</button></article>`).join("")}</div>${marketBusy ? `<div class="loading-state"><span class="loader"></span>Searching ${esc(sources.find((s) => s.id === marketSource)?.label || "the catalog")}…</div>` : !marketEntries.length && !marketError ? empty("search", "No matching plugins", "Try another search or catalog.") : ""}${marketCursor ? `<div class="center-actions"><button class="button secondary" data-action="market-more">Load more</button></div>` : ""}</section>`
  }
  <p class="workspace-note">${icon("approvals")}<span>Registry listings identify publishers; they do not certify code. Local servers run with your account’s permissions, and every imported tool call needs approval.</span></p>`;
}
async function loadMarketplace(more = false) {
  if (marketBusy) return;
  marketBusy = true;
  marketError = "";
  if (!more) marketEntries = [];
  if (page === "extensions") render();
  try {
    const r = await invoke("marketplace_search", {
      source: marketSource,
      query: marketQuery,
      cursor: more ? marketCursor : "",
    });
    marketEntries = more ? [...marketEntries, ...r.entries] : r.entries;
    marketCursor = r.nextCursor || "";
    marketLoaded = true;
  } catch (e) {
    marketError = String(e);
  } finally {
    marketBusy = false;
    if (page === "extensions") render();
  }
}
function pluginSources() {
  openSheet(
    `${dialogHeading("Plugin catalogs", "Add a community catalog with its publisher’s Ed25519 public key. Its detached signature is checked on every read.")}<div class="sheet-body">${(data.pluginSources || []).map((s) => `<div class="source-row"><div><strong>${esc(s.label)}</strong><small>${esc(s.url || "Bundled recommendations · exact npm versions")}</small></div>${!["featured", "registry"].includes(s.id) ? `<button class="icon-button" title="Remove catalog" data-action="source-delete" data-id="${esc(s.id)}">${icon("trash")}</button>` : ""}</div>`).join("")}</div><form id="source-form"><div class="sheet-body"><label class="field"><span>Catalog name</span><input name="label" required maxlength="100"></label><label class="field"><span>Catalog JSON URL</span><input name="url" type="url" required placeholder="https://example.org/catalog.json"></label><label class="field"><span>Publisher public key · base64</span><input name="publicKey" required spellcheck="false"></label><p class="helper">The signature is read from the same URL with .sig appended. Obtain the key directly from a publisher you trust.</p><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button class="button quiet" type="button" data-action="close-sheet">Done</button><button class="button primary">Add catalog</button></div></form>`,
  );
}
function pluginReview(plan) {
  pluginPlan = plan;
  const m = plan.manifest,
    r = m.runtime || {},
    old = (data.plugins || []).find((p) => p.id === m.id);
  const fields = [
    ...(m.fields || []),
    ...(r.environmentVariables || []).map((v) => ({
      ...v,
      required: v.isRequired,
      secret: v.isSecret,
    })),
    ...(r.packageArguments || [])
      .filter((v) => !v.value)
      .map((v, i) => ({
        name: v.name || `arg${i}`,
        description: v.description,
        required: v.isRequired,
        default: v.default,
      })),
  ];
  openSheet(
    `${dialogHeading(esc(m.name), `${old ? "Update to" : "Install"} version ${esc(m.version)} from ${esc(plan.source)}. ${old ? `Installed: ${esc(old.manifest.version)}.` : "Not installed yet."}`)}<form id="plugin-install-form"><div class="sheet-body"><p>${esc(m.description || "")}</p>${old && old.manifest.version === m.version ? '<div class="callout">This version is already installed. Reinstalling refreshes tools and configuration.</div>' : ""}${m.variants?.length > 1 ? `<label class="field"><span>Available transport</span><select id="plugin-variant">${m.variants.map((v, i) => `<option value="${i}" ${JSON.stringify(v) === JSON.stringify(r) ? "selected" : ""}>${v.kind} · ${esc(v.url || v.package || v.command)}</option>`).join("")}</select></label>` : ""}<div class="runtime-review"><h3>What will run</h3><pre>${esc(r.kind === "npm" ? `node · ${r.package}@${r.version}\n${(r.args || []).join(" ")}` : r.kind === "stdio" ? `${r.command} ${(r.args || []).join(" ")}` : r.kind === "http" ? r.url : "Teammate templates / appearance settings")}</pre></div>${r.kind === "npm" ? `<p class="helper">Runtime requirement: ${esc(JSON.stringify(r.engines || {}))}</p>` : ""}${plan.source === "featured" ? `<div class="form-grid"><label class="field"><span>Exact package version</span><input id="plugin-version" value="${esc(r.version)}" maxlength="100"></label><button class="button secondary" type="button" data-action="plugin-version">Review version</button></div>` : ""}<h3>Requested access</h3><ul class="permission-list">${(m.permissions || (r.kind === "stdio" || r.kind === "npm" ? ["Execute third-party code with your user account permissions", "Read local files and use the network", "Every tool call requires approval"] : ["Connect to the configured service", "Every tool call requires approval"])).map((p) => `<li>${icon("approvals")} ${esc(p)}</li>`).join("")}</ul>${fields.map((f) => `<label class="field"><span>${esc(f.description || f.name)}</span><input name="${esc(f.name)}" type="${f.secret ? "password" : "text"}" ${f.required && !old ? "required" : ""} value="${esc(pluginInitialValues[f.name] || f.default || "")}" autocomplete="off"><small class="helper">${esc(f.name)}${old ? " · leave blank to retain a stored credential" : ""}</small></label>`).join("")}${r.kind === "http" ? `<label class="field"><span>Bearer token · optional${old ? " · leave blank to retain" : ""}</span><input name="token" type="password" autocomplete="off"></label>` : ""}<p class="helper">Local servers run as your user account. They are separate processes, not a security sandbox. npm install scripts are disabled. Secrets use your operating system’s credential store.</p><details><summary>Manifest & provenance</summary><pre class="manifest-code">${esc(JSON.stringify(m, null, 2))}</pre><small>Review SHA-256: ${esc(plan.sha256)}</small></details><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button class="button quiet" type="button" data-action="close-sheet">Cancel</button><button class="button primary" type="submit">${icon("download")} ${old ? "Install reviewed update" : "Install plugin"}</button></div></form>`,
    true,
  );
}
async function importManifest(text) {
  let m = JSON.parse(text);
  pluginInitialValues = {};
  if (m.mcpServers) {
    const entries = Object.entries(m.mcpServers);
    if (entries.length !== 1)
      throw new Error(
        "Import one server at a time so its command and access can be reviewed.",
      );
    m = { name: entries[0][0], ...entries[0][1] };
  }
  if (m.runtime || m.bots || m.theme) {
    pluginReview(
      await invoke("import_plugin", {
        manifest: JSON.stringify(m),
        bundle: false,
      }),
    );
    return;
  }
  if (m.command) {
    pluginInitialValues = { environment: m.env || {} };
    const slug = (m.name || "imported-tools")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    m = {
      id: `local/${slug}`,
      name: m.name || "Imported tools",
      version: m.version || "1.0.0",
      description: m.description || "Imported MCP stdio server",
      runtime: { kind: "stdio", command: m.command, args: m.args || [] },
    };
    pluginReview(
      await invoke("import_plugin", {
        manifest: JSON.stringify(m),
        bundle: false,
      }),
    );
    return;
  }
  const endpoint = m.url || m.baseUrl;
  if (!endpoint)
    throw new Error("Include a runtime, MCP command, or HTTP URL.");
  connectionForm("mcp");
  sheet.querySelector("[name=baseUrl]").value = endpoint;
  sheet.querySelector("[name=label]").value = String(
    m.name || "Imported tools",
  ).slice(0, 80);
}
function pluginImport() {
  openSheet(
    `${dialogHeading("Import plugin", "A Teammate manifest, a .teammate.zip bundle, or an MCP server configuration.")}<form id="extension-form"><div class="sheet-body"><label class="field"><span>Choose a manifest or bundle</span><input id="plugin-file" type="file" accept=".json,.zip"></label><label class="field"><span>Or paste JSON</span><textarea name="manifest" rows="10" spellcheck="false" placeholder='{"id":"local/my-tools","name":"My tools","version":"1.0.0","runtime":{"kind":"stdio","command":"node","args":["/path/server.js"]}}'></textarea></label><p class="helper">Supports Streamable HTTP, direct stdio programs, exact npm packages, teammate templates, and themes. Bundles contain teammate.json; runtime code is installed from a pinned package or an explicitly selected executable.</p><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button class="button quiet" type="button" data-action="close-sheet">Cancel</button><button class="button primary">Review plugin ${icon("arrow")}</button></div></form>`,
  );
}
function schedulesView() {
  const routines = data.schedules || [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const when = (c) =>
    c.kind === "interval"
      ? `Every ${duration(c.seconds || 3600)}`
      : c.kind === "once"
        ? "Once"
        : c.kind === "weekly"
          ? `${(c.days || []).map((d) => days[d]).join(", ") || "Weekly"} ${esc(c.time || "")}`
          : `Daily ${esc(c.time || "")}`;
  const active = routines.filter((s) => s.enabled).length;
  return `${heading("Routines", routines.length ? `${plural(active, "routine")} active. Routines run while Benchhand is open or in the tray.` : "Recurring tasks run while Benchhand is open or in the tray.", button("schedule-edit", "New routine", "plus"))}${
    routines.length
      ? `<section class="panel"><div class="list-header routine-header" aria-hidden="true"><span>Routine</span><span>Teammate</span><span>Repeats</span><span>Next run</span><span></span></div>${routines.map((s) => `<article class="routine-card"><div class="routine-name"><h3>${esc(s.name)}</h3><small>${esc(s.title)}${s.config.timezone ? ` · ${esc(s.config.timezone)}` : ""}</small>${s.lastError ? `<small class="error-text">${esc(s.lastError)}</small>` : ""}</div><span class="routine-bot">${esc(data.bots.find((b) => b.id === s.botId)?.name || "Teammate")}</span><span class="subtle">${when(s.config)}</span><span class="num">${s.enabled && s.nextRunAt ? esc(nextRun(s.nextRunAt)) : `<span class="pill paused">Paused</span>`}</span><div class="card-actions"><button class="button secondary small" data-action="schedule-run" data-id="${esc(s.id)}">${icon("play")} Run now</button><button class="text-button" data-action="schedule-edit" data-id="${esc(s.id)}">Edit</button><button class="text-button" data-action="schedule-history" data-id="${esc(s.id)}">History</button><button class="icon-button" title="Delete routine" aria-label="Delete routine" data-action="schedule-delete" data-id="${esc(s.id)}">${icon("trash")}</button></div></article>`).join("")}</section>`
      : `<section class="panel">${empty("schedule", "No routines yet", "A morning research brief, a weekly issue review, a Slack digest. Choose the teammate, timing and context once.", `<button class="button primary" data-action="schedule-edit">Create your first routine</button>`)}</section>`
  }<p class="workspace-note">${icon("schedule")}<span>Missed runs follow each routine’s policy. Routines do not wake a sleeping computer, and approvals still wait for you.</span></p>`;
}
function scheduleForm(id = "") {
  const s = (data.schedules || []).find((s) => s.id === id),
    c = s?.config || {
      kind: "daily",
      time: "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      missed: "run_once",
      days: [1, 2, 3, 4, 5],
    };
  const date = new Date((c.at || Date.now() / 1000 + 3600) * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  openSheet(
    `${dialogHeading(s ? "Edit routine" : "New routine", "Scheduled tasks use the same tools, budgets, approvals and delegation as tasks you start yourself.")}<form id="schedule-form" data-id="${esc(id)}"><div class="sheet-body"><label class="field"><span>Routine name</span><input name="name" required maxlength="100" value="${esc(s?.name || "")}" placeholder="Morning research brief"></label><label class="field"><span>Teammate</span><select name="botId">${data.bots.map((b) => `<option value="${esc(b.id)}" ${s?.botId === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></label><label class="field"><span>Task title</span><input name="title" required maxlength="160" value="${esc(s?.title || "")}"></label><label class="field"><span>Instructions & context</span><textarea name="description" rows="4" maxlength="16000">${esc(s?.description || "")}</textarea></label><div class="form-grid"><label class="field"><span>Repeat</span><select name="kind" id="schedule-kind">${["once", "interval", "daily", "weekly"].map((k) => `<option ${c.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select></label><label class="field"><span>Missed runs</span><select name="missed"><option value="run_once" ${c.missed !== "skip" ? "selected" : ""}>Run once when back</option><option value="skip" ${c.missed === "skip" ? "selected" : ""}>Skip missed runs</option></select></label></div><div data-schedule-kind="once"><label class="field"><span>Date & time · this computer’s time zone</span><input name="at" type="datetime-local" value="${local}"></label></div><div data-schedule-kind="interval"><label class="field"><span>Interval · minutes, minimum 1</span><input name="minutes" type="number" min="1" max="525600" value="${(c.seconds || 3600) / 60}"></label></div><div data-schedule-kind="daily weekly"><div class="form-grid"><label class="field"><span>Local time</span><input name="time" type="time" value="${esc(c.time || "09:00")}"></label><label class="field"><span>IANA time zone</span><input name="timezone" value="${esc(c.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)}" placeholder="Asia/Kolkata"></label></div></div><div data-schedule-kind="weekly" class="weekday-choices">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${(c.days || []).includes(i) ? "checked" : ""}>${d}</label>`).join("")}</div><label class="toggle-field"><input name="enabled" type="checkbox" ${!s || s.enabled ? "checked" : ""}><span>Enable routine</span></label><p class="helper">Only one run per routine is active at a time. Daily and weekly times follow daylight saving changes; missing wall times are skipped and repeated times run once.</p><div class="form-error" role="alert" hidden></div></div><div class="sheet-footer"><button class="button quiet" type="button" data-action="close-sheet">Cancel</button><button class="button primary">Save routine</button></div></form>`,
  );
  scheduleFields();
}
function scheduleFields() {
  const k = sheet.querySelector("#schedule-kind")?.value;
  sheet.querySelectorAll("[data-schedule-kind]").forEach((e) => {
    e.hidden = !e.dataset.scheduleKind.split(" ").includes(k);
  });
}
function computerView() {
  const s = data.settings,
    active = s.computerEnabled && s.computerExpiresAt > Date.now() / 1000;
  return `${heading("Computer control", "Screen capture, clicks, typing, keys, scrolling and dragging, for the teammates you choose and only for as long as you choose.", active ? button("computer-stop", "Stop access", "stop", "", "button danger") : "")}<div class="grid one-two"><section class="panel">${section("Access", "", `<span class="tag ${active ? "on" : ""}">${active ? "Access active" : "Access off"}</span>`)}<form id="computer-access-form" class="panel-body"><p class="subtle">Choose who can see the screen. Mouse and keyboard input is separate, and every input action waits for your approval.</p><div class="bot-access-list">${data.bots.map((b) => `<label class="bot-access"><input type="checkbox" name="botIds" value="${esc(b.id)}" ${(s.computerBotIds || []).includes(b.id) ? "checked" : ""}>${avatar(b)}<span><strong>${esc(b.name)}</strong><small>${esc(b.role)}</small></span></label>`).join("")}</div><label class="toggle-field"><input name="allowInput" type="checkbox" ${s.computerInput ? "checked" : ""}><span>Allow approved mouse and keyboard actions</span></label><label class="field"><span>Access lasts</span><select name="minutes">${[5, 15, 30, 60].map((n) => `<option value="${n}" ${n === 15 ? "selected" : ""}>${n} minutes</option>`).join("")}</select></label>${active ? `<p class="helper">Expires ${esc(localTime(s.computerExpiresAt))}. Access also ends when the app restarts.</p>` : ""}<div class="form-error" role="alert" hidden></div><button class="button primary" type="submit">${icon("key")} ${active ? "Renew reviewed access" : "Enable reviewed access"}</button></form></section><section class="panel computer-preview">${section("Screen preview", "", `<button class="button secondary small" data-action="computer-preview" ${!active ? "disabled" : ""}>${icon("refresh")} Capture screen</button>`)}<div class="panel-body">${computerImage ? `<img class="screen-preview" src="${computerImage.url}" alt="Screen preview captured with your granted access"><p class="helper">Display ${computerImage.displayId} · ${esc(localTime(computerImage.at))}. Captures can include other apps.</p>` : `<div class="screen-empty"><p><strong>No capture yet.</strong> Enable access, then capture a preview. A screenshot reaches a model only when a task uses the screenshot tool.</p></div>`}<label class="toggle-field"><input type="checkbox" data-pref="computerHideWindow" ${s.computerHideWindow ? "checked" : ""}><span>Hide Benchhand briefly during captures and input</span></label></div></section></div><div class="callout">${icon("stop")}<span><strong>Stop at any time</strong> with Ctrl + Alt + Escape, the tray’s “Stop computer control”, or the button above. ${desktopStatus?.desktop?.emergencyShortcut === false ? "The global shortcut is unavailable on this desktop; use the stop button or the tray. " : ""}Reading the screen needs a vision model or a vision companion. On Linux, Wayland depends on desktop portal permissions; X11 is supported.</span></div>`;
}
function advancedSettings() {
  return `<section class="setting-row advanced-preferences"><div class="setting-label"><h2>Runs and background work</h2><p>How many tasks run at once, how far delegation may go, and whether work continues with the window closed.</p></div><div class="setting-panel"><div class="form-grid"><label class="field"><span>Tasks at once</span><input type="number" data-pref="maxConcurrentRuns" min="1" max="8" value="${data.settings.maxConcurrentRuns || 3}"></label><label class="field"><span>Shared turn budget</span><input type="number" data-pref="rootStepBudget" min="1" max="300" value="${data.settings.rootStepBudget || 60}"></label></div><p class="helper">A task and everything it delegates share one turn budget. Delegation goes three levels deep and up to 32 child tasks; loops back to an ancestor are blocked.</p><label class="toggle-field"><input type="checkbox" data-pref="runInBackground" ${data.settings.runInBackground ? "checked" : ""}><span>Keep working in the tray when the window closes</span></label><label class="toggle-field"><input id="autostart-toggle" type="checkbox" ${desktopStatus?.enabled ? "checked" : ""} ${!desktopStatus ? "disabled" : ""}><span>Open Benchhand when I sign in</span></label><p class="helper">${desktopStatus?.desktop?.tray === false ? "No tray is available on this desktop. Closing the window quits Benchhand." : "Quit from the tray to stop background work. Routines do not wake a sleeping computer."}</p></div></section>`;
}
function phoneSettings() {
  const r = remoteStatus,
    on = r?.enabled,
    pairing = remotePairing
      ? `<div class="phone-pairing"><div class="phone-qr" aria-label="Pairing code for the Benchhand app">${remotePairing.qr}</div><div><p><strong>Scan this with the Benchhand app.</strong> Your phone needs Tailscale, signed in to the same account as this computer.</p><p class="helper">The code works once and replaces any phone paired before. It stays on screen until you leave Preferences.</p><label class="field"><span>Or paste this code in the app</span><input id="phone-code" readonly value="${esc(remotePairing.code)}"></label>${button("phone-copy", "Copy code", "", "", "button secondary small")}</div></div>`
      : "";
  const status = !r
    ? `<p class="helper">Checking phone access…</p>`
    : on
      ? `<p>Paired ${esc(localTime(r.pairedAt))}. ${r.lastSeen ? `Last heard from the phone ${esc(localTime(r.lastSeen))}.` : "The phone hasn't connected yet."}</p><p class="helper">Reachable at ${esc(r.address || "no Tailscale address")}, port ${r.port}, from your Tailscale network only.${r.running ? "" : " Phone access isn't running; pair again to restart it."}</p>`
      : `<p>Approve actions, start tasks and run routines from the Benchhand Android app while you're away.</p><p class="helper">Off until you pair a phone. It works over Tailscale, so nothing is opened to the internet.</p>`;
  return `<section class="setting-row phone-access"><div class="setting-label"><h2>Phone</h2><p>Control this computer from the Benchhand app. Every action still needs your approval.</p></div><div class="setting-panel">${status}${pairing}<div class="button-row spaced">${button("phone-pair", on ? "Pair a new phone" : "Pair a phone", "key", "", "button secondary")}${on ? button("phone-off", "Turn off phone access", "stop", "", "button danger") : ""}</div></div></section>`;
}
async function loadRemoteStatus() {
  try {
    remoteStatus = await invoke("remote_status");
  } catch {
    remoteStatus = { enabled: false };
  }
  if (page === "settings") render();
}
function delegationDetail(t) {
  const children = data.tasks.filter((c) => c.parentId === t.id),
    parent = data.tasks.find((p) => p.id === t.parentId);
  return `${parent ? `<div class="callout">${icon("team")}<span>Delegated by ${esc(parent.botName)} from <button class="text-button" data-action="task-detail" data-id="${esc(parent.id)}">${esc(parent.title)}</button></span></div>` : ""}${t.waitingChild ? `<div class="callout">${icon("team")}<span>Waiting for delegated work. Its result returns to this task automatically.</span></div>` : ""}${children.length ? `<section class="panel delegated-panel">${section("Delegated work", plural(children.length, "task"))}${taskRows(children, true)}</section>` : ""}`;
}
async function featureNavigate(next) {
  if (next === "extensions" && !marketLoaded) await loadMarketplace();
  if (next === "settings") {
    remotePairing = null;
    loadRemoteStatus();
  }
  if (["settings", "computer", "schedules"].includes(next) && !desktopStatus) {
    try {
      desktopStatus = await invoke("autostart_status");
      if (page === next) render();
    } catch {}
  }
}
async function featureAction(el) {
  const a = el.dataset.action,
    id = el.dataset.id;
  switch (a) {
    case "import-extension":
      pluginImport();
      return true;
    case "phone-pair":
      busy(el, true, "Making a code…");
      try {
        remotePairing = await invoke("remote_pair");
        remoteStatus = await invoke("remote_status");
        render();
      } catch (e) {
        busy(el, false);
        notify(e, true);
      }
      return true;
    case "phone-off":
      await invoke("remote_disable");
      remotePairing = null;
      remoteStatus = await invoke("remote_status");
      render();
      notify("Phone access is off. The paired phone can no longer connect.");
      return true;
    case "phone-copy": {
      const input = document.getElementById("phone-code");
      try {
        await navigator.clipboard.writeText(input.value);
        notify("Pairing code copied.");
      } catch {
        input.select();
      }
      return true;
    }
    case "market-tab":
      marketTab = id;
      render();
      return true;
    case "market-more":
      await loadMarketplace(true);
      return true;
    case "market-retry":
      await loadMarketplace();
      return true;
    case "plugin-sources":
      pluginSources();
      return true;
    case "source-delete":
      await invoke("delete_plugin_source", { sourceId: id });
      await refresh();
      pluginSources();
      return true;
    case "plugin-review":
      busy(el, true, "Loading review…");
      try {
        pluginInitialValues = {};
        pluginReview(
          await invoke("review_plugin", {
            source: el.dataset.source,
            pluginId: id,
            variant: 0,
          }),
        );
      } finally {
        busy(el, false);
      }
      return true;
    case "plugin-version":
      pluginReview(
        await invoke("review_plugin", {
          source: pluginPlan.source,
          pluginId: pluginPlan.manifest.id,
          variant: 0,
          version: sheet.querySelector("#plugin-version").value,
        }),
      );
      return true;
    case "plugin-toggle":
      await invoke("toggle_plugin", {
        pluginId: id,
        enabled: el.dataset.enabled === "true",
      });
      await refresh();
      return true;
    case "plugin-theme":
      data.settings = await invoke("plugin_theme", { pluginId: id });
      render();
      notify("Plugin theme applied. You can personalize it in Preferences.");
      return true;
    case "plugin-uninstall":
      openSheet(
        `${dialogHeading("Uninstall plugin?", "This removes its tool connections, stored credentials, managed runtime and unused teammate templates. Teammates with history remain.")}<div class="sheet-footer"><button class="button quiet" data-action="close-sheet">Keep plugin</button><button class="button danger" data-action="plugin-remove-confirm" data-id="${esc(id)}">Uninstall plugin</button></div>`,
      );
      return true;
    case "plugin-remove-confirm":
      await invoke("uninstall_plugin", { pluginId: id });
      closeSheet();
      await refresh();
      return true;
    case "schedule-edit":
      scheduleForm(id);
      return true;
    case "schedule-run": {
      const taskId = await invoke("run_schedule_now", { scheduleId: id });
      await refresh();
      await detail(taskId);
      return true;
    }
    case "schedule-delete":
      await invoke("delete_schedule", { scheduleId: id });
      await refresh();
      return true;
    case "schedule-history": {
      const history = await invoke("schedule_history", { scheduleId: id });
      openSheet(
        `${dialogHeading("Routine history", "Every run, including skipped and interrupted ones.")}<div class="sheet-body">${history.map((r) => `<div class="source-row"><div><strong>${r.scheduledFor < 0 ? "Manual run" : esc(localTime(r.scheduledFor))}</strong><small>${esc(r.taskStatus || r.status)} ${esc(r.error || "")}</small></div>${r.taskId ? `<button class="text-button" data-action="schedule-task" data-id="${esc(r.taskId)}">Open task ${icon("arrow")}</button>` : ""}</div>`).join("") || "No runs yet."}</div>`,
      );
      return true;
    }
    case "schedule-task":
      closeSheet();
      await detail(id);
      return true;
    case "computer-stop":
      await invoke("set_computer_access", {
        enabled: false,
        allowInput: false,
        botIds: [],
        minutes: 1,
      });
      computerImage = null;
      await refresh();
      return true;
    case "computer-preview": {
      busy(el, true, "Capturing…");
      try {
        const botId = (data.settings.computerBotIds || [])[0];
        const r = await invoke("computer_preview", { botId, displayId: null });
        const i = r.content.find((c) => c.type === "image");
        computerImage = {
          url: `data:${i.mimeType};base64,${i.data}`,
          displayId: r.displayId,
          at: r.capturedAt,
        };
        render();
      } finally {
        busy(el, false);
      }
      return true;
    }
  }
  return false;
}
document.addEventListener("change", async (event) => {
  const el = event.target;
  try {
    if (el.id === "schedule-kind") scheduleFields();
    if (el.id === "plugin-variant") {
      pluginReview(
        await invoke("review_plugin", {
          source: pluginPlan.source,
          pluginId: pluginPlan.manifest.id,
          variant: Number(el.value),
        }),
      );
    }
    if (el.id === "autostart-toggle") {
      desktopStatus = await invoke("set_autostart", { enabled: el.checked });
      notify("Sign-in preference saved.");
    }
    if (el.id === "market-source") {
      marketSource = el.value;
      marketLoaded = false;
      await loadMarketplace();
    }
  } catch (e) {
    notify(e, true);
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (
    ![
      "market-search",
      "source-form",
      "plugin-install-form",
      "schedule-form",
      "computer-access-form",
    ].includes(form.id)
  )
    return;
  event.preventDefault();
  const values = new FormData(form),
    button = event.submitter;
  busy(
    button,
    true,
    form.id === "plugin-install-form"
      ? "Installing & checking tools…"
      : "Saving…",
  );
  try {
    if (form.id === "market-search") {
      marketQuery = values.get("query");
      marketSource = form.querySelector("#market-source").value;
      await loadMarketplace();
      return;
    }
    if (form.id === "source-form") {
      await invoke("save_plugin_source", Object.fromEntries(values));
      await refresh();
      pluginSources();
      return;
    }
    if (form.id === "plugin-install-form") {
      const config = { ...pluginInitialValues, ...Object.fromEntries(values) };
      Object.keys(config).forEach((k) => {
        if (config[k] === "") delete config[k];
      });
      await invoke("install_plugin", {
        planId: pluginPlan.planId,
        values: config,
      });
      pluginPlan = null;
      pluginInitialValues = {};
      closeSheet();
      marketTab = "installed";
      await refresh();
      notify("Plugin installed and tools verified.");
      return;
    }
    if (form.id === "computer-access-form") {
      data.settings = await invoke("set_computer_access", {
        enabled: true,
        allowInput: values.has("allowInput"),
        botIds: values.getAll("botIds"),
        minutes: Number(values.get("minutes")),
      });
      render();
      notify(
        "Reviewed computer access enabled. Input actions still need approval.",
      );
      return;
    }
    if (form.id === "schedule-form") {
      const kind = values.get("kind"),
        config = { kind, missed: values.get("missed") };
      if (kind === "once")
        config.at = Math.floor(new Date(values.get("at")).getTime() / 1000);
      if (kind === "interval")
        config.seconds = Math.round(Number(values.get("minutes")) * 60);
      if (["daily", "weekly"].includes(kind)) {
        config.time = values.get("time");
        config.timezone = values.get("timezone");
      }
      if (kind === "weekly") config.days = values.getAll("days").map(Number);
      await invoke("save_schedule", {
        schedule: {
          id: form.dataset.id || "",
          name: values.get("name"),
          botId: values.get("botId"),
          title: values.get("title"),
          description: values.get("description"),
          config,
          enabled: values.has("enabled"),
        },
      });
      closeSheet();
      await refresh();
      notify("Routine saved.");
    }
  } catch (e) {
    if (sheet.open) formError(e);
    else notify(e, true);
  } finally {
    busy(button, false);
  }
});
