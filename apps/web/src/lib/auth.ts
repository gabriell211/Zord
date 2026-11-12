import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getErpSession, type ErpSession, ErpConnectionError } from "@/lib/erp";

export function sessionCookieName(): string {
    return process.env.NODE_ENV === "production" ? "__Host-zord" : "zord_session";
}

export function validSessionId(input: string | undefined): input is string {
    return typeof input === "string" && /^[A-Za-z0-9._-]{16,256}$/.test(input);
}

export type AuthorizedSession = {
    id: string;
    user: ErpSession;
};

export const getAuthorizedSession = cache(async (): Promise<AuthorizedSession> => {
    const cookieStore = await cookies();
    const id = cookieStore.get(sessionCookieName())?.value;
    if (!validSessionId(id)) redirect("/login");

    try {
        const user = await getErpSession(id);
        return { id, user };
    } catch (error) {
        if (error instanceof ErpConnectionError) throw error;
        redirect("/login?motivo=sessao");
    }
});
