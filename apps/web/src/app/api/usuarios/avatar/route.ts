import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName, validSessionId } from "@/lib/auth";
import { getSessionUser } from "@/lib/identity";
import { avatarUploadSchema, readJsonBodyLimited, validatedAvatarBytes } from "@/lib/avatar";
import { fetchOwnAvatar, saveOwnAvatar } from "@/lib/profile";
import { sameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
    "Cache-Control": "private, no-store, max-age=0",
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff",
};

async function currentUser() {
    const id = (await cookies()).get(sessionCookieName())?.value;
    if (!validSessionId(id)) return null;
    const user = await getSessionUser(id);
    return user ? { sessionId: id, uid: user.uid } : null;
}

export async function GET() {
    let current: Awaited<ReturnType<typeof currentUser>>;
    try {
        current = await currentUser();
    } catch {
        return new Response(null, { status: 503, headers: privateHeaders });
    }
    if (!current) return new Response(null, { status: 401, headers: privateHeaders });

    try {
        const base64 = await fetchOwnAvatar(current.sessionId, current.uid);
        const image = base64 ? validatedAvatarBytes(base64) : null;
        if (!image) return new Response(null, { status: 404, headers: privateHeaders });
        return new Response(new Uint8Array(image.data), {
            headers: { ...privateHeaders, "Content-Type": image.mime, "Content-Disposition": "inline" },
        });
    } catch {
        return new Response(null, { status: 503, headers: privateHeaders });
    }
}

export async function PUT(request: Request) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers: privateHeaders });
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ error: "Formato inválido." }, { status: 415, headers: privateHeaders });
    }
    let current: Awaited<ReturnType<typeof currentUser>>;
    try {
        current = await currentUser();
    } catch {
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers: privateHeaders });
    }
    if (!current) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers: privateHeaders });

    let body: unknown;
    try {
        body = await readJsonBodyLimited(request);
    } catch (error) {
        return NextResponse.json({ error: "Imagem inválida ou muito grande." }, {
            status: error instanceof RangeError ? 413 : 400, headers: privateHeaders,
        });
    }
    const parsed = avatarUploadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Imagem inválida." }, { status: 400, headers: privateHeaders });
    const image = validatedAvatarBytes(parsed.data.base64, parsed.data.mime);
    if (!image) return NextResponse.json({ error: "Utilize PNG, JPG ou WebP com até 1 MB." }, { status: 415, headers: privateHeaders });

    try {
        await saveOwnAvatar(current.sessionId, current.uid, image.data.toString("base64"));
        return NextResponse.json({ ok: true }, { headers: privateHeaders });
    } catch {
        return NextResponse.json({ error: "Não foi possível atualizar o avatar. Confira as permissões da conta." }, {
            status: 502, headers: privateHeaders,
        });
    }
}

export async function DELETE(request: Request) {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers: privateHeaders });
    let current: Awaited<ReturnType<typeof currentUser>>;
    try {
        current = await currentUser();
    } catch {
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers: privateHeaders });
    }
    if (!current) return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers: privateHeaders });
    try {
        await saveOwnAvatar(current.sessionId, current.uid, false);
        return NextResponse.json({ ok: true }, { headers: privateHeaders });
    } catch {
        return NextResponse.json({ error: "Não foi possível remover o avatar." }, { status: 502, headers: privateHeaders });
    }
}
