<div align="center">
  <img src="src-tauri/app-icon.svg" width="72" alt="">

  # Benchhand

  **A workspace for AI teammates, built for your computer.**

  Give a teammate a task, follow its work, and review actions that need your decision.

  [Download for Windows or Linux](https://github.com/anshcantcode/benchhand/releases) · [User guide](docs/USER_GUIDE.md) · [Contributing](CONTRIBUTING.md)

  [![Desktop builds](https://github.com/anshcantcode/benchhand/actions/workflows/desktop.yml/badge.svg)](https://github.com/anshcantcode/benchhand/actions/workflows/desktop.yml)
  [![Latest release](https://img.shields.io/github/v/release/anshcantcode/benchhand?include_prereleases&label=release)](https://github.com/anshcantcode/benchhand/releases)
  [![Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-246b58)](LICENSE)
</div>

![Benchhand's Models screen with connected models and teammate assignments](docs/images/models-current.png)

<p align="center"><sub>Current development build with sample data. Screens and features on <code>main</code> can be newer than the latest downloadable release.</sub></p>

## A team that works your way

Benchhand brings models, tasks and tools into one desktop workspace. Create teammates with different roles and instructions, connect the models you want to use, and give them work in your own folders. Tasks can continue in the background, hand work to another teammate, or run on a schedule while the app is running.

- **Choose your models.** Connect an existing signed-in CLI, a local server such as Ollama or LM Studio, an OpenAI-compatible API, or Anthropic's Messages API. Assign a different connection to each teammate.
- **See the work.** Follow recorded progress, streamed model output where available, tool inputs and results, and provider-supplied reasoning summaries. Private internal reasoning is not available.
- **Review actions.** Inspect and edit supported actions before approving them, including attached-folder writes, Slack messages, GitHub issues and imported MCP tool calls.
- **Bring your tools.** Connect GitHub and Slack, discover MCP servers in the marketplace, or import supported HTTP and stdio configurations.
- **Make it yours.** Personalize teammates, colors, theme, layout, text size and motion. Branded teammate marks remain consistent across the workspace.

<table>
  <tr>
    <td><img src="docs/images/task-current.png" alt="A task showing recorded progress and delegated work"></td>
    <td><img src="docs/images/approvals-current.png" alt="An approval queue with a Slack message ready for review"></td>
  </tr>
</table>
<p align="center"><sub>Task and approval examples use sample data.</sub></p>

## Start with one task

1. Install a Windows or Linux package from [Releases](https://github.com/anshcantcode/benchhand/releases). The latest packages are early pre-releases.
2. Open **Models** and connect a signed-in tool, a local server, or a cloud API. For Ollama, you can browse and download models from the app.
3. Give a teammate a small task. Open **Tasks** to follow progress and **Approvals** to review actions.
4. When you need project files, connect a folder under **Folders**. Benchhand asks before its attached-folder tools write or change files.

[Set up models and live activity](docs/MODELS_AND_ACTIVITY.md) · [Connect GitHub, Slack and browser tools](docs/USER_GUIDE.md) · [Explore plugins](docs/PLUGINS.md)

### Run from a terminal

The current development build includes `benchhand-terminal`, a console interface to the same desktop workspace:

```text
benchhand-terminal team
benchhand-terminal run research Summarize the open work in my folder
benchhand-terminal approvals
benchhand-terminal approve <approval-id>
```

Run `benchhand-terminal` without arguments for an interactive session, or `benchhand-terminal help` for commands. It starts the desktop workspace in the background when needed; a desktop session and unlocked OS credential store are required. On Windows, run it from its install folder or add that folder to PATH. See the [terminal guide](docs/USER_GUIDE.md#use-the-terminal). The terminal is included in v0.4.3 and later; v0.4.2 does not include it.

## Models and connections

| Connection | How it works |
| --- | --- |
| **Signed-in tools** | Claude Code, Codex CLI and Gemini CLI use their existing sign-in. OpenCode, GitHub Copilot CLI and Qwen Code adapters are experimental. Install and sign in to each tool separately. |
| **Local models** | Connect an OpenAI-compatible local server such as Ollama or LM Studio. Ollama downloads run through the local runtime. |
| **Cloud APIs** | Connect OpenAI-compatible Chat Completions or Responses endpoints, or use Anthropic's native Messages API. API keys saved in Benchhand use the operating system credential store. |
| **Tools and services** | GitHub and Slack have built-in connections. The marketplace supports MCP HTTP and stdio tools, managed npm installs, signed catalogs, teammate packs and themes. |

Models differ in their ability to follow instructions, call tools and understand images. A vision-capable model or a configured vision companion is needed to interpret screenshots. Provider access, usage limits, charges and model licenses remain subject to the provider. Anthropic's native API integration has automated mock coverage; it has not yet been verified with a live API key in this development environment.

## Designed for review

Approvals show the proposed inputs and let you approve, reject or edit supported actions. Task activity records tool proposals, decisions and results. Computer access is time-limited and selected per teammate, with mouse and keyboard input enabled separately.

Benchhand stores workspace data locally, but a cloud model or connected service receives the context needed for its work. Local storage is not encrypted by the app. Imported MCP servers and other external tools run with their own permissions and are not sandboxed by Benchhand. Review servers and actions before use. On Linux, computer capture and input on Wayland depend on the compositor and desktop portal; X11 is supported. See the [current boundaries](docs/USER_GUIDE.md#current-boundaries).

## Build from source

You need Rust stable, Node.js 22+ and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your operating system.

```sh
npm ci
npm run dev
```

```sh
npm run test:rust       # Rust runtime checks
npm run test:ui         # Install Chromium first: npx playwright install chromium
npm run build:windows   # Windows installer
npm run build:linux     # Debian package and AppImage
```

Packages are written to `src-tauri/target/release/bundle`. The desktop UI is built with Tauri and a Rust core; SQLite stores tasks, events and schedules. See [validation and platform notes](docs/VALIDATION.md), [plugin architecture](docs/PLUGINS.md), and the [product design](PRODUCT_DESIGN.md).

## Contribute

Bug reports, documentation, integrations, model adapters and interface improvements are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) or browse [open issues](https://github.com/anshcantcode/benchhand/issues). Read the [code of conduct](CODE_OF_CONDUCT.md), and report security issues privately as described in [SECURITY.md](SECURITY.md).

Benchhand was formerly called Teammate. Existing installations keep their data; see the [upgrade notes](CHANGELOG.md#upgrading-from-teammate).

## License

[Apache-2.0](LICENSE). Model weights, external tools and services retain their own licenses and terms.
