import { describe, expect, it } from "vitest";
import { clienteSchema, loginSchema } from "@/lib/validation";

describe("Zord · validação de acesso", () => {
    it("aceita credenciais não vazias", () => {
        const result = loginSchema.safeParse({ usuario: "responsavel@empresa.com.br", senha: "teste-valido" });
        expect(result.success).toBe(true);
    });

    it("rejeita campos extras e credenciais vazias", () => {
        expect(loginSchema.safeParse({ usuario: "", senha: "" }).success).toBe(false);
        expect(loginSchema.safeParse({ usuario: "admin", senha: "abc", role: "superuser" }).success).toBe(false);
    });

    it("rejeita entrada malformada ou fora dos limites", () => {
        expect(loginSchema.safeParse(null).success).toBe(false);
        expect(loginSchema.safeParse({ usuario: "u".repeat(300), senha: "x" }).success).toBe(false);
        expect(loginSchema.safeParse({ usuario: "admin", senha: "x".repeat(4097) }).success).toBe(false);
    });
});

describe("Zord · cadastro de clientes", () => {
    it("aceita e-mail e telefone válidos", () => {
        expect(clienteSchema.safeParse({
            nome: "Empresa Exemplo", email: "fiscal@exemplo.com.br", telefone: "(48) 99999-9999",
        }).success).toBe(true);
    });

    it("bloqueia emails e telefones inválidos", () => {
        expect(clienteSchema.safeParse({ nome: "Empresa", email: "invalido" }).success).toBe(false);
        expect(clienteSchema.safeParse({ nome: "Empresa", telefone: "<script>" }).success).toBe(false);
    });
});
