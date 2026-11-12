import { describe, expect, it } from "vitest";
import { createSaleSchema, saleNumber } from "@/lib/sales-validation";

const example = {
    customerId: 1,
    idempotencyKey: "019511e4-8557-7b0d-91f8-933659834ddd",
    items: [{ productId: 2, quantity: 1 }],
};

describe("Zord · pedidos comerciais", () => {
    it("aceita um pedido válido com chave de idempotência", () => {
        expect(createSaleSchema.safeParse(example).success).toBe(true);
        expect(saleNumber(37)).toBe("ZV-000037");
    });
    it("rejeita itens duplicados ou vazios", () => {
        expect(createSaleSchema.safeParse({ ...example, items: [] }).success).toBe(false);
        expect(createSaleSchema.safeParse({ ...example, items: [example.items[0], example.items[0]] }).success).toBe(false);
    });
    it("rejeita quantidades inválidas e dados de outra empresa", () => {
        expect(createSaleSchema.safeParse({ ...example, organizationId: 50 }).success).toBe(false);
        for (const quantity of [-1, 0, 0.5, 1001]) {
            expect(createSaleSchema.safeParse({ ...example, items: [{ productId: 2, quantity }] }).success).toBe(false);
        }
        expect(createSaleSchema.safeParse({ ...example, customerId: 0 }).success).toBe(false);
        expect(createSaleSchema.safeParse({ ...example, idempotencyKey: "repetido" }).success).toBe(false);
    });
});
