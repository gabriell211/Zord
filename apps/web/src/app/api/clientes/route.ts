import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { createCustomer } from "@/lib/customers";
import { readJsonBodyLimited } from "@/lib/avatar";
import { sameOrigin } from "@/lib/origin";
import { clienteSchema } from "@/lib/validation";
import { ErpConnectionError } from "@/lib/erp";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
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

    let data: unknown;
    try {
        data = await readJsonBodyLimited(request, 10_000);
    } catch (error) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: error instanceof RangeError ? 413 : 400, headers });
    }
    const parsed = clienteSchema.safeParse(data);
    if (!parsed.success) {
        return NextResponse.json({ error: "Verifique nome, e-mail e telefone do cliente." }, { status: 422, headers });
    }
    try {
        const id = await createCustomer(session.sessionId, parsed.data);
        return NextResponse.json({ id }, { status: 201, headers });
    } catch (error) {
        return NextResponse.json({ error: error instanceof ErpConnectionError ? "Serviço indisponível." : "Não foi possível cadastrar. Confira as permissões e os dados." }, {
            status: error instanceof ErpConnectionError ? 503 : 502, headers,
        });
    }
}
