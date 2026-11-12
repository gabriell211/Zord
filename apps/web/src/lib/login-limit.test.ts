import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "@/lib/database";
import { clearLoginFailures, loginBlocked, registerLoginFailure } from "@/lib/login-limit";

vi.mock("@/lib/database", () => ({ database: vi.fn() }));

const db = vi.mocked(database);
const query = vi.fn();

beforeEach(() => {
    db.mockReset().mockReturnValue(query as unknown as ReturnType<typeof database>);
    query.mockReset();
});

describe("Zord · proteção persistente de login", () => {
    it("identifica conta temporariamente bloqueada", async () => {
        query.mockResolvedValue([{ blocked: true }]);
        expect(await loginBlocked("Admin@Example.Com")).toBe(true);
    });

    it("armazena somente hash da identidade no contador de falhas", async () => {
        query.mockResolvedValue([]);
        await registerLoginFailure("Admin@Example.Com");
        const args = query.mock.calls[0]?.slice(1) ?? [];
        expect(args).not.toContain("Admin@Example.Com");
        expect(typeof args[0]).toBe("string");
        expect(String(args[0])).toMatch(/^[a-f0-9]{64}$/);
        await clearLoginFailures("Admin@Example.Com");
        expect(query).toHaveBeenCalledTimes(2);
    });
});
