import { createHash } from "node:crypto";
import { database } from "@/lib/database";

function keyFor(username: string): string {
    return createHash("sha256")
        .update("login:" + username.trim().toLowerCase())
        .digest("hex");
}

export async function loginBlocked(username: string): Promise<boolean> {
    const db = database();
    const rows = await db`
        SELECT blocked_until > now() AS blocked
        FROM zord_login_attempts
        WHERE key = ${keyFor(username)}
        LIMIT 1
    `;
    return rows[0]?.blocked === true;
}

export async function registerLoginFailure(username: string): Promise<void> {
    const db = database();
    await db`
        INSERT INTO zord_login_attempts (key, attempts, window_started_at)
        VALUES (${keyFor(username)}, 1, now())
        ON CONFLICT (key) DO UPDATE
        SET attempts = CASE
                WHEN zord_login_attempts.window_started_at < now() - interval '15 minutes' THEN 1
                ELSE zord_login_attempts.attempts + 1
            END,
            window_started_at = CASE
                WHEN zord_login_attempts.window_started_at < now() - interval '15 minutes' THEN now()
                ELSE zord_login_attempts.window_started_at
            END,
            blocked_until = CASE
                WHEN zord_login_attempts.window_started_at < now() - interval '15 minutes' THEN null
                WHEN zord_login_attempts.attempts >= 4 THEN now() + interval '15 minutes'
                ELSE zord_login_attempts.blocked_until
            END
    `;
}

export async function clearLoginFailures(username: string): Promise<void> {
    const db = database();
    await db`DELETE FROM zord_login_attempts WHERE key = ${keyFor(username)}`;
}
