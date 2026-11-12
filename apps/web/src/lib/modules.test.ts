import { describe, expect, it } from "vitest";
import { getModule, modules } from "@/lib/modules";

describe("Zord · módulos autorizados", () => {
    it("localiza módulos permitidos por identificador", () => {
        expect(getModule("clientes")?.model).toBe("res.partner");
        expect(getModule("financeiro")?.model).toBe("account.move");
    });

    it("rejeita identificadores arbitrários", () => {
        expect(getModule("res.users")).toBeUndefined();
        expect(getModule("../../../etc/passwd")).toBeUndefined();
    });

    it("não possui rotas duplicadas", () => {
        expect(new Set(modules.map((module) => module.slug)).size).toBe(modules.length);
    });
});
