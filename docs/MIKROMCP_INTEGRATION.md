# MikroMCP integration — Phase 1 (read-only)

## Scope

This phase adds a server-side MikroMCP bridge to NUGA Team Console without enabling any RouterOS mutation.

Implemented:

- MCP Streamable HTTP client inside `server/mikroMcpReadOnlyAdapter.ts`.
- Bearer token kept only in server configuration.
- Lazy MCP `initialize` handshake and session handling.
- Explicit read-tool allowlist:
  - `list_routers`
  - `check_router_health`
  - `get_system_status`
  - `list_interfaces`
- Authenticated NUGA API routes for those reads.
- Mapping from MikroMCP router/system/interface data into the existing `MikroTikRouter` frontend contract.
- Fail-closed handling for unavailable, unauthorized, malformed, oversized, or timed-out MikroMCP responses.
- Configuration validation that allows plaintext HTTP only on loopback; non-loopback endpoints must use HTTPS.
- Tests for configuration, token isolation, router-ID validation, MCP initialization, and WISP mapping.

Not implemented or authorized in this phase:

- RouterOS writes.
- `dryRun` write-tool calls.
- `plan_changes`, `apply_plan`, `rollback_change`, `bulk_execute`, `run_command`, reboot, backup, upgrade, user management, firewall mutation, queue mutation, or any other write/destructive tool.
- Installation of MikroMCP on a real server.
- Enabling RouterOS API/API-SSL on a real router.
- Creating RouterOS users or changing firewall/service rules.
- Production deployment.

## Trust boundary

The browser never talks to MikroMCP directly.

```text
Browser
  -> NUGA Console API (/api/v1/*, session + mode checks)
    -> MikroMCP HTTP /mcp (server-only bearer token)
      -> RouterOS (read-only identity, when separately authorized/configured)
```

DEMO remains unchanged: it performs zero external network calls and does not instantiate this adapter.

## Server-only environment

Never prefix these values with `VITE_` and never commit real values:

```dotenv
NUGA_MIKROMCP_READ_ONLY_ENABLED=false
NUGA_MIKROMCP_URL=http://127.0.0.1:3000/mcp
NUGA_MIKROMCP_TOKEN=
```

Rules enforced by NUGA API:

- Integration is disabled unless `NUGA_MIKROMCP_READ_ONLY_ENABLED=true`.
- Token must contain at least 32 characters when enabled.
- URL must be absolute and point to `/mcp`.
- `http://` is accepted only for `127.0.0.1`, `localhost`, or IPv6 loopback.
- Remote/shared MikroMCP must be reached through HTTPS.
- Credentials embedded in the URL are rejected.

## NUGA API surface

All routes require the existing signed NUGA owner session:

| Route | MikroMCP tool | RouterOS mutation |
| --- | --- | --- |
| `GET /api/v1/mikromcp/routers` | `list_routers` | No |
| `GET /api/v1/mikromcp/routers/:routerId/health` | `check_router_health` | No |
| `GET /api/v1/mikromcp/routers/:routerId/system` | `get_system_status` | No |
| `GET /api/v1/mikromcp/routers/:routerId/interfaces` | `list_interfaces` | No |
| `GET /api/v1/wisp/routers` | composed reads above | No |

No MikroMCP write route exists in this phase.

`GET /api/v1/status` reports `integrations.mikromcp=true` only when the server-side integration is explicitly enabled. `GET /api/v1/capabilities` may then report real-data read capability, but still reports:

- `canRequestDryRun=false`
- `canSubmitApproval=false`
- `canExecuteAuthorizedOperation=false`

## Required MikroMCP identity policy for a future activation

When activation is separately authorized, the NUGA identity should be restricted with MikroMCP RBAC to only the routers NUGA must inspect and only these tool patterns/names:

- `list_routers`
- `check_router_health`
- `get_system_status`
- `list_interfaces`

Do not grant `manage_*`, `apply_*`, `rollback_*`, `run_*`, `bulk_execute`, or wildcard write access in Phase 1.

The MikroMCP service should bind to loopback when it runs on the same host as NUGA Console API. If separated onto another host, place it behind a private/VPN boundary and TLS.

## Future activation gate

Activation is a separate operational phase and requires explicit authorization before any command is executed.

Potential destination: `ramiro@hermes-team-lab`.

Before activation, collect evidence for:

1. Installed MikroMCP version and Node runtime.
2. `mikromcp doctor` result.
3. MikroMCP identity scope (`allowedRouters` and read-only tools) without exposing token hashes/raw tokens.
4. RouterOS dedicated read-only account and source-address restriction.
5. TLS/API-SSL posture for any non-loopback RouterOS/API path.
6. NUGA API configuration with secrets redacted.
7. Validation of the five GET routes above.

Rollback for the activation phase is configuration-only: set `NUGA_MIKROMCP_READ_ONLY_ENABLED=false`, restart only NUGA Console API, and leave RouterOS untouched. Removal of any separately created MikroMCP/RouterOS account must be handled as its own authorized change.
