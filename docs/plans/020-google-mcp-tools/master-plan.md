# Google Workspace MCP Integration Plan for Work Squared Workers

## Overview

This plan defines the phased approach for enabling Work Squared background workers and agentic loops to call Google Workspace via Model Context Protocol (MCP) tools. The immediate goal is to allow drafting Gmail messages and reading Calendar data for user-approved accounts, while preserving long-term extensibility for additional Google APIs. The work assumes the organization continues using the [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) implementation as the primary MCP server and will evaluate self-hosting options so Work Squared workers can access the tools without relying on developer laptops.

## Goals

- Provide a hosted MCP endpoint that Work Squared workers can reach from Cloudflare Workers/Durable Objects without local developer mediation.
- Support OAuth 2.1 flows so each user can grant access to Gmail and Calendar scopes safely, with refresh tokens stored in Work Squared infrastructure.
- Deliver an initial tool set covering Gmail message search, draft creation, Calendar event search/read, and foundation for incremental tool additions.
- Ensure security, compliance, and observability are in place before expanding to wider user cohorts.

## Non-Goals (for this planning cycle)

- Replacing Work Squared's existing MCP client abstractions or rewriting the google_workspace_mcp server.
- Shipping fully automated email sending—draft creation only.
- Building a generalized marketplace for third-party MCP servers (document how to add more later).
- Completing full Google Workspace domain-wide delegation (may be future work if organization obtains domain-wide access).

## Success Criteria

- Hosted MCP instance runs in a managed environment (initially shared staging, then production) with secret management, HTTPS, and health checks.
- At least one background worker can execute Gmail search and draft creation against the hosted service using a sandbox account during automated tests.
- Calendar read tool is callable from LiveStore-driven workflows and returns events scoped to a user's connection.
- Operational runbook exists, covering onboarding, token revocation, incident response, and monitoring.

## Key Dependencies & Inputs

- Agentic loop migration and recurring task orchestration described in prior plans (`014-email-drafting-via-mcp/master-plan.md`).
- Access to Google Cloud project with OAuth consent screen configured for the required scopes (Gmail compose, Gmail read-only, Calendar read-only).
- MCP client library updates in Work Squared to support the HTTP transport and authentication model chosen for the hosted service.
- Secrets management strategy (Cloudflare Workers Secrets / D1 / R2 / Durable Object) for storing per-user refresh tokens securely.

## Phase 0 – Discovery and Compliance Prep

**Outcomes:** Documented architecture decision, validated scopes, and sandbox credentials to unblock engineering.

- **0.1 Requirements Workshop** – Align with product/ops on exact Gmail and Calendar use cases, data retention constraints, minimum viable permissions, and rollout sequencing across workers.
- **0.2 Security & Legal Review** – Confirm Google API Services User Data Policy implications, identify need for external verification if production scopes exceed 100 users, and document least-privilege scope set.
- **0.3 OAuth Project Setup** – Create or update Google Cloud project, configure OAuth consent screen, register redirect URIs that will be reachable from the hosted MCP service, and establish test accounts.
- **0.4 Architecture Evaluation** – Compare hosting options (Cloud Run, Fly.io, self-managed VM) versus colocation with Work Squared infrastructure. Capture latency/egress constraints for Cloudflare Workers to reach the MCP endpoint. Decide on stateless vs. persistent credential store strategy using the server's `WORKSPACE_MCP_STATELESS_MODE` capability.
- **0.5 Access Control Blueprint** – Draft how Work Squared identity (workers/users) maps to Google accounts; determine whether per-user Durable Objects or shared KV namespaces will manage token storage and rate limits.

## Phase 1 – Hosted MCP Prototype (Sandbox Only)

**Outcomes:** Running staging environment, validated OAuth flow, and automated smoke tests.

- **1.1 Containerize Server** – Fork or reference the upstream `google_workspace_mcp` repo, add Dockerfile/CI pipeline if needed, and configure environment variables (`WORKSPACE_MCP_CLIENT_ID`, `WORKSPACE_MCP_CLIENT_SECRET`, `WORKSPACE_MCP_ALLOWED_TOOLS`, `WORKSPACE_MCP_STATELESS_MODE`, etc.).
- **1.2 Deploy to Staging Host** – Deploy to chosen platform (preferred: Google Cloud Run for easy HTTPS + secret integration). Configure IaC or deployment scripts alongside Work Squared infra repos for reproducibility.
- **1.3 Secret & Credential Storage Prototype** – If stateless mode is used, implement server-side callback hooks so tokens are stored in Work Squared infra (e.g., Durable Object keyed by user ID). Otherwise, provision encrypted storage accessible by the MCP host.
- **1.4 OAuth Flow Validation** – Using sandbox accounts, run through the consent screen, capture refresh tokens, and ensure Gmail/Calendar scopes work. Log tokens using staging storage path to confirm encryption and rotation policies.
- **1.5 Smoke Tests & Health Checks** – Build small automated test that runs from CI or a Cloudflare Worker to call the MCP `health-check` (if available) and execute minimal Gmail search/draft flows to verify end-to-end connectivity.

## Phase 2 – Work Squared Worker Integration (MVP)

**Outcomes:** Work Squared background worker can call hosted MCP tools, with guardrails and audit logging.

- **2.1 Worker HTTP Client Adapter** – Extend `packages/worker` MCP client utility (or create one) to authenticate against the hosted MCP endpoint. Support both local dev (tunnel to hosted staging) and production (direct HTTPS) flows.
- **2.2 Tool Registry Alignment** – Enumerate Gmail and Calendar tools, mapping to Work Squared LiveStore events/queries. Update `docs/llm-tools.md` with new tool coverage once implementation begins.
- **2.3 Credential Binding** – Implement handshake so worker includes Work Squared user context when requesting Google tokens (e.g., via Durable Object lookup). Ensure tokens persist between executions and respect per-user isolation.
- **2.4 Agentic Loop Integration** – Connect the hosted tools into the server-side agentic loop described in Phase 1 of prior plan (014). Ensure prompts, retries, and error surfaces capture MCP failures gracefully.
- **2.5 Auditing & Logging** – Ship structured logs from worker and MCP host (request IDs, user ID hash, tool invoked, success/failure) into existing observability pipeline. Mask PII before transmission.
- **2.6 Developer Tooling** – Provide local dev story: script to start MCP host locally or instructions for using staging host via ngrok/Cloudflared. Update `CLAUDE.md`/developer docs as needed.

## Phase 3 – Security Hardening & Multi-User Scaling

**Outcomes:** Production-ready service with isolation, monitoring, and operational runbooks.

- **3.1 Secrets Rotation & Revocation** – Implement automated rotation for Google client secrets and ability to revoke individual refresh tokens on demand. Document process in runbook.
- **3.2 Rate Limiting & Quotas** – Monitor Gmail/Calendar API usage. Add backoff and concurrency controls in worker to respect per-user quotas and Google Workspace domain limits.
- **3.3 Multi-User Token Store** – Finalize durable token storage (likely dedicated Durable Object namespace per workspace). Implement encryption-at-rest and access policies.
- **3.4 Observability Dashboards** – Instrument metrics (latency, error rate, OAuth failures) via chosen APM (e.g., Honeycomb/Datadog). Create alert thresholds for outage scenarios.
- **3.5 Compliance Checklist** – Ensure SOC 2 / GDPR requirements met: data retention policy, user data deletion requests, Google audit logs storage. Verify telemetry adheres to Google API Services terms.
- **3.6 Penetration & Abuse Testing** – Conduct manual review for SSRF injection, token leakage, and unauthorized tool invocation. Add automated tests that simulate malformed requests.

## Phase 4 – Gradual Rollout & Feature Expansion

**Outcomes:** Production launch with controlled cohorts and roadmap for new Google tools.

- **4.1 Beta Cohort Launch** – Invite internal teams to opt-in. Monitor metrics and gather feedback on reliability, latency, and functionality gaps.
- **4.2 Expand Tool Catalog** – Evaluate additional google_workspace_mcp tools (Drive file search, Meet scheduling) and prioritize based on agent demand. Add gating feature flags to toggle tool availability.
- **4.3 Runbook & Handoff** – Finalize operational docs, on-call rotation, and escalation paths. Provide quick-start for customer success to onboard new tenants.
- **4.4 Production Feature Toggles** – Introduce configuration in admin UI to enable Gmail/Calendar per workspace. Ensure deprovisioning (revoking tokens) is as simple as toggling off.
- **4.5 Public Documentation & Demos** – Update product marketing and customer docs to advertise new capabilities. Record demo flows for support knowledge base.

## Risks & Mitigations

- **Google OAuth Verification Delays** – Mitigation: Apply for verification early during Phase 0, keep scopes minimal, and prepare required demo materials.
- **Token Storage Breach** – Mitigation: Encrypt tokens with per-user keys, restrict Durable Object access, run periodic security reviews.
- **API Quota Exhaustion** – Mitigation: Implement per-user and global rate limits plus exponential backoff; request higher quotas once usage patterns are measured.
- **Latency Between Cloudflare and MCP Host** – Mitigation: Choose hosting region close to majority of users and consider multi-region MCP deployments if latency >300ms impacts tool performance.
- **Upstream Repo Changes** – Mitigation: Track google_workspace_mcp releases; pin to tagged version and contribute patches upstream when required.

## Open Questions

1. Should Work Squared extend `google_workspace_mcp` to emit webhook callbacks for token storage, or fork to integrate natively with Durable Objects?
2. What is the strategy for impersonating shared inboxes or delegated mailboxes (if required by customers)?
3. Do we need offline support for agent actions when Google APIs throttle responses (cached event snapshots, queued drafts)?
4. Which team owns long-term maintenance of the hosted MCP service (infra vs. product engineering)?

## References

- `google_workspace_mcp` README – OAuth 2.1 multi-user remote hosting, stateless mode, and supported tools (Gmail, Calendar, Drive).
- Work Squared Plan 014 – Email drafting via MCP groundwork for server-side agentic loop and contact/recurring task systems.
