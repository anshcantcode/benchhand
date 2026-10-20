import readline from "node:readline";
let count = 0;
for await (const line of readline.createInterface({ input: process.stdin })) {
  const message = JSON.parse(line);
  if (!Object.hasOwn(message, "id")) continue;
  const result =
    message.method === "initialize"
      ? {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "Benchhand test fixture", version: "1" },
        }
      : message.method === "tools/list"
        ? {
            tools: [
              {
                name: "echo",
                description: "Returns supplied test text.",
                inputSchema: {
                  type: "object",
                  properties: { text: { type: "string" } },
                  required: ["text"],
                },
              },
            ],
          }
        : {
            content: [
              {
                type: "text",
                text: `${++count}:${message.params.arguments.text}`,
              },
            ],
          };
  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id: message.id, result }) + "\n",
  );
}
