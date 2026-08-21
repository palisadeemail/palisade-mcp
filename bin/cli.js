#!/usr/bin/env node
'use strict';

// Thin stdio<->Streamable-HTTP bridge for the Palisade MCP server.
// Local MCP clients (Claude Code, Cursor, etc.) speak stdio; the Palisade
// server is remote HTTP. We delegate the transport bridging to `mcp-remote`
// and inject the API key as a Bearer header so users only set one env var.

const { spawn } = require('node:child_process');

const apiKey = process.env.PALISADE_API_KEY;
if (!apiKey) {
  process.stderr.write(
    'palisade-mcp: PALISADE_API_KEY is not set.\n' +
      'Create a key at https://app.palisade.email (Settings -> API keys), then set PALISADE_API_KEY.\n' +
      'Docs: https://www.palisade.email/mcp\n',
  );
  process.exit(1);
}

const url = process.env.PALISADE_MCP_URL || 'https://api.palisade.email/mcp';

// `Authorization: Bearer <key>` passed as a single argv element (no shell, so
// the space is preserved literally).
const args = ['-y', 'mcp-remote', url, '--header', `Authorization: Bearer ${apiKey}`];

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (err) => {
  process.stderr.write(`palisade-mcp: failed to start mcp-remote: ${err.message}\n`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code == null ? 0 : code);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
