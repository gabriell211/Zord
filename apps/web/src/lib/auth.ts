import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, type Identity } from "@/lib/identity";

export function sessionCookieName(): string {
    return process.env.NODE_ENV === "production" ? "__Host-zord" : "zord_session";
}

export function validSessionId(input: string | undefined): input is string {
    return typeof input === "string" && /^[0-9a-f]{64}$/.test(input);
}

export type AuthorizedSession = {
    id: string;
    user: Identity;
};

export const getAuthorizedSession = cache(async (): Promise<AuthorizedSession> => {
    const id = (await cookies()).get(sessionCookieName())?.value;
    if (!validSessionId(id)) redirect("/login");
    const user = await getSessionUser(id);
    if (!user) redirect("/login?motivo=sessao");
    return { id, user };
});
