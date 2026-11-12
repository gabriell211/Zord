import { cookies } from "next/headers";
import { sessionCookieName, validSessionId } from "@/lib/auth";
import { getSessionUser } from "@/lib/identity";

export type ApiUserSession = {
    sessionId: string;
    uid: number;
};

export async function getApiUserSession(): Promise<ApiUserSession | null> {
    const sessionId = (await cookies()).get(sessionCookieName())?.value;
    if (!validSessionId(sessionId)) return null;
    const user = await getSessionUser(sessionId);
    return user ? { sessionId, uid: user.uid } : null;
}
