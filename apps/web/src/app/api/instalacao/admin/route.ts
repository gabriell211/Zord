import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";
import { readJsonBodyLimited } from "@/lib/avatar";
import { bootstrapAdmin, SetupRejectedError, sessionTtlSeconds } from "@/lib/identity";
import { sameOrigin } from "@/lib/origin";
import { configuracaoInicialSchema } from "@/lib/validation";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
    }
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415, headers });
    }

    let payload: unknown;
    try {
        payload = await readJsonBodyLimited(request, 10_000);
    } catch (error) {
        return NextResponse.json({ error: "Dados inválidos." }, {
            status: error instanceof RangeError ? 413 : 400, headers,
        });
    }
    const parsed = configuracaoInicialSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: "Verifique os dados e utilize uma senha de pelo menos 12 caracteres." }, {
            status: 422, headers,
        });
    }
    try {
        const sessionId = await bootstrapAdmin(parsed.data);
        const response = NextResponse.json({ ok: true }, { status: 201, headers });
        response.cookies.set(sessionCookieName(), sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: sessionTtlSeconds,
        });
        return response;
    } catch (error) {
        return NextResponse.json({
            error: error instanceof SetupRejectedError
                ? "Chave inválida ou instalação já concluída."
                : "Não foi possível concluir a instalação. Verifique o banco Neon.",
        }, { status: error instanceof SetupRejectedError ? 403 : 503, headers });
    }
}
