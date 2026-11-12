import { beforeEach, describe, expect, it, vi } from "vitest";
import { scrypt } from "node:crypto";
import { promisify } from "node:util";
import { authenticate, bootstrapAdmin, getSessionUser, InvalidCredentialsError, verifyPassword } from "@/lib/identity";
import { database } from "@/lib/database";

vi.mock("@/lib/database", () => ({
    database: vi.fn(),
    DatabaseUnavailableError: class DatabaseUnavailableError extends Error {},
}));

const db = vi.mocked(database);
const query = vi.fn();

beforeEach(() => {
    db.mockReset().mockReturnValue(query as unknown as ReturnType<typeof database>);
    query.mockReset();
});

describe("Zord · autenticação Neon", () => {
    it("verifica scrypt sem aceitar senha incorreta ou hash malformado", async () => {
        const salt = "1".repeat(32);
        const hashed = (await promisify(scrypt)("senha-segura-123", salt, 64)).toString("hex");
        expect(await verifyPassword("senha-segura-123", "scrypt$" + salt + "$" + hashed)).toBe(true);
        expect(await verifyPassword("senha-errada", "scrypt$" + salt + "$" + hashed)).toBe(false);
        expect(await verifyPassword("senha-segura-123", "texto-invalido")).toBe(false);
    });

    it("recusa conta inexistente, sem criar sessões", async () => {
        query.mockResolvedValue([]);
        await expect(authenticate("inexistente@example.com", "senha-invalida")).rejects.toBeInstanceOf(InvalidCredentialsError);
        expect(query).toHaveBeenCalledTimes(1);
    });

    it("recusa cookie malformado sem consultar o banco", async () => {
        expect(await getSessionUser("falso")).toBeNull();
        expect(query).not.toHaveBeenCalled();
    });

    it("recusa a instalação se a chave não foi configurada", async () => {
        const old = process.env.ZORD_SETUP_TOKEN;
        delete process.env.ZORD_SETUP_TOKEN;
        try {
            await expect(bootstrapAdmin({
                token: "a".repeat(64), empresa: "Empresa", nome: "Administrador",
                email: "admin@example.com", senha: "senha-forte-123",
            })).rejects.toThrow();
            expect(query).not.toHaveBeenCalled();
        } finally {
            if (old === undefined) delete process.env.ZORD_SETUP_TOKEN;
            else process.env.ZORD_SETUP_TOKEN = old;
        }
    });
});
