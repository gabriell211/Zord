import { z } from "zod";

const envelopeSchema = z.object({
    result: z.unknown().optional(),
    error: z.unknown().optional(),
});

const erpSessionSchema = z.object({
    uid: z.number().int().positive(),
    name: z.string().optional(),
    username: z.string().optional(),
    user_context: z.object({ lang: z.string().optional() }).optional(),
});

export type ErpSession = z.infer<typeof erpSessionSchema>;

export class ErpConnectionError extends Error {
    constructor() {
        super("Serviço de gestão indisponível.");
        this.name = "ErpConnectionError";
    }
}

export class ErpRequestError extends Error {
    constructor() {
        super("A operação não pôde ser concluída no serviço de gestão.");
        this.name = "ErpRequestError";
    }
}

export function isErpConfigured(): boolean {
    return Boolean(process.env.ZORD_ERP_URL && process.env.ZORD_ERP_DB);
}

function erpUrl(path: string): string {
    const base = process.env.ZORD_ERP_URL;
    if (!base) throw new ErpConnectionError();

    let url: URL;
    try {
        url = new URL(base);
    } catch {
        throw new ErpConnectionError();
    }
    const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
        throw new ErpConnectionError();
    }
    if (url.username || url.password || url.search || url.hash) {
        throw new ErpConnectionError();
    }
    return new URL(path, url).toString();
}

function setCookieSession(headers: Headers): string | null {
    const cookies = typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : [headers.get("set-cookie") ?? ""];
    for (const cookie of cookies) {
        const match = /(?:^|[,;]\s*)session_id=([^;,\s]+)/i.exec(cookie);
        if (match?.[1]) {
            const value = decodeURIComponent(match[1]);
            if (/^[A-Za-z0-9._-]{16,256}$/.test(value)) return value;
        }
    }
    return null;
}

async function erpRpc(path: string, params: Record<string, unknown>, sessionId?: string) {
    let response: Response;
    try {
        response = await fetch(erpUrl(path), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(sessionId ? { Cookie: "session_id=" + encodeURIComponent(sessionId) } : {}),
            },
            body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: 1 }),
            redirect: "manual",
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
        });
    } catch {
        throw new ErpConnectionError();
    }
    if (!response.ok) throw new ErpRequestError();

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new ErpRequestError();
    }
    const parsed = envelopeSchema.safeParse(payload);
    if (!parsed.success || parsed.data.error !== undefined || parsed.data.result === undefined) {
        throw new ErpRequestError();
    }
    return { data: parsed.data.result, sessionId: setCookieSession(response.headers) };
}

export async function authenticate(usuario: string, senha: string) {
    const db = process.env.ZORD_ERP_DB;
    if (!db) throw new ErpConnectionError();
    const reply = await erpRpc("/web/session/authenticate", { db, login: usuario, password: senha });
    const parsed = erpSessionSchema.safeParse(reply.data);
    if (!parsed.success || !reply.sessionId) throw new ErpRequestError();
    return { session: parsed.data, sessionId: reply.sessionId };
}

export async function getErpSession(sessionId: string): Promise<ErpSession> {
    const reply = await erpRpc("/web/session/get_session_info", {}, sessionId);
    return erpSessionSchema.parse(reply.data);
}

export async function destroyErpSession(sessionId: string): Promise<void> {
    await erpRpc("/web/session/destroy", {}, sessionId);
}

export async function modelCall(
    sessionId: string,
    model: string,
    method: string,
    args: readonly unknown[],
    kwargs: Record<string, unknown> = {},
): Promise<unknown> {
    const reply = await erpRpc("/web/dataset/call_kw", {
        model,
        method,
        args: [...args],
        kwargs,
    }, sessionId);
    return reply.data;
}

export async function listRecords(
    sessionId: string,
    model: string,
    fields: readonly string[],
): Promise<Record<string, unknown>[]> {
    const result = await modelCall(sessionId, model, "search_read", [], {
        domain: [],
        fields: Array.from(new Set(["id", ...fields])),
        limit: 30,
        order: "id desc",
    });
    return z.array(z.record(z.string(), z.unknown())).parse(result);
}

export async function countRecords(sessionId: string, model: string): Promise<number> {
    const result = await modelCall(sessionId, model, "search_count", [[]]);
    return z.number().int().nonnegative().parse(result);
}
