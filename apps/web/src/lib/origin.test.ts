import { describe, expect, it } from "vitest";
import { sameOrigin } from "@/lib/origin";

describe("Zord · proteção de origem", () => {
    it("permite apenas origem correspondente", () => {
        expect(sameOrigin(new Request("https://erp.example.com/api/autenticacao/entrar", {
            headers: { origin: "https://erp.example.com" },
        }))).toBe(true);
    });

    it("rejeita origem ausente ou de outro domínio", () => {
        expect(sameOrigin(new Request("https://erp.example.com/api/autenticacao/entrar"))).toBe(false);
        expect(sameOrigin(new Request("https://erp.example.com/api/autenticacao/entrar", {
            headers: { origin: "https://falso.example.com" },
        }))).toBe(false);
        expect(sameOrigin(new Request("https://erp.example.com/api/autenticacao/entrar", {
            headers: { origin: "not an origin" },
        }))).toBe(false);
    });
});
