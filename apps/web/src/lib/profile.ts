import { z } from "zod";
import { validatedAvatarBytes } from "@/lib/avatar";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";

const profileSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.string(),
});

export type UserProfile = z.infer<typeof profileSchema>;

async function validateOwner(sessionId: string, uid: number): Promise<number> {
    const user = await getSessionUser(sessionId);
    if (!user || user.uid !== uid) throw new Error("Sem permissão para acessar este perfil.");
    return user.organizationId;
}

export async function fetchOwnProfile(sessionId: string, uid: number): Promise<UserProfile> {
    const organizationId = await validateOwner(sessionId, uid);
    const db = database();
    const rows = await db`
        SELECT id, name, email
        FROM zord_users
        WHERE id = ${uid} AND organization_id = ${organizationId} AND active = true
        LIMIT 1
    `;
    return profileSchema.parse(rows[0]);
}

export async function fetchOwnAvatar(sessionId: string, uid: number): Promise<string | null> {
    const organizationId = await validateOwner(sessionId, uid);
    const db = database();
    const rows = await db`
        SELECT avatar_data, avatar_mime
        FROM zord_users
        WHERE id = ${uid} AND organization_id = ${organizationId} AND active = true
        LIMIT 1
    `;
    const image = rows[0]?.avatar_data;
    if (!(image instanceof Uint8Array)) return null;
    const base64 = Buffer.from(image).toString("base64");
    return validatedAvatarBytes(base64, typeof rows[0]?.avatar_mime === "string" ? rows[0].avatar_mime : undefined)
        ? base64 : null;
}

export async function saveOwnAvatar(sessionId: string, uid: number, base64: string | false): Promise<void> {
    const organizationId = await validateOwner(sessionId, uid);
    const image = base64 ? validatedAvatarBytes(base64) : null;
    if (base64 && !image) throw new Error("Imagem inválida.");
    const db = database();
    const rows = await db`
        UPDATE zord_users
        SET avatar_data = ${image?.data ?? null},
            avatar_mime = ${image?.mime ?? null},
            updated_at = now()
        WHERE id = ${uid} AND organization_id = ${organizationId} AND active = true
        RETURNING id
    `;
    if (rows.length === 0) throw new Error("Perfil não encontrado.");
}
