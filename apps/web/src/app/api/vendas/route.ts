import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { readJsonBodyLimited } from "@/lib/avatar";
import { sameOrigin } from "@/lib/origin";
import { createSale, SaleAccessError, SaleConflictError, SaleDataError } from "@/lib/sales";
import { createSaleSchema } from "@/lib/sales-validation";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
    }
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415, headers });
    }
    let session;
    try { session = await getApiUserSession(); }
    catch { return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers }); }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });

    let payload: unknown;
    try { payload = await readJsonBodyLimited(request, 15_000); }
    catch (error) {
        return NextResponse.json({ error: "Dados inválidos." }, {
            status: error instanceof RangeError ? 413 : 400, headers,
        });
    }
    const parsed = createSaleSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pedido inválido." }, { status: 422, headers });
    }
    try {
        const id = await createSale(session.sessionId, parsed.data);
        return NextResponse.json({ id }, { status: 201, headers });
    } catch (error) {
        const status = error instanceof SaleAccessError ? 401
            : error instanceof SaleConflictError ? 409
            : error instanceof SaleDataError ? 422 : 503;
        const message = error instanceof SaleAccessError ||
            error instanceof SaleConflictError || error instanceof SaleDataError
            ? error.message : "Não foi possível cadastrar o pedido.";
        return NextResponse.json({ error: message }, { status, headers });
    }
}
