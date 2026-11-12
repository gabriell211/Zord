import { NextResponse } from "next/server";
import { getApiUserSession } from "@/lib/api-session";
import { readJsonBodyLimited } from "@/lib/avatar";
import { sameOrigin } from "@/lib/origin";
import { createProduct, ProductConflictError } from "@/lib/products";
import { productSchema } from "@/lib/products-validation";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
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
    if (!parsed.success) return NextResponse.json({ error: "Verifique o nome, a referência, o preço e o estoque." }, { status: 422, headers });
    try {
        const id = await createProduct(session.sessionId, parsed.data);
        return NextResponse.json({ id }, { status: 201, headers });
    } catch (error) {
        return NextResponse.json({ error: error instanceof ProductConflictError ? error.message : "Não foi possível cadastrar o produto." }, {
            status: error instanceof ProductConflictError ? 409 : 503, headers,
        });
    }
}
