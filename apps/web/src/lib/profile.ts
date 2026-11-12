import { z } from "zod";
import { modelCall, ErpRequestError } from "@/lib/erp";

const userReadSchema = z.array(z.object({
    id: z.number().int().positive(),
    name: z.union([z.string(), z.literal(false)]).optional(),
    email: z.union([z.string(), z.literal(false)]).optional(),
}));

const avatarReadSchema = z.array(z.object({
    id: z.number().int().positive(),
    image_128: z.union([z.string(), z.literal(false)]).optional(),
}));

export type UserProfile = {
    id: number;
    name: string;
    email: string;
};

export async function fetchOwnProfile(sessionId: string, uid: number): Promise<UserProfile> {
    const data = await modelCall(sessionId, "res.users", "read", [[uid], ["name", "email"]]);
    const result = userReadSchema.safeParse(data);
    const record = result.success ? result.data[0] : undefined;
    if (!record || record.id !== uid) throw new ErpRequestError();
    return {
        id: uid,
        name: typeof record.name === "string" ? record.name : "Usuário",
        email: typeof record.email === "string" ? record.email : "",
    };
}

export async function fetchOwnAvatar(sessionId: string, uid: number): Promise<string | null> {
    const data = await modelCall(sessionId, "res.users", "read", [[uid], ["image_128"]]);
    const result = avatarReadSchema.safeParse(data);
    const record = result.success ? result.data[0] : undefined;
    if (!record || record.id !== uid) throw new ErpRequestError();
    return typeof record.image_128 === "string" ? record.image_128 : null;
}

export async function saveOwnAvatar(sessionId: string, uid: number, base64: string | false): Promise<void> {
    const data = await modelCall(sessionId, "res.users", "write", [[uid], { image_1920: base64 }]);
    if (data !== true) throw new ErpRequestError();
}
