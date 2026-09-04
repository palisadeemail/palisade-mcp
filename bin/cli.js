#!/usr/bin/env node
'use strict';

// Thin stdio<->Streamable-HTTP bridge for the Palisade MCP server, for clients that only
// speak stdio. Transport bridging is delegated to `mcp-remote`; sign-in goes through
// Palisade's public OAuth client, which asks for the organization on the sign-in page.
// The callback port is fixed because the authorization server registers exact redirect
// URIs, so the same port is pinned here and on the client.

const { spawn } = require('node:child_process');

const url = process.env.PALISADE_MCP_URL || 'https://api.palisade.email/mcp';
const clientId = process.env.PALISADE_MCP_CLIENT_ID || 'ryKtuiPypMeYMoL1Cmhxtz6BYrEYQbLV';
const callbackPort = process.env.PALISADE_MCP_CALLBACK_PORT || '8765';

const args = [
  '-y',
  'mcp-remote',
  url,
  callbackPort,
  '--static-oauth-client-info',
  JSON.stringify({ client_id: clientId }),
  '--static-oauth-client-metadata',
  JSON.stringify({ token_endpoint_auth_method: 'none' }),
];

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
