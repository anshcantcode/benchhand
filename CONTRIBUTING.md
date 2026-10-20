# Contributing to Benchhand

Thanks for helping. Benchhand is a small codebase on purpose: a Rust core, a framework-free interface and a test suite you can run in under a minute. You can make a useful change in an afternoon.

## Ways to help

- **Report a bug** with the [bug report form](https://github.com/anshcantcode/benchhand/issues/new?template=bug_report.yml). Steps to reproduce and your OS, model and version are the most useful details.
- **Suggest a feature** with the [feature request form](https://github.com/anshcantcode/benchhand/issues/new?template=feature_request.yml). Describe the problem before the solution.
- **Pick up an issue** labelled [`good first issue`](https://github.com/anshcantcode/benchhand/labels/good%20first%20issue) or [`help wanted`](https://github.com/anshcantcode/benchhand/labels/help%20wanted). Comment on it first so nobody duplicates work.
- **Improve the docs.** If something in the [user guide](docs/USER_GUIDE.md) confused you, a fix is a great first pull request.
- **Publish a plugin** for the marketplace. See the [plugin guide](docs/PLUGINS.md).

For a large change, such as a new integration, a new model protocol or a change to the approval policy, open an issue to agree on the approach before you write the code.

## Set up

You need Rust stable, Node.js 22+ and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS. On Linux, the packages are listed in [the CI workflow](.github/workflows/desktop.yml).

```sh
git clone https://github.com/anshcantcode/benchhand.git
cd benchhand
npm ci                 # also copies vendored scripts and fonts into frontend/vendor
npm run dev            # starts the desktop app with live reload of the frontend
```

To work on the interface without building Rust, run `npm run preview:sample` and open http://127.0.0.1:4173. It serves the frontend with sample teammates, tasks and approvals from `scripts/preview-sample.js`. Add `?page=tasks&task=t-triage&theme=light` to jump to a view.

## Project layout

| Path | Purpose |
| --- | --- |
| `src-tauri/src/main.rs` | App setup, settings validation, SQLite schema and migrations, IPC commands |
| `src-tauri/src/agent.rs` | The agent loop, tool calls and approval continuation |
| `src-tauri/src/orchestration.rs` | Run queue, delegation trees and routines |
| `src-tauri/src/services.rs` | Model turns plus GitHub, Slack and MCP clients |
| `src-tauri/src/marketplace.rs` | Catalogs, signature checks and plugin installs |
| `src-tauri/src/stdio.rs` | Managed MCP server processes |
| `src-tauri/src/computer.rs`, `desktop.rs` | Native capture and input; tray and autostart |
| `frontend/app.js` | Core views, rendering, navigation and actions |
| `frontend/features.js` | Marketplace, routines, computer control and delegation views |
| `frontend/styles.css` | All styles, with design tokens at the top |
| `tests/app.spec.js` | Playwright interface tests with a mocked native boundary |
| `scripts/` | Vendoring, preview server and native end-to-end checks |

## Check your change

Run both suites before you open a pull request. CI runs the same commands on Windows and Ubuntu.

```sh
npm run test:rust
npx playwright install chromium   # once
npm run test:ui
```

Add or update a test for any behaviour you change. Rust tests live next to the code they cover; interface tests go in `tests/app.spec.js`. Live checks against GitHub or an MCP server are opt-in through environment variables described in [docs/VALIDATION.md](docs/VALIDATION.md). Never commit tokens.

## Code guidelines

**Everywhere**
- Match the style of the code around you. Keep functions small and names plain.
- Never put secrets in logs, prompts, errors or SQLite. Credentials belong in the OS credential store.
- Any action that sends, publishes, deletes or runs external code must go through the approval policy.

**Rust**
- Keep `cargo clippy` free of new warnings.
- Return errors as `Result<_, String>` with a message a person can act on.
- Validate every value that crosses the IPC boundary.

**Frontend**
- No framework and no build step. Views are template strings, and all user text goes through `esc()`.
- The Content Security Policy forbids inline styles and remote assets. Set colours and positions through `data-*` attributes, which `colors()` applies.
- Use the tokens in `styles.css` (`--ground`, `--surface`, `--text`, `--muted`, `--accent` and so on) instead of new colours, and check both themes.
- Write interface text in sentence case, name buttons for what they do, and keep labels short.

## Commits and pull requests

1. Fork the repository and create a branch from `main`, for example `fix/slack-pagination`.
2. Keep each pull request to one change. Small pull requests are reviewed faster.
3. Write commit subjects in the imperative mood, under about 72 characters: `Keep routine history when a teammate is deleted`.
4. Fill in the pull request template, link the issue, and add a screenshot for any visible change.
5. Make sure CI passes. A maintainer will review, may ask for changes, and will merge when it is ready.

By contributing, you agree that your work is licensed under the [Apache-2.0 licence](LICENSE).

## Releases

Maintainers update `CHANGELOG.md`, bump the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`, and push a `vX.Y.Z` tag. CI builds the Windows and Linux packages and publishes the GitHub release with checksums.

## Code of conduct

Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).
