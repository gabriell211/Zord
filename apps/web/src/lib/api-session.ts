import { cookies } from "next/headers";
import { sessionCookieName, validSessionId } from "@/lib/auth";
import { getErpSession, ErpConnectionError } from "@/lib/erp";

export type ApiUserSession = {
    sessionId: string;
    uid: number;
};

export async function getApiUserSession(): Promise<ApiUserSession | null> {
    const sessionId = (await cookies()).get(sessionCookieName())?.value;
    if (!validSessionId(sessionId)) return null;
    try {
        const user = await getErpSession(sessionId);
        return { sessionId, uid: user.uid };
    } catch (error) {
        if (error instanceof ErpConnectionError) throw error;
        return null;
    }
}
