# 0.3 validation

Validation performed on Windows x64 and Ubuntu 24.04 x64 on 20 October 2026. Tests use isolated data directories and deterministic local fixtures for writes. No real Slack messages or GitHub issues are published by the test suite.

| Check | Coverage |
| --- | --- |
| Rust suite | 26 Windows checks and 25 Linux checks: settings, database migration, credential storage on Windows, provider adapters, tool parsing, workspace boundaries, model downloads, vision routing, HTTP MCP sessions, persistent stdio sessions, approvals, schedule timing, delegation, and plugin validation. |
| Interface suite | 16 checks: setup, personalization, connections, models, tasks, approvals, marketplace lifecycle, hostile publisher text, routines, computer permissions, keyboard navigation, persistence, and small-window layouts. These tests explicitly mock the native command boundary. |
| Windows native app | Real WebView2 to Rust IPC to local model fixture; workspace file creation, exact approval payload, MCP action, saved result, automatic routine execution, parent/child delegation, signed catalog verification, plugin install/update/disable/enable/theme/uninstall, and OS startup registration with the prior setting restored. |
| Windows native input | Real display/window discovery and JPEG capture; typing, replacement with a key chord, click, pointer movement, drag, and scrolling inside an editor created in the isolated test app. The harness verifies foreground focus before input. The emergency shortcut and permission revocation are exercised. Desktop capture bytes are not committed. |
| Linux native input | Real X11 screen capture and pointer move/click/drag/scroll in an isolated Xvfb display, plus typing and Enter into an isolated terminal fixture. This is separate from browser fixtures. |
| Live ecosystem | Official MCP Registry search and pagination; an exact version of the public memory MCP npm package installed through the managed installer, discovered, and uninstalled. |
| Live GitHub | Account verification and repository listing with an ephemeral process environment credential. Read only. |
| Live browser MCP | Playwright MCP navigation to the local preview, an accessibility snapshot, and browser close, through the real HTTP MCP adapter. |

The model fixture exercises both Chat Completions and Responses request/response handling. It does not establish paid inference quality or compatibility with every cloud vendor. Slack write paths are checked with fixtures, not a live workspace token. Model quality and a model's ability to follow tool instructions remain provider-dependent.

## Reproduce

Install Rust, Node.js 22+, the platform build prerequisites, and the Playwright test browser:

```sh
npm ci
cargo test --manifest-path src-tauri/Cargo.toml
npx playwright install chromium
npm run test:ui
```

After a Windows release build:

```sh
npm run build:windows
npm run test:native
```

The native check downloads a reviewed exact npm package for its live managed-install check. It requires network access, the Windows credential store, and an interactive desktop. It restores the previous OS startup setting and removes its temporary workspace. On a locked or inaccessible desktop, input checks stop at the foreground guard.

The ignored Linux input check requires `xvfb`, `xterm`, and `xdotool` and must run only on an isolated display:

```sh
env -u WAYLAND_DISPLAY XDG_SESSION_TYPE=x11 TEAMMATE_ISOLATED_DISPLAY=1 \
  xvfb-run -a cargo test --manifest-path src-tauri/Cargo.toml \
  computer::tests::native_x11_capture_and_pointer -- --ignored --nocapture
```

Optional GitHub and browser checks use the environment variables and ignored tests documented in the README. Credentials must remain outside source, files, and shell history.

## Platform limits

- Linux packages target Ubuntu 24.04 or an equivalent recent desktop with modern PipeWire, WebKitGTK 4.1, and the relevant runtime libraries. Ubuntu 22.04's PipeWire headers are too old for this capture backend.
- X11 native capture and pointer input are tested. Wayland support depends on compositor protocols and desktop permissions; it is not certified across GNOME, KDE, and every compositor. Unsupported backends return an error; browser tools are available independently.
- Screen understanding requires a vision model or a selected vision companion. Text-only models receive an explicit notice when no vision path is configured.
- Routines require the process to remain open or in the tray and the computer to be awake. They do not wake the computer or run after the process exits.
- MCP servers are separate processes or remote services. They are not sandboxed by the application. Signatures verify catalog authorship, not code safety.
- npm packages can require newer Node versions than the app's build tooling. The review shows declared engine requirements, supports exact version selection for featured packages, and the installer enforces engine requirements.
