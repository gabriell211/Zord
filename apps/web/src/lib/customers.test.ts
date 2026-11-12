import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer, CustomerAccessError, CustomerNotFoundError, getCustomer, listCustomers, updateCustomer } from "@/lib/customers";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";

vi.mock("@/lib/database", () => ({ database: vi.fn() }));
vi.mock("@/lib/identity", () => ({ getSessionUser: vi.fn() }));

const db = vi.mocked(database);
const session = vi.mocked(getSessionUser);
const query = vi.fn();

beforeEach(() => {
    db.mockReset().mockReturnValue(query as unknown as ReturnType<typeof database>);
    session.mockReset().mockResolvedValue({
        uid: 4, name: "Responsável", username: "a@b.com", organizationId: 17, role: "owner",
    });
    query.mockReset();
});

const row = { id: 7, name: "Empresa Alfa", email: "alfa@example.com", phone: "48999999999" };

function interpolatedValues(): unknown[] {
    return query.mock.calls[0]?.slice(1) ?? [];
}

describe("Zord · clientes isolados por empresa", () => {
    it("lista apenas os registros com filtro do tenant da sessão", async () => {
        query.mockResolvedValue([row]);
        const customers = await listCustomers("token", "Alfa");
        expect(customers[0]?.name).toBe("Empresa Alfa");
        expect(interpolatedValues()).toContain(17);
        expect(interpolatedValues()).toContain("%Alfa%");
    });

    it("cadastra na empresa da sessão, nunca em tenant arbitrário", async () => {
        query.mockResolvedValue([{ id: 8 }]);
        expect(await createCustomer("token", {
            nome: "Empresa Beta", email: "", telefone: "",
        })).toBe(8);
        expect(interpolatedValues()).toContain(17);
        expect(interpolatedValues()).toContain("Empresa Beta");
        expect(interpolatedValues()).not.toContain(99);
    });

    it("recusa ler clientes de outra empresa", async () => {
        query.mockResolvedValue([]);
        await expect(getCustomer("token", 999)).rejects.toBeInstanceOf(CustomerNotFoundError);
        expect(interpolatedValues()).toContain(17);
    });

    it("atualiza campos validados apenas no tenant da sessão", async () => {
        query.mockResolvedValue([{ id: 7 }]);
        await updateCustomer("token", 7, { telefone: "(48) 3456-1234" });
        expect(interpolatedValues()).toContain(17);
        expect(interpolatedValues()).toContain(7);
        expect(interpolatedValues()).toContain("(48) 3456-1234");
    });

    it("rejeita alterações sem campos ou em registro não visível", async () => {
        await expect(updateCustomer("token", 7, {})).rejects.toThrow();
        query.mockResolvedValue([]);
        await expect(updateCustomer("token", 999, { nome: "Outro" })).rejects.toBeInstanceOf(CustomerNotFoundError);
    });

    it("exige uma sessão ativa", async () => {
        session.mockResolvedValue(null);
        await expect(listCustomers("token", "")).rejects.toBeInstanceOf(CustomerAccessError);
        expect(query).not.toHaveBeenCalled();
    });
});
