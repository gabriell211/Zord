import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { sameOrigin } from "@/lib/origin";
import { confirmSale, SaleAccessError, SaleDataError, SaleInsufficientStockError, SaleNotFoundError } from "@/lib/sales";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
    }
    const rawId = (await params).id;
    if (!/^[1-9]\d{0,9}$/.test(rawId)) {
        return NextResponse.json({ error: "Pedido inválido." }, { status: 400, headers });
    }
    const id = Number(rawId);
    if (!Number.isSafeInteger(id)) {
        return NextResponse.json({ error: "Pedido inválido." }, { status: 400, headers });
    }
    let session;
    try { session = await getApiUserSession(); }
    catch { return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers }); }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });
    try {
        await confirmSale(session.sessionId, id);
        return NextResponse.json({ ok: true }, { headers });
    } catch (error) {
        const status = error instanceof SaleAccessError ? 401
            : error instanceof SaleNotFoundError ? 404
            : error instanceof SaleDataError || error instanceof SaleInsufficientStockError ? 409
            : 503;
        const message = error instanceof SaleNotFoundError || error instanceof SaleDataError ||
            error instanceof SaleInsufficientStockError || error instanceof SaleAccessError
            ? error.message : "Não foi possível confirmar o pedido.";
        return NextResponse.json({ error: message }, { status, headers });
    }
}
