import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession } from "@/lib/identity";
import { sessionCookieName, validSessionId } from "@/lib/auth";
import { sameOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
    const cookie = sessionCookieName();
    const id = (await cookies()).get(cookie)?.value;
    if (validSessionId(id)) {
        try {
            await revokeSession(id);
        } catch {
            // A sessão do navegador será removida mesmo se o banco estiver indisponível.
        }
    }
    const response = NextResponse.json({ ok: true }, {
        headers: { "Cache-Control": "no-store", "Clear-Site-Data": '"cache"' },
    });
    response.cookies.set(cookie, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return response;
}
