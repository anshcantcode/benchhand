# Teammate

An open-source, local-first desktop workspace for persistent AI teammates. The Rust app core owns task state and local storage; the UI uses plain HTML, CSS, and JavaScript inside Tauri's system webview to keep the desktop bundle light.

## Current build

This first slice includes the Windows/Linux desktop shell, navigation, local SQLite storage, starter bot profiles, task creation and cancellation, and a clearly marked approval preview. It does not connect to a model or send external actions yet. The Models and Marketplace screens show the next planned integrations rather than pretending those features are active.

The planned shared agent runtime will expose computer use, Chrome/browser control, MCP integrations, and bot-scoped workspace tools to local models through one permission-checked tool catalog. Models that cannot accept images can use an optional local vision model for screenshots; image understanding will require a vision-capable model.

See [PRODUCT_DESIGN.md](PRODUCT_DESIGN.md) for the product and architecture plan, and [design/mockups](design/mockups) for the generated workflow concepts.

## Development

Install Rust (stable MSVC on Windows), Node 22+, and the platform prerequisites for Tauri. Windows builds need Microsoft C++ Build Tools with a Windows SDK and WebView2. Linux builds need WebKitGTK 4.1, GTK, a C/C++ compiler, and the packages listed in the [Tauri prerequisites](https://tauri.app/start/prerequisites/) guide.

```powershell
npm ci
npm run dev
```

Create a release package for the current platform:

```powershell
npm run build:windows
```

```bash
npm ci
npm run build:linux
```

The GitHub Actions workflow builds a Windows NSIS installer and Linux `.deb` and `.AppImage` packages on the matching hosted runners. It runs on pushes to `main`, pull requests, version tags (`v*`), and manual dispatch.

Local preview packages are in `dist/windows` and `dist/linux`. The Linux previews here were built on Ubuntu 24.04 under WSL; release CI is pinned to Ubuntu 22.04.

## Local data

Tasks and approvals are stored in `teammate.sqlite3` under the operating system's application data directory. The seeded approval is explicitly an example; approving or rejecting it only records the local decision and never sends an email.

## License

This project is licensed under Apache-2.0. Model weights, plugin packages, and external services retain their own licenses and terms.
