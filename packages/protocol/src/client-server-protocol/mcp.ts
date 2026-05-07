/********************************************************************************
 * Copyright (c) 2025-2026 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { AnyObject, hasObjectProp, hasStringProp } from '../utils/type-util';
import { InitializeParameters, InitializeResult } from './types';

/** Wire-protocol naming for the data-handler exposure mode (see {@link McpServerInitOptions.dataMode}). */
export type McpDataMode = 'resources' | 'tools';

/**
 * Behavioral and tuning options that an MCP-aware GLSP client may pass through the
 * `initialize` request. Every field here is safe for the IDE to control per-init: changing
 * any of them cannot widen the network attack surface or relax the DNS-rebinding mitigation.
 *
 * Contrast with {@link McpServerDeployOptions}, which lists fields the adopter sets at
 * deploy time and that are intentionally *not* exposed to init for security reasons. The
 * split limits blast radius: behavioural fields like `port` may be negotiated by the IDE
 * over the wire, while security-sensitive bind/policy fields stay adopter-controlled and
 * cannot be widened by an MCP `initialize` payload.
 *
 * @experimental
 */
export interface McpServerInitOptions {
    /**
     * How the data handlers are exposed to the MCP client. `'tools'` registers them as tools
     * (default — most MCP clients support tools more reliably). `'resources'` registers them
     * as URI-addressable Resources, the spec-aligned form, when the client is known to
     * support it.
     *
     * @default 'tools'
     */
    dataMode?: McpDataMode;
    /**
     * The personality injected into MCP clients by reading the MCP server's instructions.
     */
    agentPersona?: string;
    /**
     * Maximum number of historical SSE events the in-memory event store retains per session.
     * Older events are evicted (LRU by insert order) so memory stays bounded under long-running
     * deployments. Must exceed the worst-case in-flight event count or a client reconnecting
     * with a stale `Last-Event-ID` will find its resume point already evicted.
     *
     * @default 10000
     */
    eventStoreLimit?: number;
}

/**
 * Security-sensitive bind/policy fields the adopter sets at deploy time on the server
 * module. These fields are deliberately *not* part of the wire-protocol init schema — they
 * are not reachable from {@link McpServerConfiguration.options}, and the launcher reads
 * them only from the adopter-supplied defaults. The server-side runtime view that consumers
 * `@inject` (the holder named {@link McpServerOptions}) carries the merged combined shape
 * {@link McpServerOptions} = init ∩ deploy.
 *
 * Why these are deploy-only: an MCP client driven by an LLM should not be able to widen the
 * server's network exposure or weaken its DNS-rebinding mitigation through an `initialize`
 * payload.
 *
 * @experimental
 */
export interface McpServerDeployOptions {
    /**
     * Host/interface the MCP HTTP server binds to. The launcher pins this to loopback by
     * default; an adopter overrides via the server module's `McpServerDefaults` binding when
     * they need a non-loopback bind.
     *
     * @default '127.0.0.1'
     */
    host?: string;
    /**
     * Allowed `Host` header values for the MCP HTTP endpoint. Requests whose `Host` header is
     * not in this list are rejected with `403 Forbidden`. Spec MUST per the Streamable HTTP
     * transport's DNS-rebinding mitigation.
     *
     * @default ['127.0.0.1', 'localhost']
     */
    allowedHosts?: string[];
    /**
     * Allowed `Origin` header values. When set, browser-originating requests with an `Origin`
     * not in this list are rejected with `403 Forbidden`. Leave undefined to skip Origin
     * checking (typical for desktop-IDE MCP clients which omit `Origin`); set explicitly when
     * the deployment is fronted by a browser-based MCP client.
     */
    allowedOrigins?: string[];
    /**
     * Explicit acknowledgement that the operator accepts running an unauthenticated MCP
     * endpoint on a non-loopback bind. The MCP server ships with NO built-in authentication;
     * the default `host: '127.0.0.1'` is the only safe configuration without external
     * fronting. Setting a non-loopback `host` (e.g., `'0.0.0.0'` for "easier dev access")
     * WITHOUT setting this flag causes the launcher to refuse to start with an actionable
     * error.
     *
     * Set to `true` only when an external mechanism (reverse proxy, mTLS, network ACL, etc.)
     * authenticates traffic before it reaches the MCP endpoint. Deploy-only — like the other
     * fields in this type, it is unreachable from the wire.
     *
     * @default false
     */
    acknowledgedNoAuth?: boolean;
}

/**
 * Combined view of MCP server options as seen by the server-side runtime (defaults merged
 * with the init-time overrides). Adopters supplying defaults via the server module's
 * `McpServerDefaults` binding use this shape; per-init overrides use the narrower
 * {@link McpServerInitOptions}.
 *
 * @experimental
 */
export type McpServerOptions = McpServerInitOptions & McpServerDeployOptions;

/** @experimental */
export interface McpServerConfiguration {
    /**
     * The port on which the MCP server should be started. Defaults to `0` (a random available
     * port). The resolved URL is reported in {@link McpInitializeResult.mcpServer.url} and as a
     * tagged log line on the GLSP server's stdout (`[GLSP-MCP-Server]:Ready. ...`) so that
     * IDE integrations can pick it up automatically (mirroring how the GLSP server itself
     * reports its port).
     *
     * Why `port` lives here but `host` lives on {@link McpServerDeployOptions}: an IDE has a
     * legitimate operational reason to pin a specific port (matching its MCP client config),
     * and the security blast radius of port choice is local. `host`, by contrast, controls
     * the bind interface — letting an init payload widen it from loopback would re-open the
     * DNS-rebinding attack pattern that the Host/Origin checks mitigate.
     */
    port?: number;
    /**
     * The route on which the MCP server should be started.
     */
    route?: string;
    /**
     * The name of the MCP server.
     */
    name?: string;
    /**
     * Behavioral and tuning options the IDE may set per init. Security-sensitive bind/policy
     * fields ({@link McpServerDeployOptions}) are intentionally not part of this shape.
     */
    options?: McpServerInitOptions;
}

/** @experimental */
export interface McpInitializeParameters extends InitializeParameters {
    /**
     * MCP server configuration parameters.
     *
     * **Presence is the opt-in signal.** The MCP server is started if and only if this key is
     * defined in the initialize parameters; the value's content controls *how* it is configured.
     * Omitting the key entirely disables MCP. Setting it to an empty object (`{ mcpServer: {} }`)
     * enables MCP with all defaults. A populated object overrides specific fields.
     *
     * @example
     * // Disable MCP (the default for most clients)
     * { applicationId: '...', protocolVersion: '...' }
     *
     * @example
     * // Enable MCP with all defaults
     * { applicationId: '...', protocolVersion: '...', mcpServer: {} }
     *
     * @example
     * // Enable MCP with a custom port
     * { applicationId: '...', protocolVersion: '...', mcpServer: { port: 12345 } }
     */
    mcpServer?: McpServerConfiguration;
}

export namespace McpInitializeParameters {
    /**
     * Type guard that also doubles as the **opt-in check**: returns `true` iff `params.mcpServer`
     * is defined (regardless of its content). Server-side code uses this to decide whether to
     * start the MCP HTTP server at all. See {@link McpInitializeParameters.mcpServer} for the
     * opt-in semantics.
     */
    export function is(params?: InitializeParameters): params is McpInitializeParameters {
        return AnyObject.is(params) && hasObjectProp(params, 'mcpServer');
    }

    /**
     * Returns the {@link McpServerConfiguration} from the given initialize parameters, or
     * `undefined` if MCP is not opted in (i.e., `mcpServer` is missing). A return value of `{}`
     * (an empty object) means "MCP is enabled, use all defaults" — distinct from `undefined`
     * which means "MCP is not enabled."
     */
    export function getServerConfig(params?: InitializeParameters): McpServerConfiguration | undefined {
        return is(params) ? params.mcpServer : undefined;
    }
}

/** @experimental */
export interface McpServerResult {
    /** The name of the MCP server. */
    name: string;

    /** The URL at which the MCP server is accessible. */
    url: string;

    /** Optional headers AI clients should include when connecting. */
    headers?: Record<string, string>;
}

export namespace McpServerResult {
    /** True when the candidate is shaped like {@link McpServerResult}. */
    export function is(candidate: unknown): candidate is McpServerResult {
        return AnyObject.is(candidate) && hasStringProp(candidate, 'name') && hasStringProp(candidate, 'url');
    }
}

/**
 * Initialize-result extension carrying the MCP server's announced URL. Returned by the
 * GLSP server's `initialize` handshake when (and only when) MCP was opted into via
 * {@link McpInitializeParameters.mcpServer}; otherwise the server returns a plain
 * {@link InitializeResult} and callers should narrow with {@link McpInitializeResult.is}.
 *
 * @experimental
 */
export interface McpInitializeResult extends InitializeResult {
    mcpServer: McpServerResult;
}

export namespace McpInitializeResult {
    /** Narrows to `McpInitializeResult` (i.e., asserts `mcpServer` is populated and well-shaped). */
    export function is(result?: InitializeResult): result is McpInitializeResult {
        return AnyObject.is(result) && hasObjectProp(result, 'mcpServer') && McpServerResult.is((result as McpInitializeResult).mcpServer);
    }

    /** Returns the {@link McpServerResult} from the given initialize result, or `undefined` if MCP is not announced. */
    export function getServer(result?: InitializeResult): McpServerResult | undefined {
        return is(result) ? result.mcpServer : undefined;
    }

    /**
     * Attaches an {@link McpServerResult} announcement to a base {@link InitializeResult},
     * returning the augmented {@link McpInitializeResult}. Server-side handshake code uses this
     * instead of an in-place cast to keep the mutation typed.
     */
    export function attachServer(result: InitializeResult, server: McpServerResult): McpInitializeResult {
        const augmented = result as McpInitializeResult;
        augmented.mcpServer = server;
        return augmented;
    }
}
