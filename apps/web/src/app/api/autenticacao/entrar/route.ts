import { NextResponse } from "next/server";
import { authenticate, ErpConnectionError } from "@/lib/erp";
import { sessionCookieName } from "@/lib/auth";
import { sameOrigin } from "@/lib/origin";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415 });
    }

    let payload: unknown;
    try {
        const body = await request.text();
        if (body.length > 10000) {
            return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });
        }
        payload = JSON.parse(body) as unknown;
    } catch {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    try {
        const { sessionId } = await authenticate(parsed.data.usuario, parsed.data.senha);
        const response = NextResponse.json({ ok: true }, {
            headers: { "Cache-Control": "no-store" },
        });
        response.cookies.set(sessionCookieName(), sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });
        return response;
    } catch (error) {
        if (error instanceof ErpConnectionError) {
            return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
        }
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }
}
