# Teammate

An open source desktop workspace for AI teammates, built with a Rust runtime and Tauri. Give a teammate a goal, follow its work, review proposed actions, and keep the result on your device.

![Teammate workspace](design/screenshots/overview.png)

## What works in 0.3

- **Guided setup:** name your workspace, choose local or cloud intelligence, connect services, and set your style.
- **Personalization:** dark, light, and system themes; custom accent colors; text size; density; typography; corner radius; compact navigation; reduced motion; start page; preferences import and export.
- **Persistent teammates:** editable names, roles, instructions, colors, individual model connections, and private file workspaces.
- **Real task execution:** native tool calls or a JSON action adapter, task activity, cancellation, bounded runs, saved results, Markdown export, and durable approval continuation.
- **Model choice:** OpenAI compatible Chat Completions and Responses endpoints, including Ollama, LM Studio, OpenRouter, Groq, and OpenAI. Use your own API keys. Responses history preserves reasoning items across tool calls.
- **Local model library:** inspect an Ollama runtime, download supported model tags (including supported Hugging Face GGUF tags), follow progress, cancel, and connect installed models. Ollama must be installed and running separately.
- **GitHub:** verify an account, browse up to 100 accessible repositories, read up to 50 open issues per repository, and create issues after approval.
- **Slack:** verify a workspace, list up to 100 accessible public/private channels, read up to 50 recent messages, and send messages after approval.
- **Native computer use:** discover displays and windows, capture screenshots, click, move, type, press key chords, scroll, and drag. Grant time-limited access to selected teammates; input actions require approval. Revoke access from the app, tray, or Ctrl+Alt+Escape.
- **Plugin marketplace:** featured recommendations, official MCP Registry search and pagination, signed community catalogs, exact-version review, managed npm installs, persistent stdio and HTTP servers, plugin updates, enable/disable, uninstall, teammate packs, and themes. [Plugin and publishing guide](docs/PLUGINS.md).
- **Routines:** once, interval, daily, and weekly schedules with IANA time zones, daylight saving handling, missed-run policies, overlap prevention, durable history, and manual runs.
- **Bot delegation:** teammates discover each other, create durable child tasks, work concurrently within your limit, and receive results automatically. Task trees share a turn budget; ancestor loops, excessive depth, and unbounded fan-out are blocked.
- **Background work:** an optional system tray mode, optional OS sign-in startup, and a single default-workspace instance. Routines and tasks keep running while the window is hidden.
- **Vision bridge:** send MCP tool images directly to an image capable model, or use an explicitly selected vision companion to describe images for text models. No model gains image understanding merely by enabling a setting.
- **Local persistence and credentials:** SQLite stores profiles, tasks, decisions, and connection metadata. Windows Credential Manager / Linux Secret Service stores keys separately.
- **Windows and Linux packages:** Windows NSIS installer; Linux Debian and AppImage packages.

The UI screenshots use illustrative test data. The desktop app starts with editable teammate profiles and your own empty workspace.

## Start using it

1. Install the package for your OS. On Windows the app uses WebView2; the installer can provision the runtime. On Linux use a desktop session with WebKitGTK 4.1 and a working Secret Service keyring.
2. Complete guided setup, or choose **Explore first** and connect services later.
3. For local intelligence, start [Ollama](https://ollama.com/download) or LM Studio. Use **Model library** to download an Ollama model, then **Use this model**. For cloud intelligence, open **Connections** and supply the provider’s API base URL and key.
4. Choose **Discover**, select a model, and verify the connection. The first model is assigned to teammates that do not already have one.
5. Give a teammate a task. Review the activity and any exact action payload in **Approvals**. Results can be copied or exported as Markdown.

For local models without native function calling, try **Structured actions** in the connection’s tool settings. The model must still be capable of following the JSON action instructions. **Text only** disables tool calling.

### GitHub and Slack

GitHub uses a personal access token. Grant metadata and issues read access for the repositories you want to use; add issues write access if you want approved issue creation. Existing token permissions determine what is accessible.

Slack uses a bot or user token. Typical scopes are `channels:read`, `groups:read`, `channels:history`, `groups:history`, and `chat:write`. Invite the app to the channels it should read. Slack workspace policy and token scopes may limit access.

### Computer use

Open **Computer**, select teammates, choose an access duration, and enable screen access. Allow mouse and keyboard separately. Start a task such as “Capture my desktop and describe the open window; ask before interacting.” An image capable model or an explicitly chosen vision companion is required to understand screenshots. Access expires and resets on restart. Ctrl+Alt+Escape and the tray stop control revoke access between actions. The interface reports when the global shortcut is unavailable.

Windows native control works through OS capture and input APIs. Linux X11 is supported. Wayland capture and input depend on your compositor and desktop portals; grant the OS permission when prompted. Secure desktops, elevated windows, and protected content remain subject to operating system restrictions.

### Browser tools and plugins

Open **Marketplace**, select Playwright Browser, and review the exact npm version before installing. Node.js with npm must be installed and visible on PATH. The app manages the server process and browser state. You can also connect an existing Playwright HTTP server or import a stdio configuration, a Teammate JSON manifest, or a manifest bundle.

Use **Installed** to disable, review an update, apply a plugin theme, or uninstall. Add a signed community catalog through **Catalogs**. Read the [plugin and publishing guide](docs/PLUGINS.md) for supported manifests, runtimes, credentials, signatures, and bundles.

### Routines and delegation

Create a routine in **Routines** with a teammate, task context, timing, time zone, and missed-run policy. The app must be running and the computer awake. Enable tray background work and sign-in startup in **Preferences** if desired. Missed occurrences coalesce to one catch-up run or are skipped; concurrent occurrences of the same routine never overlap. External actions still require approval. History links each occurrence to its task.

Teammates can use **team_directory** and **delegate_task** during ordinary tasks. Each child uses its own model and private workspace; its parent must pass the necessary context. Results and failures return automatically. The task detail page shows parent and child links. Canceling a parent cancels active descendants. The shared turn budget, concurrent run limit, three-level depth limit, and 32-child limit keep work bounded.

## Current boundaries

This is an early desktop release with the four core workflows implemented. It does not bundle model inference or model weights. It supports OpenAI compatible model endpoints, rather than every vendor's proprietary protocol. The marketplace supports MCP HTTP and stdio tools, npm runtimes, signed declarative catalogs, teammate packs, and themes; it does not promise compatibility with arbitrary native plugins. Interactive OAuth, legacy SSE-only transports, and OCI package management need a compatible bridge or an explicitly configured local program.

Model quality and tool reliability vary. A weak text model may not reliably perform an agent workflow. A vision companion supplies descriptions, with the usual image interpretation limitations. No inference model is bundled, and downloads follow the model runtime’s supported formats and licenses.

External services and cloud models receive the context needed for the action. A vision companion receives tool images when configured. Local storage is not encrypted by the app; OS key storage protects credentials separately. Workspace path checks are intended to prevent accidental file escape, not to sandbox an untrusted native extension. Imported MCP tools may have broad access on the server; review their inputs and run only servers you trust.

Interrupted direct tasks pause on restart. Interrupted delegated leaf tasks report a failure to their waiting parent; pending approvals and delegation continuations remain durable. An interrupted model download can resume cached layers through Ollama. GitHub/Slack browsing currently shows bounded first pages rather than complete account exports. Disconnecting a connection pauses active task runs. The desktop process must stay open or in its tray for tasks and schedules to continue.

## Build from source

Install Rust stable, Node.js 22+, and the [Tauri platform prerequisites](https://tauri.app/start/prerequisites/). On Windows use the Visual Studio x64 Native Tools prompt with C++ Build Tools and a Windows SDK. Linux needs WebKitGTK 4.1, GTK, DBus development headers, and the packages listed in the CI workflow.

```sh
npm ci
npm run dev
```

```sh
# On Windows
npm run build:windows

# On Linux
npm run build:linux
```

Packages are written to `src-tauri/target/release/bundle`. CI builds Windows x64 and Ubuntu 22.04 x64 packages. Locally built Linux preview packages use Ubuntu 24.04. The Windows bundle uses the system webview and does not ship Chromium. Model weights and separate tool runtimes are additional downloads.

### Checks

```sh
cargo test --manifest-path src-tauri/Cargo.toml
npx playwright install chromium
npm run test:ui
```

Rust checks cover settings, migrations, credential storage, endpoint validation, model adapters, workspace files, image routing, MCP HTTP and stdio sessions, native action validation, plugin signatures and bundle checks, schedule timing and deduplication, delegation loops and cancellation, and full task/approval continuation. Browser UI tests explicitly mock the native command boundary. They cover setup, errors, connections, teammates, tasks, downloads, extensions, vision settings, persistence, keyboard navigation, and responsive layouts.

Optional live checks are ignored by default. `TEAMMATE_TEST_GITHUB_TOKEN` enables the GitHub read-only check; `TEAMMATE_TEST_MCP_URL` plus a local preview enables the browser check. Never put credentials in source or shell history.

After a Windows release build, `npm run test:native` launches the real WebView2 desktop app in an isolated temporary workspace. It checks setup, Rust IPC, a file write, exact approvals, MCP calls, automatic scheduling, parent/child delegation, signed catalogs, stdio installation and update, managed installation of a real npm package, and native screen capture plus keyboard and pointer input in an editor created inside the isolated test app. It does not require a paid model key or change your normal workspace.

### Storage

The default location is the OS application data directory for `dev.localteam.teammate`. To choose a different local workspace, set `TEAMMATE_DATA_DIR` to an absolute directory before launching. This changes the database and file workspace location; credentials remain in the OS credential store.

## License

[Apache-2.0](LICENSE). Model weights, external tools, and services retain their own licenses and terms.
