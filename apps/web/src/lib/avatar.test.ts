import { describe, expect, it } from "vitest";
import { detectImageType, validatedAvatarBytes, avatarUploadSchema, readJsonBodyLimited } from "@/lib/avatar";

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4, 5, 6]);
const jpg = Buffer.from([255, 216, 255, 224, 1, 2, 3, 4, 5, 6, 7, 8]);
const webp = Buffer.from("RIFF----WEBPVP8 ");
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

describe("Zord · avatar individual", () => {
    it("detecta imagens rasterizadas válidas", () => {
        expect(detectImageType(png)).toBe("image/png");
        expect(detectImageType(jpg)).toBe("image/jpeg");
        expect(detectImageType(webp)).toBe("image/webp");
    });

    it("recusa imagem SVG ativa e tipo declarado diferente", () => {
        expect(validatedAvatarBytes(svg.toString("base64"))).toBeNull();
        expect(validatedAvatarBytes(png.toString("base64"), "image/jpeg")).toBeNull();
    });

    it("recusa dados inválidos, muito grandes e campos extras", () => {
        expect(validatedAvatarBytes("%%%notbase64%%%")).toBeNull();
        expect(validatedAvatarBytes(Buffer.alloc(1024 * 1024 + 1, 1).toString("base64"))).toBeNull();
        expect(avatarUploadSchema.safeParse({ base64: png.toString("base64"), mime: "image/png", id: 42 }).success).toBe(false);
    });

    it("limita o tamanho da solicitação com ou sem content-length", async () => {
        const r = new Request("https://zord.example.com/api/usuarios/avatar", {
            method: "PUT",
            body: JSON.stringify({ hello: "world" }),
        });
        await expect(readJsonBodyLimited(r)).resolves.toEqual({ hello: "world" });

        const tooLarge = new Request("https://zord.example.com/api/usuarios/avatar", {
            method: "PUT",
            body: JSON.stringify({ a: "123456789012345" }),
        });
        await expect(readJsonBodyLimited(tooLarge, 10)).rejects.toBeInstanceOf(RangeError);
    });
});
