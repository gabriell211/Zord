import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";
import {
    confirmSale, listSales, SaleAccessError, SaleInsufficientStockError, SaleNotFoundError,
} from "@/lib/sales";

vi.mock("@/lib/database", () => ({ database: vi.fn() }));
vi.mock("@/lib/identity", () => ({ getSessionUser: vi.fn() }));

const mockDatabase = vi.mocked(database);
const mockSession = vi.mocked(getSessionUser);
const query = vi.fn();
const tx = vi.fn();
const begin = vi.fn(async (callback: (connection: typeof tx) => Promise<unknown>) => callback(tx));
const client = Object.assign(query, { begin });
const sqlText = (call: unknown[]): string => {
    const segments = call[0];
    return Array.isArray(segments) ? segments.join("?") : "";
};

beforeEach(() => {
    mockSession.mockReset().mockResolvedValue({
        uid: 7, name: "Administrador", username: "admin@zord.test",
        organizationId: 19, role: "owner",
    });
    mockDatabase.mockReset().mockReturnValue(client as unknown as ReturnType<typeof database>);
    query.mockReset();
    tx.mockReset();
    begin.mockClear();
});

describe("Zord · pedidos isolados", () => {
    it("nunca consulta pedidos sem organização na sessão", async () => {
        mockSession.mockResolvedValue(null);
        await expect(listSales("token")).rejects.toBeInstanceOf(SaleAccessError);
        expect(query).not.toHaveBeenCalled();
    });
    it("busca com o tenant da sessão e não com o parâmetro de pesquisa", async () => {
        query.mockResolvedValue([]);
        await expect(listSales("token", "cliente")).resolves.toEqual([]);
        const params = query.mock.calls[0]?.slice(1) ?? [];
        expect(params).toContain(19);
        expect(params).toContain("%cliente%");
    });
});

describe("Zord · confirmação de pedidos", () => {
    it("não faz segunda baixa para pedido confirmado", async () => {
        tx.mockResolvedValueOnce([{ id: 7, status: "confirmed" }]);
        await expect(confirmSale("token", 7)).resolves.toBeUndefined();
        expect(tx).toHaveBeenCalledTimes(1);
        expect(begin).toHaveBeenCalledOnce();
    });
    it("bloqueia pedido de outra organização", async () => {
        tx.mockResolvedValueOnce([]);
        await expect(confirmSale("token", 99)).rejects.toBeInstanceOf(SaleNotFoundError);
        const params = tx.mock.calls[0]?.slice(1) ?? [];
        expect(params).toContain(19);
    });
    it("falha sem confirmar quando o estoque é insuficiente", async () => {
        tx.mockResolvedValueOnce([{ id: 7, status: "draft" }]);
        tx.mockResolvedValueOnce([{ product_id: 10, quantity: 3 }]);
        tx.mockResolvedValueOnce([]);
        await expect(confirmSale("token", 7)).rejects.toBeInstanceOf(SaleInsufficientStockError);
        expect(tx.mock.calls.some((call) => sqlText(call).includes("SET status = 'confirmed'"))).toBe(false);
    });
    it("baixa saldo e marca a confirmação apenas após todos os itens", async () => {
        tx.mockResolvedValueOnce([{ id: 7, status: "draft" }]);
        tx.mockResolvedValueOnce([{ product_id: 10, quantity: 2 }, { product_id: 20, quantity: 1 }]);
        tx.mockResolvedValueOnce([{ id: 10 }]);
        tx.mockResolvedValueOnce([{ id: 20 }]);
        tx.mockResolvedValueOnce([]);
        await confirmSale("token", 7);
        expect(tx).toHaveBeenCalledTimes(5);
        expect(sqlText(tx.mock.calls[4] ?? [])).toContain("SET status = 'confirmed'");
    });
});
