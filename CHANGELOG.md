# Changelog

All notable changes to Benchhand are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `benchhand-terminal`, a console companion that shares the desktop workspace, task engine and approvals. It can list teammates and tasks, run work, follow activity and review decisions.
- Native Anthropic Messages API connections with model discovery, image input, streamed output and tool calls through the existing approval flow.
- Exact-match edits for attached workspace files, reviewed before application and rejected when the original text is no longer unique.
- Animated Benchhand teammate marks with per-teammate colors and reduced-motion support.

### Changed

- Redesigned model connections, task progress and approval review. Approval drafts survive switching between actions, and keyboard approval is limited to the focused review.
- Tool activity records proposed, edited and executed inputs, with secrets redacted before truncation. Long terminal activity logs are paginated.
- Marketplace and Routines can be chosen as the startup page. Rust lint checks run in desktop CI.

### Limits

- These changes are on the development branch and are not included in the v0.4.2 release packages. The terminal requires a desktop session and an unlocked operating system credential store.
- Anthropic's native API adapter has automated mock coverage but has not been tested with a live API key in this development environment.


## [0.4.2] - 2026-10-21

### Added

- Visible model and reasoning-effort selectors for CLI connections, with saved settings, custom model IDs, and model discovery through Codex app-server and OpenCode. Reported catalogs are distinguished from known model choices; account access is checked by the first task.
- Experimental OpenCode, GitHub Copilot CLI and Qwen Code model transports. All six clients appear even before installation, with official installation/sign-in links. Clients and subscriptions are installed and managed separately.
- Codex and Copilot effort overrides, Claude effort and OpenCode variants are sent on each invocation. Gemini and Qwen retain their own configured reasoning defaults.

### Limits

- The development PC passed a live GPT-5.6 Luna / Medium request. Its signed-in Codex CLI rejected GPT-6 Luna as unsupported for that ChatGPT account; a listed ID does not grant provider access.
- OpenCode, Copilot and Qwen adapters have subprocess fixture coverage but no live signed-in verification on this PC. They restrict native tools for transport use; installed client plugins, hooks, configuration and local logs remain subject to that client's behavior. These are not OS sandboxes.
- Copilot context is capped at 24 KB to fit Windows command-line limits. Other CLI transports retain the 2 MB context limit.

## [0.4.1] - 2026-10-21

### Added

- Connect existing local working folders to individual assistants through the native folder picker or a folder path. Relative file tools read and propose edits inside that folder, and each write requires approval. Disconnecting leaves files in place.
- Tasks record their working folder. Folder connections cannot change while that assistant has active tasks, and file operations reject paths that escape the selected root.

### Changed

- New workspaces start with a familiar model choice and one simple task, with optional personalization. Name, theme and advanced connection choices no longer block the first task.
- Core navigation is Overview, Tasks, Models and Folders. Other features are available under More tools.
- CLI connections use sensible defaults; model IDs and executable paths stay in expandable settings. Neutral primary controls and quieter surfaces keep attention on the task.

### Limits

- Working-folder tools handle UTF-8 text files up to 1 MB and list up to 100 entries per directory. Native MCP plugins and computer control have their own permissions; folder path checks are not an OS sandbox for those tools.
- Relevant folder content is sent to the selected model. Choose local inference for local-only processing.


## [0.4.0] - 2026-10-21

### Added

- Signed-in Claude Code, Codex CLI and Gemini CLI model connections, alongside local runtimes and cloud APIs. Automatic installation detection, optional executable paths, per-teammate model selection and clear account/usage failure messages. Credentials stay with each CLI.
- A live task transcript with streamed model output, provider-published reasoning, exact tool inputs and results, turn timing, token usage when supplied, filters and JSON export. Private internal thinking is not exposed.
- Streaming Chat Completions and Responses transports, including an optional request for reasoning summaries on compatible Responses models.

### Changed

- Models is one home for signed-in tools, connected models, local downloads and cloud endpoints, with a direct route to assigning a teammate.
- Refined neutral dark surfaces, clearer model setup and a full-width activity transcript. Expanded tool details and scroll position survive live task refreshes.

### Limitations

- CLI connections require a recent client installed and signed in separately; access and limits depend on the provider. They send text context and use Benchhand tools through structured actions, not the CLI's own tool ecosystem. A configured vision companion can describe images.
- Gemini's adapter is covered by protocol/fixture checks; the live signed-in checks on the development PC cover Claude Code and Codex CLI. CLI subprocesses have a five-minute turn timeout and are stopped on task cancellation.


## [0.3.2] - 2026-10-20

### Changed

- **Teammate is now Benchhand.** The app, installers, tray menu and repository use the new name. Your bots are still called teammates.
- Existing installs keep their tasks, settings, workspaces and saved keys, because the data folder and credential entries are unchanged.
- Plugin bundles still use `teammate.json`, so published plugins keep working.
- Preferences exports are saved as `benchhand-preferences.json`. Exports from Teammate still import.

### Upgrading from Teammate

1. In Teammate, turn off **Open Teammate when I sign in** under Preferences, then quit it from the tray.
2. Install Benchhand. It opens your existing workspace.
3. Uninstall Teammate. On Windows, leave "Delete the application data" unchecked. On Debian and Ubuntu, run `sudo apt remove teammate`.

## [0.3.1] - 2026-10-20

### Added

- **Edit before approving.** Change the values of a proposed action, such as a message, an issue title or a click position, and approve the edited version. Edits keep the same fields and types, the approved inputs are exactly what runs, and the teammate is told what changed.
- **Readable approvals.** Slack messages, GitHub issues and computer actions are shown as they will appear, with the exact inputs one click away.
- **Steps for each run.** A task shows every step it took, which one is in progress, which one waits for you and what is left, all read from the run's own events.

### Changed

- Task pages use two columns: the approval, steps, delegated work and result on the left; details and the activity log on the right.
- Previous decisions show when an approval was edited.

## [0.3.0] - 2026-10-20

### Added

- **Computer control:** screen capture, clicks, typing, key chords, scrolling and dragging on Windows and Linux X11. Access is granted per teammate for a set time, every input action needs approval, and access stops with Ctrl+Alt+Escape, the tray or the app.
- **Plugin marketplace:** featured tools, Official MCP Registry search, signed community catalogs, exact-version review, managed npm installs, stdio and HTTP servers, updates, enable and disable, uninstall, teammate packs and themes.
- **Routines:** once, interval, daily and weekly schedules with IANA time zones, daylight saving handling, missed-run policies, overlap prevention, history and manual runs.
- **Delegation:** teammates find each other and hand off child tasks that run concurrently. A shared turn budget, a three-level depth limit, a 32-child limit and loop detection keep runs bounded.
- **Background work:** an optional tray mode and sign-in startup, so tasks and routines continue with the window closed.
- **Overview timeline:** a "Team, last 24 hours" view with one lane per teammate and a bar for each run, beside a queue of everything waiting on you.
- `npm run preview:sample` serves the interface with sample data, so contributors can work on it without building Rust.
- Contributor guide, code of conduct, security policy, issue forms, pull request template and automated GitHub releases.

### Changed

- **New interface.** A ruled, flat design with Public Sans, a teal accent taken from the app icon, a single accent line for each selection, aligned numbers in every table, and matching dark and light themes. Lists such as tasks, teammates, connections, routines and decisions use one consistent row layout.
- Interface text is plainer and names what each page is for: "Set up your workspace", "Preferences", "Routines" and so on.
- New installs start with a 6px corner radius and a flat background. Existing workspaces that used the previous default accent move to the new one automatically.
- Imported plugin credentials are bound to the source they were reviewed from, and plugin health checks are read-only.

### Fixed

- Publisher text in plugin reviews is always shown as text, never interpreted as HTML.
- MCP requests keep their query string when routed to a server.
- Narrow windows no longer scroll sideways on any page.

## [0.2.0] - 2026-10-20

First desktop preview: guided setup, personalised themes, editable teammates, real task execution with local file workspaces, exact action approvals, local and cloud models through Chat Completions and Responses, the Ollama model library, GitHub and Slack, Streamable HTTP MCP import, Playwright browser setup and the vision companion bridge.

[Unreleased]: https://github.com/anshcantcode/benchhand/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/anshcantcode/benchhand/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/anshcantcode/benchhand/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/anshcantcode/benchhand/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/anshcantcode/benchhand/releases/tag/v0.2.0
