# Changelog

All notable changes to Benchhand are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
