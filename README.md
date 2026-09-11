# @palisadeemail/mcp

Connect an MCP client to the [Palisade Email Authentication MCP](https://www.palisade.email/mcp), which monitors and manages SPF, DKIM, DMARC, MTA-STS, and BIMI for your domains.

Palisade's MCP server is remote (Streamable HTTP at `https://api.palisade.email/mcp`). This package is a thin local bridge for stdio-based clients, using [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) under the hood. It signs you in through Palisade's public OAuth client: the browser opens, you pick an organization, and the bridge holds a token scoped to it and to your role. There is no API key to create and nothing to configure.

## Use it

```bash
npx -y @palisadeemail/mcp
```

### Client config (stdio)

```json
{
  "mcpServers": {
    "palisade": {
      "command": "npx",
      "args": ["-y", "@palisadeemail/mcp"]
    }
  }
}
```

### Codex

```bash
codex mcp add palisade -- npx -y @palisadeemail/mcp
```

### Claude Code

Claude Code speaks Streamable HTTP itself, so it does not need the bridge. It signs in with the same client, on a fixed callback port:

```bash
claude mcp add --transport http --client-id ryKtuiPypMeYMoL1Cmhxtz6BYrEYQbLV --callback-port 8765 palisade https://api.palisade.email/mcp
```

### claude.ai

Add a custom connector with the URL, Authentication **Always required**, and OAuth client **Use your own OAuth client** with the client ID above and the secret left blank. See the [MCP section of the developer guide](https://developer.palisade.email/docs/guide#mcp).

## What is refused

API keys are not accepted on the MCP endpoint; they remain the credential for the REST API. A client that registers its own OAuth client, through dynamic registration or a client ID metadata document, is refused too: the authorization server cannot attach an organization to such a client, so the endpoint answers `403` and names the client to use instead.

## Without an account

`https://api.palisade.email/mcp/public` needs no sign-in and no Palisade account. It carries only the two tools that read public DNS for any domain, `audit_domain` and `validate_spf_include`; everything that reads or changes an organization's records lives on the signed-in endpoint above. Calls are throttled per client address.

Clients that speak Streamable HTTP connect to it directly:

```bash
claude mcp add --transport http palisade-audit https://api.palisade.email/mcp/public
```

For stdio-only clients, point the bridge at it. The endpoint never asks for a token, so no browser opens:

```json
{
  "mcpServers": {
    "palisade-audit": {
      "command": "npx",
      "args": ["-y", "@palisadeemail/mcp"],
      "env": { "PALISADE_MCP_URL": "https://api.palisade.email/mcp/public" }
    }
  }
}
```

## Sign-in

The bridge listens on `http://localhost:8765/oauth/callback` while you sign in. The port is fixed because the authorization server registers exact redirect URIs; if something else holds that port, free it before connecting.

### If the server connects but the Palisade tools are missing

A session that offers only `authenticate` / `complete_authentication` has not finished signing in. Those two tools come from the client's own pending-OAuth state, not from Palisade; complete the sign-in in the browser and the full list under [Tools](#tools) appears.

This can also mean a same-named server is configured somewhere else and is the one in effect. In Claude Code, `--scope local` applies only to the directory it was run in, and a `palisade` entry in user scope applies everywhere else. Check which entry actually wins:

```bash
claude mcp get palisade
```

## Tools

Accounts (`get_account`), live DNS reads for any domain (`audit_domain`, which scores the full SPF/DKIM/DMARC/BIMI/MTA-STS posture of a domain that need not be in your account, and `validate_spf_include`, which costs an SPF include against the 10-lookup limit before you add it), domains (`list_domains`, `get_domain`, which checks a domain in the account by id or by name, `create_domain`, `update_domain`, `delete_domain`, `verify_domain`), DNS setup (`get_dns_records`, which returns the exact records to publish at your own DNS provider), the remediation plan (`get_domain_plan`, which reports where a domain stands in the DMARC journey and what Palisade works next, including steps it has not opened tasks for yet), SPF diagnostics (`get_spf`, which reads the live record, its DNS lookup count against the 10-lookup limit, and the problems found), hosted DMARC (`enable_hosted_dmarc`), MTA-STS (`get_mta_sts`, `enable_mta_sts`, `disable_mta_sts`), remediation tasks (`list_tasks`, `get_task`, `complete_task`, `dismiss_task`), DMARC reporting (`get_dmarc_summary`, `list_dmarc_senders`, which report aggregate figures and per-source breakdowns rather than raw report XML), groups (`list_groups`, `create_group`, `update_group`, `delete_group`), billing (`get_subscription`, `start_checkout`, `start_billing_portal`), webhooks (`list_webhook_events`, `list_webhook_endpoints`, `create_webhook_endpoint`, `delete_webhook_endpoint`), prospecting reports (`create_prospecting_report`, which audits up to ten domains and returns a hosted PDF link to send a prospect, plus `list_prospecting_reports`, `get_prospecting_report`, `delete_prospecting_report`), DNS provider connections (`list_dns_connections`, `get_dns_connection`, and `get_dns_connection_coverage`, which answers whether Palisade can publish a domain's records itself instead of handing them over to be copied), and the account's activity log (`list_activity_log`, `list_activity_log_actions`).

Every tool that reads or changes Palisade's own records is scoped to the organization you signed in to; `audit_domain` and `validate_spf_include` are the exceptions, taking a domain name rather than an id and reading public DNS for anything.

`create_prospecting_report` also takes bare domain names, and audits every one of them, so it pays into the same live-DNS budget as `audit_domain` once per domain rather than once per report.

Palisade tells you which DNS records to publish; you apply them at whatever DNS provider hosts the domain. Payment happens on Stripe-hosted pages. Webhooks are the alternative to polling for long-running state changes: `create_webhook_endpoint` returns the signing secret once and never again, so store it when it is issued.

## For coding agents

`AGENTS.md` says what Palisade is for, how to connect, the order of work and the rules for write tools. `skills/palisade/SKILL.md` is the same guidance as an installable skill, `plugin.json` is the agent-plugins.org manifest, and `mcp.json` is the stdio client config. The canonical copies are served by the product site: https://www.palisade.email/agents.md and https://www.palisade.email/.well-known/agent-skills/index.json.

## Environment

All optional.

- `PALISADE_MCP_URL` — override the server URL (defaults to `https://api.palisade.email/mcp`).
- `PALISADE_MCP_CLIENT_ID` — override the OAuth client id (defaults to Palisade's public connector client).
- `PALISADE_MCP_CALLBACK_PORT` — override the sign-in callback port (defaults to `8765`; the authorization server must know the port you choose).
