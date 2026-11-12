import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { readJsonBodyLimited } from "@/lib/avatar";
import { sameOrigin } from "@/lib/origin";
import { getProduct, updateProduct, ProductConflictError, ProductNotFoundError } from "@/lib/products";
import { productSchema } from "@/lib/products-validation";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };
function parseId(value: string): number | null {
    if (!/^[1-9]\d{0,9}$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export async function GET(_request: Request, { params }: Context) {
    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
    let session;
    try { session = await getApiUserSession(); }
    catch { return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers }); }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });
    try { return NextResponse.json(await getProduct(session.sessionId, id), { headers }); }
    catch (error) {
        return NextResponse.json({ error: error instanceof ProductNotFoundError ? "Produto não encontrado." : "Não foi possível consultar o produto." }, {
            status: error instanceof ProductNotFoundError ? 404 : 503, headers,
        });
    }
}
export async function PATCH(request: Request, { params }: Context) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415, headers });
    }
    let session;
    try { session = await getApiUserSession(); }
    catch { return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers }); }
    if (!session) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers });
    let body: unknown;
    try { body = await readJsonBodyLimited(request, 10_000); }
    catch (error) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: error instanceof RangeError ? 413 : 400, headers });
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 422, headers });
    try {
        await updateProduct(session.sessionId, id, parsed.data);
        return NextResponse.json({ ok: true }, { headers });
    } catch (error) {
        const status = error instanceof ProductNotFoundError ? 404 : error instanceof ProductConflictError ? 409 : 503;
        return NextResponse.json({
            error: error instanceof ProductNotFoundError || error instanceof ProductConflictError ? error.message : "Não foi possível salvar o produto.",
        }, { status, headers });
    }
}
