import { NextResponse } from "next/server";
import { authenticate, InvalidCredentialsError, sessionTtlSeconds } from "@/lib/identity";
import { sessionCookieName } from "@/lib/auth";
import { sameOrigin } from "@/lib/origin";
import { loginSchema } from "@/lib/validation";
import { readJsonBodyLimited } from "@/lib/avatar";
import { loginBlocked, registerLoginFailure, clearLoginFailures } from "@/lib/login-limit";

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
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers });
    }

    try {
        if (await loginBlocked(parsed.data.usuario)) {
            return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, {
                status: 429,
                headers: { ...headers, "Retry-After": "900" },
            });
        }
        const { sessionId } = await authenticate(parsed.data.usuario, parsed.data.senha);
        await clearLoginFailures(parsed.data.usuario);
        const response = NextResponse.json({ ok: true }, { headers });
        response.cookies.set(sessionCookieName(), sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: sessionTtlSeconds,
        });
        return response;
    } catch (error) {
        if (error instanceof InvalidCredentialsError) {
            try {
                await registerLoginFailure(parsed.data.usuario);
            } catch {
                return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
            }
            return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401, headers });
        }
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
    }
}
