# Security policy

Teammate runs AI models that can call tools on your computer and in your accounts. We take reports about that boundary seriously.

## Supported versions

Teammate is in early releases. Security fixes go into the latest release only.

| Version | Supported |
| --- | --- |
| 0.3.x | Yes |
| Earlier than 0.3 | No |

## Report a vulnerability

**Do not open a public issue.** Report it privately through [GitHub's private vulnerability reporting](https://github.com/anshcantcode/teammate/security/advisories/new).

Please include:

- the affected version and operating system
- the steps to reproduce, or a proof of concept
- what an attacker could achieve

You can expect an acknowledgement within 3 working days and an assessment within 10. We will keep you updated, agree a disclosure date with you, and credit you in the release notes unless you prefer otherwise.

## What is in scope

We especially want to hear about:

- an action that sends, publishes, writes or gives input without passing through an approval
- a model, tool result, web page or plugin changing a teammate's permissions or approval rules (prompt injection that crosses this boundary)
- credentials leaking into prompts, logs, SQLite, exports or error messages
- a teammate reading or writing files outside its workspace
- computer-control access outliving its grant, or surviving a stop
- a catalog or plugin passing signature or version checks it should fail
- script injection in the interface, or a way around its Content Security Policy

## Out of scope

- Behaviour of third-party MCP servers, models or services themselves
- A plugin or MCP server you chose to install doing what its permissions allow. Local servers run with your account's permissions, and the install review says so.
- Model output quality, or a model refusing or failing to follow instructions
- Attacks that need an already compromised user account or machine
