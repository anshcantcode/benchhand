# Plugins and catalogs

Benchhand plugins are declarative manifests. They can provide an MCP server, teammate templates, a theme, or a combination. The desktop app supports Streamable HTTP and local stdio servers. Managed npm servers are installed into a private directory with an exact package version, a lockfile, and install scripts disabled. Direct stdio commands can use Node, Python, uvx, or another executable already installed on your system.

## Install and manage

Open **Marketplace**. Featured recommendations resolve their current npm version before review. The **Official MCP Registry** source supports search and pagination. Registry entries can offer multiple transports; select one in the review. Community catalogs are verified against a publisher public key you add yourself.

Review the source, exact version, program, arguments, permissions, and configuration. **Install plugin** starts the server and discovers its tools before committing the installation. Tokens and environment values go into the OS credential store. Credentials are retained only for updates from the same catalog and runtime identity; a changed HTTP endpoint or header definition requires credentials again. Secret parameters must use environment variables or HTTP headers, rather than URLs or command arguments. Tool calls from imported servers require approval, including read operations.

The **Installed** tab provides enable/disable, update review, theme application, and uninstall. Finish or cancel active work before changing plugins so a pending approval cannot silently target a changed implementation. Updates install a fresh runtime before replacing the current connection. Teammate customization is preserved during updates. Uninstall removes owned connections, secrets, managed files, and unused teammate templates; teammates with task or routine history remain.

Local processes run with your account's file and network permissions. Process isolation is not a security sandbox. A publisher signature authenticates catalog bytes; it does not prove that a plugin is safe. Review the publisher and run programs you trust. Package compatibility depends on the package's runtime requirements; packages that require install scripts may need an explicitly managed local installation and a direct stdio manifest.

## Manifest examples

### Managed npm server

Use an exact published version, replacing the example version with the version you have reviewed:

```json
{
  "id": "your-name/browser",
  "name": "Browser tools",
  "description": "A browser server in a separate profile.",
  "version": "1.0.0",
  "runtime": {
    "kind": "npm",
    "package": "@playwright/mcp",
    "version": "0.0.68",
    "args": []
  },
  "permissions": ["Execute a local browser server", "Read and interact with web pages"]
}
```

For featured tools the app resolves the package version; this example is a format illustration, not a recommendation to use a particular release.

### Existing local server

```json
{
  "id": "your-name/my-tools",
  "name": "My local tools",
  "version": "1.0.0",
  "runtime": {
    "kind": "stdio",
    "command": "node",
    "args": ["/absolute/path/to/server.mjs"],
    "environmentVariables": [
      { "name": "SERVICE_TOKEN", "description": "Service token", "isSecret": true, "isRequired": true }
    ]
  }
}
```

Use an absolute script path on Windows, such as `C:\\tools\\server.mjs`. Commands are spawned directly without a shell. Windows `.cmd` and `.bat` programs must be represented by their actual runtime and script path. A single-entry `mcpServers` configuration with `command`, `args`, and `env` is also accepted; environment values are passed separately to the credential store.

### Remote tools

```json
{
  "id": "your-name/remote-tools",
  "name": "Remote tools",
  "version": "1.0.0",
  "runtime": { "kind": "http", "url": "https://tools.example.org/mcp" }
}
```

Enter a bearer token in the installation form. Registry HTTP header definitions are supported and stored in the credential store. Interactive OAuth login is not implemented; use a service's supported token or a local authenticated bridge. SSE-only legacy servers and OCI packages need a compatible bridge or a direct stdio command.

### Teammate and theme pack

```json
{
  "id": "your-name/studio",
  "name": "Studio pack",
  "description": "An editable writing teammate and a calm workspace theme.",
  "version": "1.0.0",
  "bots": [
    { "name": "Editor", "role": "Writing and revision", "description": "Makes the next draft clearer.", "instructions": "Preserve the author's intent. Explain meaningful edits." }
  ],
  "theme": { "theme": "dark", "accent": "#8bd7b6", "density": "comfortable", "radius": 14 }
}
```

Assign a model to an imported teammate in **Teammates**. Themes can change appearance keys only; they cannot grant computer access, change credentials, or enable background work.

## Bundles

A `.teammate.zip` contains `teammate.json` at its root. It packages the declarative manifest for sharing; runtime code is obtained from a pinned npm package or an explicitly selected installed executable. Arbitrary bundled executables are not extracted or run. The reader rejects unsafe paths, symlinks, oversized manifests, and excessive unpacked sizes. Maximum archive size is 10 MB, maximum unpacked total is 20 MB, and maximum file count is 100.

## Publish a signed catalog

Host a UTF-8 JSON document over HTTPS:

```json
{ "plugins": [ { "id": "your-name/studio", "name": "Studio pack", "version": "1.0.0", "theme": { "accent": "#8bd7b6" } } ] }
```

Sign the exact file bytes with Ed25519. Serve the detached 64-byte signature encoded as base64 at the same URL plus `.sig`. Share the raw 32-byte publisher public key encoded as base64 through a trusted channel. Keep your private key outside the repository and never publish it. The app verifies the signature before parsing or installing entries.

A catalog entry can point to a bundle using `"bundle": {"url":"https://example.org/studio.teammate.zip","sha256":"<lowercase hex digest>"}`. Bundle identity and version must match the signed entry. The SHA-256 digest is verified before the manifest is read. Each source supports up to 500 entries. Localhost HTTP URLs are allowed for development; public sources use HTTPS.

Publish a new version by updating the manifest or bundle, recomputing its digest if needed, and signing the updated catalog bytes. Users choose **Check update** and review the new version before installation. Registry entries use the registry's latest metadata; no plugin updates automatically execute in the background.
