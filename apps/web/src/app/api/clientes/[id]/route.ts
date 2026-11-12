import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { getCustomer, updateCustomer, CustomerNotFoundError } from "@/lib/customers";
import { readJsonBodyLimited } from "@/lib/avatar";
import { sameOrigin } from "@/lib/origin";
import { atualizarClienteSchema } from "@/lib/validation";
import { ErpConnectionError } from "@/lib/erp";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
type RouteContext = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
    if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
    let session;
    try {
        session = await getApiUserSession();
    } catch {
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
    }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });
    try {
        const customer = await getCustomer(session.sessionId, id);
        return NextResponse.json(customer, { headers });
    } catch (error) {
        return NextResponse.json({ error: error instanceof CustomerNotFoundError ? "Cliente não encontrado." : "Não foi possível consultar o cliente." }, {
            status: error instanceof CustomerNotFoundError ? 404 : 502, headers,
        });
    }
}

export async function PATCH(request: Request, { params }: RouteContext) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415, headers });
    }
    let session;
    try {
        session = await getApiUserSession();
    } catch {
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
    }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });
    let body: unknown;
    try {
        body = await readJsonBodyLimited(request, 10_000);
    } catch (error) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: error instanceof RangeError ? 413 : 400, headers });
    }
    const parsed = atualizarClienteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 422, headers });
    try {
        await updateCustomer(session.sessionId, id, parsed.data);
        return NextResponse.json({ ok: true }, { headers });
    } catch (error) {
        if (error instanceof CustomerNotFoundError) {
            return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404, headers });
        }
        return NextResponse.json({ error: "Não foi possível atualizar o cliente. Confira permissões e dados." }, { status: 502, headers });
    }
}
