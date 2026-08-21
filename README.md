# @palisadeemail/mcp

Connect an MCP client to the [Palisade Email Authentication MCP](https://www.palisade.email/mcp), which monitors and manages SPF, DKIM, DMARC, MTA-STS, and BIMI for your domains.

Palisade's MCP server is remote (Streamable HTTP at `https://api.palisade.email/mcp`). This package is a thin local bridge for stdio-based clients, using [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) under the hood. Clients that support remote HTTP MCP servers with a bearer token can point at the URL directly and skip this package.

## Get an API key

Create one at [app.palisade.email](https://app.palisade.email) → Settings → API keys, or programmatically via headless signup. See the [developer guide](https://developer.palisade.email/docs/guide).

## Use it

Set `PALISADE_API_KEY` and run:

```bash
PALISADE_API_KEY=secret_... npx -y @palisadeemail/mcp
```

### Client config (stdio)

```json
{
  "mcpServers": {
    "palisade": {
      "command": "npx",
      "args": ["-y", "@palisadeemail/mcp"],
      "env": { "PALISADE_API_KEY": "secret_..." }
    }
  }
}
```

### Direct (clients that support remote HTTP MCP)

```json
{
  "mcpServers": {
    "palisade": {
      "type": "http",
      "url": "https://api.palisade.email/mcp",
      "headers": { "Authorization": "Bearer secret_..." }
    }
  }
}
```

When `headers.Authorization` is set, the client authenticates with that API key and does not fall back to OAuth. The server replies `401` with a `WWW-Authenticate` challenge whenever credentials are missing or rejected, so a bad key surfaces as a connection error rather than silently starting an OAuth flow. The one exception is [API-key-only discovery](#api-key-only-discovery) below, where a client opts out of that challenge on purpose.

### API-key-only discovery

Some MCP directories probe an endpoint before they forward a configured API key. For those
clients, use `https://api.palisade.email/mcp?auth=api-key`. It keeps API-key authentication
enabled but omits the OAuth discovery challenge from an unauthenticated probe. Send the same
`Authorization: Bearer secret_...` header after connecting.

### If the server connects but the Palisade tools are missing

A session that offers only `authenticate` / `complete_authentication` is using an OAuth-based entry, not your API-key entry. The Palisade server has no reduced tool set: any authenticated caller gets the full list under [Tools](#tools). Those two tools come from the client's own pending-OAuth state.

This usually means a same-named server is configured somewhere else and is the one in effect. In Claude Code, `--scope local` applies only to the directory it was run in, and a `palisade` entry in user scope (from a previous OAuth connection) applies everywhere else. Check which entry actually wins:

```bash
claude mcp get palisade
```

The reported scope is the one in effect. If it is not the entry holding your API key, remove the other one, for example `claude mcp remove palisade -s user`, or give the API-key entry a distinct name.

## Tools

Accounts (`get_account`), domains (`list_domains`, `get_domain`, `add_domain`, `remove_domain`, `verify_domain`), DNS setup (`get_dns_records` — the exact records to publish at your own DNS provider), MTA-STS (`get_mta_sts`, `enable_mta_sts`), remediation tasks (`list_tasks`, `get_task`), groups (`list_groups`), and billing (`get_subscription`, `start_checkout`, `get_billing_portal_url`).

Palisade tells you which DNS records to publish; you apply them at whatever DNS provider hosts the domain. Payment happens on Stripe-hosted pages.

## Environment

- `PALISADE_API_KEY` (required) — your Palisade API key.
- `PALISADE_MCP_URL` (optional) — override the server URL (defaults to `https://api.palisade.email/mcp`).
