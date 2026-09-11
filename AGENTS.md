# Working in this repository, and using Palisade from an agent

This repository is `@palisadeemail/mcp`, a thin stdio bridge to the remote Palisade MCP server at `https://api.palisade.email/mcp`. It wraps `mcp-remote`, signs in through Palisade's public OAuth client, and holds no product logic of its own. Every file here is synced from the `dns-auditor` monorepo and overwritten on each sync, so change it upstream rather than here.

## What Palisade is for

Palisade inspects and fixes email authentication: SPF, DKIM, DMARC, MTA-STS and BIMI. Use it when a domain's mail is being spoofed or rejected, when a DMARC record needs writing or moving to `p=reject`, when DMARC reports need reading, or when an IT team or MSP wants many domains monitored. It does not send or receive email, and it is not the Palisade Identity wallet product.

The complete guidance for agents lives at https://www.palisade.email/agents.md, and the same text is installable as a skill from `skills/palisade/SKILL.md` in this repository or from https://www.palisade.email/.well-known/agent-skills/palisade/SKILL.md.

## Connecting

- Streamable HTTP clients (Claude Code, claude.ai): connect to `https://api.palisade.email/mcp` with client id `ryKtuiPypMeYMoL1Cmhxtz6BYrEYQbLV` and callback port `8765`. No secret.
- Stdio-only clients (Codex, Cursor, Windsurf): `npx -y @palisadeemail/mcp`, or the `mcp.json` in this repository.
- Auditing a domain with no account: `https://api.palisade.email/mcp/public` carries `audit_domain` and `validate_spf_include`.
- API keys are not accepted on MCP. They remain the REST credential; see https://www.palisade.email/auth.md.

## Order of work

1. `audit_domain`: read the domain's public DNS and explain the findings. For an audit-only request, stop here.
2. `create_domain`: only when the operator wants ongoing monitoring and the domain is not already in the account.
3. `get_dns_records`: the exact SPF, DKIM and DMARC records to publish.
4. Publish those records at the DNS provider. No tool in this server writes at a provider; hand the values back, or point the operator at Smart DNS Deployment in the Palisade app.
5. `verify_domain` once the records resolve.
6. `list_tasks` and work through the authentication issues Palisade reports.

## Rules

- Never write a DNS record value from memory. Read it from `get_dns_records`.
- `enable_hosted_dmarc` and `enable_mta_sts` change a domain's live configuration. Confirm before calling them.
- `start_checkout` and `start_billing_portal` touch billing. Never call them unprompted.
- Account data and changes stay within the organization the operator signed in to.

## Discovery files

- Discovery document: https://api.palisade.email/.well-known/mcp
- Server card with every tool's input schema: https://api.palisade.email/.well-known/mcp/server-card.json
- OpenAPI for the REST API: https://api.palisade.email/swagger.json
- Agent-ready directory entry: https://www.palisade.email/.well-known/ard.json
