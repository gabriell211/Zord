import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOwnProfile, fetchOwnAvatar, saveOwnAvatar } from "@/lib/profile";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";

vi.mock("@/lib/database", () => ({ database: vi.fn() }));
vi.mock("@/lib/identity", () => ({ getSessionUser: vi.fn() }));

const db = vi.mocked(database);
const session = vi.mocked(getSessionUser);
const query = vi.fn();
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4, 5, 6]);

beforeEach(() => {
    db.mockReset().mockReturnValue(query as unknown as ReturnType<typeof database>);
    session.mockReset().mockResolvedValue({
        uid: 12, name: "Gabriel", username: "g@example.com", organizationId: 17, role: "owner",
    });
    query.mockReset();
});

describe("Zord · avatar e perfil protegidos por identidade", () => {
    it("carrega apenas o perfil da identidade da sessão", async () => {
        query.mockResolvedValue([{ id: 12, name: "Gabriel", email: "g@example.com" }]);
        expect((await fetchOwnProfile("sessao", 12)).email).toBe("g@example.com");
        expect(query.mock.calls[0]?.slice(1)).toContain(17);
    });

    it("rejeita consultar avatar de outro usuário", async () => {
        await expect(fetchOwnAvatar("sessao", 99)).rejects.toThrow();
        expect(query).not.toHaveBeenCalled();
    });

    it("retorna somente avatar rasterizado válido", async () => {
        query.mockResolvedValue([{ avatar_data: png, avatar_mime: "image/png" }]);
        expect(await fetchOwnAvatar("sessao", 12)).toBe(png.toString("base64"));
    });

    it("atualiza a imagem em sua própria organização", async () => {
        query.mockResolvedValue([{ id: 12 }]);
        await saveOwnAvatar("sessao", 12, png.toString("base64"));
        expect(query.mock.calls[0]?.slice(1)).toContain(17);
    });

    it("recusa imagem ativa e modificações de contas alheias", async () => {
        await expect(saveOwnAvatar("sessao", 12, Buffer.from("<svg/>").toString("base64"))).rejects.toThrow();
        await expect(saveOwnAvatar("sessao", 99, false)).rejects.toThrow();
        expect(query).not.toHaveBeenCalled();
    });
});
