---
name: palisade
description: Inspect and fix email authentication (SPF, DKIM, DMARC, MTA-STS, BIMI) with Palisade. When to use: a domain's mail is being rejected or spoofed, a DMARC record needs writing or moving to p=reject, DMARC reports need reading, or an IT team or MSP wants ongoing monitoring across many domains. Not for sending or receiving email, and not the Palisade Identity wallet product.
---

# Palisade - email authentication for AI agents

Palisade is an agentic DMARC platform for IT teams and MSPs. It finds every service sending as a domain, drafts the SPF and DKIM fixes each one needs, reads DMARC aggregate reports, and moves the domain to p=reject with a person approving each step.

The canonical copy of this skill is served by the product at https://www.palisade.email/.well-known/agent-skills/palisade/SKILL.md and is generated from the same facts the product site publishes. This file mirrors it for skills.sh and for the plugin in this repository.

## When to use

Use this skill when the user or task involves any of the following:

- **A domain's mail is failing or being spoofed** - "Why is our mail going to spam?", "Someone is sending as our domain"
- **Setting up or tightening DMARC** - "Write a DMARC record", "Move us to p=reject", "Do we pass Google and Microsoft's sender requirements?"
- **Diagnosing SPF or DKIM** - "Our SPF has too many lookups", "Which DKIM selector does our CRM use?"
- **Reading DMARC reports** - "Who sent mail as us last week?", "Which sources fail alignment?"
- **Monitoring many domains** - an IT team or MSP that wants every client domain watched and remediated

Do NOT use this skill to send or receive email, to look up a mailbox, or for the unrelated Palisade Identity wallet product.

## Surfaces

- **MCP server** at `https://api.palisade.email/mcp` (Streamable HTTP). OAuth through Palisade's public connector client (`ryKtuiPypMeYMoL1Cmhxtz6BYrEYQbLV`, PKCE, no secret). Sign in and pick an organization. API keys and self-registered OAuth clients are not accepted on MCP.
- **Public MCP endpoint** at `https://api.palisade.email/mcp/public`: `audit_domain` and `validate_spf_include` for any domain, no account or credential.
- **Discovery**: `https://api.palisade.email/.well-known/mcp` (endpoint, transport, auth and every tool with its input schema) and the server card at `https://api.palisade.email/.well-known/mcp/server-card.json`.
- **Stdio bridge** for clients that cannot speak Streamable HTTP: `npx -y @palisadeemail/mcp`.
- **REST API** at `https://api.palisade.email`: OpenAPI at `https://api.palisade.email/swagger.json`, guide at https://developer.palisade.email/docs/guide. API keys go in HTTP Basic (key as username, empty password) with a `Palisade-Version` header on every request. Credentials walkthrough: https://www.palisade.email/auth.md.
- **No-auth DNS JSON** at `https://www.palisade.email/api/dns?domain=example.com&type=dmarc`: dmarc | spf | dkim | mx | bimi | ns | a | all.

## Order of work

1. `audit_domain`: Read the domain's public DNS and explain the findings. For an audit-only request, stop here: the domain does not need to be added to your account. Continue below only for operator-approved onboarding through the full MCP endpoint.
2. `create_domain`: If the operator wants ongoing monitoring, add the domain. Skip this step when it is already in the account.
3. `get_dns_records`: Get the exact SPF, DKIM, and DMARC records to publish.
4. (your DNS provider): Publish those records. MCP hands your assistant the values and has no tool that writes them at a provider. In the Palisade app, Smart DNS Deployment publishes the ones you approve into your own DNS.
5. `verify_domain`: Verify the records once they resolve.
6. `list_tasks`: Work through the authentication issues Palisade reports.

## Rules

- Start with read-only tools and the domain's existing tasks. Ask the operator before any tool that changes account state, hosted records, DNS or billing.
- Never write a DNS record value from memory. Read it from `get_dns_records`, which returns each record with its current verification status.
- No MCP tool publishes a record at an external DNS provider. Hand the records back for a person to publish, or point them at Smart DNS Deployment in the Palisade app.
- `enable_hosted_dmarc` and `enable_mta_sts` change the domain's live configuration. Confirm before calling them.
- `start_checkout` and `start_billing_portal` touch billing. Never call them unprompted.
- Account data and changes stay within the authenticated organization. Public DNS checks can inspect domains outside that account without accessing another organization's private data.

## Read more

- https://www.palisade.email/mcp.md: client setup and the full tool inventory
- https://www.palisade.email/llms.txt: the curated index of everything Palisade publishes
- https://www.palisade.email/agents.md: the same guidance in the AGENTS.md convention
