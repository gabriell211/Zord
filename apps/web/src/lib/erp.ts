import { z } from "zod";
import { database, DatabaseUnavailableError } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";

export class ErpConnectionError extends DatabaseUnavailableError {
    constructor() {
        super();
        this.name = "ErpConnectionError";
    }
}

export class ErpRequestError extends Error {
    constructor() {
        super("Módulo ainda não disponível na versão web do Zord.");
        this.name = "ErpRequestError";
    }
}

async function requireOrganization(sessionId: string): Promise<number> {
    const session = await getSessionUser(sessionId);
    if (!session) throw new ErpRequestError();
    return session.organizationId;
}

export async function listRecords(
    sessionId: string,
    model: string,
    _fields: readonly string[],
    query = "",
): Promise<Record<string, unknown>[]> {
    const organizationId = await requireOrganization(sessionId);
    if (model !== "res.partner") throw new ErpRequestError();
    const db = database();
    const text = query.trim().slice(0, 80);
    const pattern = "%" + text + "%";
    const rows = await db`
        SELECT id, name AS display_name, email, phone
        FROM zord_customers
        WHERE organization_id = ${organizationId}
          AND active = true
          AND (${text === ""} OR name ILIKE ${pattern} OR COALESCE(email, '') ILIKE ${pattern})
        ORDER BY id DESC LIMIT 30
    `;
    return z.array(z.record(z.string(), z.unknown())).parse(rows);
}

export async function countRecords(sessionId: string, model: string): Promise<number> {
    const organizationId = await requireOrganization(sessionId);
    if (model !== "res.partner") throw new ErpRequestError();
    const db = database();
    const rows = await db`
        SELECT COUNT(*)::int AS total
        FROM zord_customers
        WHERE organization_id = ${organizationId} AND active = true
    `;
    return z.number().int().nonnegative().parse(rows[0]?.total);
}
