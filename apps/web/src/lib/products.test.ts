import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";
import { createProduct, getProduct, listProducts, ProductAccessError, ProductConflictError, ProductNotFoundError, updateProduct } from "@/lib/products";
import { formatPriceBRLInput, parsePriceBRL, productSchema } from "@/lib/products-validation";

vi.mock("@/lib/database", () => ({ database: vi.fn() }));
vi.mock("@/lib/identity", () => ({ getSessionUser: vi.fn() }));
const db = vi.mocked(database);
const session = vi.mocked(getSessionUser);
const query = vi.fn();
const values = () => query.mock.calls[0]?.slice(1) ?? [];
const product = { name: "Caderno", sku: "CAD-01", priceCents: 1250, quantity: 4 };

beforeEach(() => {
    db.mockReset().mockReturnValue(query as unknown as ReturnType<typeof database>);
    session.mockReset().mockResolvedValue({ uid: 2, name: "Teste", username: "teste@zord.com", organizationId: 17, role: "owner" });
    query.mockReset();
});

describe("Zord · valores BRL e validação", () => {
    it("converte centavos sem perda de precisão", () => {
        expect(parsePriceBRL("12,50")).toBe(1250);
        expect(parsePriceBRL("0,01")).toBe(1);
        expect(parsePriceBRL("999999,99")).toBe(99999999);
        expect(formatPriceBRLInput(1250)).toBe("12,50");
    });
    it("rejeita preço inválido e payload fora da especificação", () => {
        for (const price of ["-2", "1.234,56", "1,999", "1e5", "", "1000000"]) {
            expect(parsePriceBRL(price)).toBeNull();
        }
        expect(productSchema.safeParse({ ...product, quantity: -1 }).success).toBe(false);
        expect(productSchema.safeParse({ ...product, priceCents: 0.1 }).success).toBe(false);
        expect(productSchema.safeParse({ ...product, organizationId: 999 }).success).toBe(false);
        expect(productSchema.safeParse(null).success).toBe(false);
    });
});

describe("Zord · estoque isolado por empresa", () => {
    it("filtra produtos por organização e termo", async () => {
        query.mockResolvedValue([{ id: 1, name: "Caderno", sku: "CAD-01", price_cents: 1250, quantity: 4 }]);
        expect((await listProducts("token", "CAD"))[0]?.name).toBe("Caderno");
        expect(values()).toContain(17);
        expect(values()).toContain("%CAD%");
    });
    it("cadastra sem aceitar empresa enviada pelo cliente", async () => {
        query.mockResolvedValue([{ id: 7 }]);
        expect(await createProduct("token", product)).toBe(7);
        expect(values()).toContain(17);
        expect(values()).toContain(1250);
    });
    it("impede visualizar ou editar itens de outra organização", async () => {
        query.mockResolvedValue([]);
        await expect(getProduct("token", 99)).rejects.toBeInstanceOf(ProductNotFoundError);
        await expect(updateProduct("token", 99, product)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
    it("protege SKU duplicado com conflito de banco", async () => {
        query.mockRejectedValue({ code: "23505" });
        await expect(createProduct("token", product)).rejects.toBeInstanceOf(ProductConflictError);
    });
    it("recusa acesso sem sessão", async () => {
        session.mockResolvedValue(null);
        await expect(listProducts("token")).rejects.toBeInstanceOf(ProductAccessError);
        expect(query).not.toHaveBeenCalled();
    });
});
