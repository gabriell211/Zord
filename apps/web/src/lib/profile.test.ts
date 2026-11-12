import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOwnProfile, fetchOwnAvatar, saveOwnAvatar } from "@/lib/profile";
import { modelCall, ErpRequestError } from "@/lib/erp";

vi.mock("@/lib/erp", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/lib/erp")>();
    return { ...original, modelCall: vi.fn() };
});

const call = vi.mocked(modelCall);
beforeEach(() => call.mockReset());

describe("Zord · isolamento dos avatares por usuário", () => {
    it("consulta apenas a imagem do usuário autenticado", async () => {
        call.mockResolvedValue([{ id: 12, image_128: "conteudo-base64" }]);
        expect(await fetchOwnAvatar("sessao-segura", 12)).toBe("conteudo-base64");
        expect(call).toHaveBeenCalledWith(
            "sessao-segura", "res.users", "read", [[12], ["image_128"]],
        );
    });

    it("rejeita resposta de outro usuário", async () => {
        call.mockResolvedValue([{ id: 99, image_128: "conteudo-base64" }]);
        await expect(fetchOwnAvatar("sessao-segura", 12)).rejects.toBeInstanceOf(ErpRequestError);
    });

    it("altera somente o campo de imagem da própria conta", async () => {
        call.mockResolvedValue(true);
        await saveOwnAvatar("sessao-segura", 12, "imagem-base64");
        expect(call).toHaveBeenCalledWith(
            "sessao-segura", "res.users", "write", [[12], { image_1920: "imagem-base64" }],
        );
    });

    it("trata falhas de permissão como erro", async () => {
        call.mockResolvedValue(false);
        await expect(saveOwnAvatar("sessao-segura", 12, false)).rejects.toBeInstanceOf(ErpRequestError);
    });

    it("exibe perfil do próprio usuário sem expor outra conta", async () => {
        call.mockResolvedValue([{ id: 12, name: "Gabriel", email: "teste@example.com" }]);
        const data = await fetchOwnProfile("sessao-segura", 12);
        expect(data.name).toBe("Gabriel");
        expect(call).toHaveBeenCalledWith(
            "sessao-segura", "res.users", "read", [[12], ["name", "email"]],
        );
    });
});
