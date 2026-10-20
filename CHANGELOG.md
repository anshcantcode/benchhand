# Changelog

All notable changes to Teammate are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/anshcantcode/teammate/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/anshcantcode/teammate/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/anshcantcode/teammate/releases/tag/v0.2.0
