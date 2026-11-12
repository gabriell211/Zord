import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { database, DatabaseUnavailableError } from "@/lib/database";
import type { ConfiguracaoInicialInput } from "@/lib/validation";

function derive(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (error, derived) => {
            if (error) reject(error);
            else resolve(derived);
        });
    });
}
const SESSION_DAYS = 7;

const userSchema = z.object({
    uid: z.number().int().positive(),
    name: z.string().min(1),
    username: z.string(),
    organization_id: z.number().int().positive(),
    role: z.enum(["owner", "admin", "member"]),
});

export type Identity = {
    uid: number;
    name: string;
    username: string;
    organizationId: number;
    role: "owner" | "admin" | "member";
};

export class InvalidCredentialsError extends Error {
    constructor() {
        super("Credenciais inválidas.");
        this.name = "InvalidCredentialsError";
    }
}

export class SetupRejectedError extends Error {
    constructor() {
        super("Instalação não autorizada ou já concluída.");
        this.name = "SetupRejectedError";
    }
}

function parseIdentity(value: unknown): Identity {
    const parsed = userSchema.safeParse(value);
    if (!parsed.success) throw new DatabaseUnavailableError();
    return {
        uid: parsed.data.uid,
        name: parsed.data.name,
        username: parsed.data.username,
        organizationId: parsed.data.organization_id,
        role: parsed.data.role,
    };
}

function tokenHash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = await derive(password, salt, 64);
    return ["scrypt", salt, derived.toString("hex")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const match = /^scrypt\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(stored);
    const salt = match?.[1] ?? "0".repeat(32);
    const reference = Buffer.from(match?.[2] ?? "0".repeat(128), "hex");
    const actual = await derive(password, salt, 64);
    return Boolean(match) && timingSafeEqual(reference, actual);
}

function newSessionToken(): string {
    return randomBytes(32).toString("hex");
}

export async function getSessionUser(raw: string): Promise<Identity | null> {
    if (!/^[0-9a-f]{64}$/.test(raw)) return null;
    const db = database();
    const rows = await db`
        SELECT u.id AS uid, u.name, u.email AS username, u.organization_id, u.role
        FROM zord_sessions AS s
        JOIN zord_users AS u ON u.id = s.user_id
        WHERE s.token_hash = ${tokenHash(raw)}
          AND s.expires_at > now()
          AND u.active = true
        LIMIT 1
    `;
    return rows[0] ? parseIdentity(rows[0]) : null;
}

export async function authenticate(username: string, password: string): Promise<{
    sessionId: string;
    session: Identity;
}> {
    const db = database();
    const email = username.trim().toLowerCase();
    const accounts = await db`
        SELECT id AS uid, name, email AS username, organization_id, role, password_hash
        FROM zord_users
        WHERE lower(email) = ${email} AND active = true
        LIMIT 1
    `;
    const account = accounts[0];
    const hash = typeof account?.password_hash === "string" ? account.password_hash : "";
    const valid = await verifyPassword(password, hash);
    if (!valid || !account) throw new InvalidCredentialsError();

    const session = parseIdentity(account);
    const sessionId = newSessionToken();
    await db`
        INSERT INTO zord_sessions (token_hash, user_id, expires_at)
        VALUES (${tokenHash(sessionId)}, ${session.uid}, now() + interval '7 days')
    `;
    return { sessionId, session };
}

export async function revokeSession(raw: string): Promise<void> {
    if (!/^[0-9a-f]{64}$/.test(raw)) return;
    const db = database();
    await db`DELETE FROM zord_sessions WHERE token_hash = ${tokenHash(raw)}`;
}

export async function setupComplete(): Promise<boolean> {
    const db = database();
    const rows = await db`SELECT EXISTS(SELECT 1 FROM zord_users) AS installed`;
    return rows[0]?.installed === true;
}

export async function bootstrapAdmin(input: ConfiguracaoInicialInput): Promise<string> {
    const token = process.env.ZORD_SETUP_TOKEN;
    if (!token || token.length < 32) throw new SetupRejectedError();

    const supplied = Buffer.from(tokenHash(input.token), "hex");
    const expected = Buffer.from(tokenHash(token), "hex");
    if (!timingSafeEqual(supplied, expected)) throw new SetupRejectedError();

    const db = database();
    const passwordHash = await hashPassword(input.senha);
    const sessionId = newSessionToken();
    const login = input.email.trim().toLowerCase();

    await db.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(21001112)`;
        const exists = await tx`SELECT id FROM zord_users LIMIT 1`;
        if (exists.length > 0) throw new SetupRejectedError();

        const organization = await tx`
            INSERT INTO zord_organizations (name)
            VALUES (${input.empresa})
            RETURNING id
        `;
        const organizationId = z.number().int().positive().parse(organization[0]?.id);
        const users = await tx`
            INSERT INTO zord_users (organization_id, name, email, password_hash, role)
            VALUES (${organizationId}, ${input.nome}, ${login}, ${passwordHash}, 'owner')
            RETURNING id
        `;
        const userId = z.number().int().positive().parse(users[0]?.id);
        await tx`
            INSERT INTO zord_sessions (token_hash, user_id, expires_at)
            VALUES (${tokenHash(sessionId)}, ${userId}, now() + interval '7 days')
        `;
    });
    return sessionId;
}

export const sessionTtlSeconds = SESSION_DAYS * 24 * 60 * 60;
