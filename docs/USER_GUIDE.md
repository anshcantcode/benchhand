# User guide

How to set up Benchhand, connect your accounts and tools, and what to expect from this release. For building from source, see the [README](../README.md#build-from-source).

## First run

1. Install the package for your OS. On Windows the app uses WebView2; the installer can provision the runtime. On Linux use a desktop session with WebKitGTK 4.1 and a working Secret Service keyring.
2. Complete guided setup, or choose **Explore first** and connect services later.
3. For local intelligence, start [Ollama](https://ollama.com/download) or LM Studio. Use **Model library** to download an Ollama model, then **Use this model**. For cloud intelligence, open **Connections** and supply the provider’s API base URL and key.
4. Choose **Discover**, select a model, and verify the connection. The first model is assigned to teammates that do not already have one.
5. Give a teammate a task. Its page shows each step of the run, a details panel and the full activity log. Results can be copied or exported as Markdown.
6. Decide in **Approvals**. Each action is shown as it will appear (a Slack message, a GitHub issue, a click or keystroke), with the exact inputs one click away. Choose **Edit** to change values before approving. The edited inputs are what runs, and the teammate is told what changed.

For local models without native function calling, try **Structured actions** in the connection’s tool settings. The model must still be capable of following the JSON action instructions. **Text only** disables tool calling.

### GitHub and Slack

GitHub uses a personal access token. Grant metadata and issues read access for the repositories you want to use; add issues write access if you want approved issue creation. Existing token permissions determine what is accessible.

Slack uses a bot or user token. Typical scopes are `channels:read`, `groups:read`, `channels:history`, `groups:history`, and `chat:write`. Invite the app to the channels it should read. Slack workspace policy and token scopes may limit access.

### Computer use

Open **Computer**, select teammates, choose an access duration, and enable screen access. Allow mouse and keyboard separately. Start a task such as “Capture my desktop and describe the open window; ask before interacting.” An image capable model or an explicitly chosen vision companion is required to understand screenshots. Access expires and resets on restart. Ctrl+Alt+Escape and the tray stop control revoke access between actions. The interface reports when the global shortcut is unavailable.

Windows native control works through OS capture and input APIs. Linux X11 is supported. Wayland capture and input depend on your compositor and desktop portals; grant the OS permission when prompted. Secure desktops, elevated windows, and protected content remain subject to operating system restrictions.

### Browser tools and plugins

Open **Marketplace**, select Playwright Browser, and review the exact npm version before installing. Node.js with npm must be installed and visible on PATH. The app manages the server process and browser state. You can also connect an existing Playwright HTTP server or import a stdio configuration, a Teammate JSON manifest, or a manifest bundle.

Use **Installed** to disable, review an update, apply a plugin theme, or uninstall. Add a signed community catalog through **Catalogs**. Read the [plugin and publishing guide](PLUGINS.md) for supported manifests, runtimes, credentials, signatures, and bundles.

### Routines and delegation

Create a routine in **Routines** with a teammate, task context, timing, time zone, and missed-run policy. The app must be running and the computer awake. Enable tray background work and sign-in startup in **Preferences** if desired. Missed occurrences coalesce to one catch-up run or are skipped; concurrent occurrences of the same routine never overlap. External actions still require approval. History links each occurrence to its task.

Teammates can use **team_directory** and **delegate_task** during ordinary tasks. Each child uses its own model and private workspace; its parent must pass the necessary context. Results and failures return automatically. The task detail page shows parent and child links. Canceling a parent cancels active descendants. The shared turn budget, concurrent run limit, three-level depth limit, and 32-child limit keep work bounded.

### Phone access

The Android app lets you approve or reject waiting actions, give a teammate a task, and run routines while you are away from the computer. Phone access is off until you pair a phone.

1. Install [Tailscale](https://tailscale.com/download) on the computer and the phone, and sign in to the same account on both.
2. On the computer, open **Preferences → Phone** and choose **Pair a phone**. A QR code and a pairing code appear.
3. In the Android app, scan the QR code or paste the code.

The computer answers only devices on your Tailscale network (and itself), on port 47615. The phone holds a random key; the computer stores only its hash. Choose **Pair a new phone** to replace the key, or **Turn off phone access** to stop answering. The phone checks for new approvals about every 15 minutes, so a notification can arrive up to that long after an action starts waiting. The computer must be on, awake and running Benchhand.

## Where your data lives

The default location is the OS application data directory for `dev.localteam.teammate`. To choose a different local workspace, set `TEAMMATE_DATA_DIR` to an absolute directory before launching. This changes the database and file workspace location; credentials remain in the OS credential store.

## Current boundaries

This is an early desktop release with the four core workflows implemented. It does not bundle model inference or model weights. It supports OpenAI compatible model endpoints, rather than every vendor's proprietary protocol. The marketplace supports MCP HTTP and stdio tools, npm runtimes, signed declarative catalogs, teammate packs, and themes; it does not promise compatibility with arbitrary native plugins. Interactive OAuth, legacy SSE-only transports, and OCI package management need a compatible bridge or an explicitly configured local program.

Model quality and tool reliability vary. A weak text model may not reliably perform an agent workflow. A vision companion supplies descriptions, with the usual image interpretation limitations. No inference model is bundled, and downloads follow the model runtime’s supported formats and licenses.

External services and cloud models receive the context needed for the action. A vision companion receives tool images when configured. Local storage is not encrypted by the app; OS key storage protects credentials separately. Workspace path checks are intended to prevent accidental file escape, not to sandbox an untrusted native extension. Imported MCP tools may have broad access on the server; review their inputs and run only servers you trust.

Interrupted direct tasks pause on restart. Interrupted delegated leaf tasks report a failure to their waiting parent; pending approvals and delegation continuations remain durable. An interrupted model download can resume cached layers through Ollama. GitHub/Slack browsing currently shows bounded first pages rather than complete account exports. Disconnecting a connection pauses active task runs. The desktop process must stay open or in its tray for tasks and schedules to continue.
