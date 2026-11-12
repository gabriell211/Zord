import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCustomer, getCustomer, listCustomers, updateCustomer, CustomerNotFoundError } from "@/lib/customers";
import { modelCall } from "@/lib/erp";

vi.mock("@/lib/erp", async (importOriginal) => {
    const real = await importOriginal<typeof import("@/lib/erp")>();
    return { ...real, modelCall: vi.fn() };
});

const call = vi.mocked(modelCall);
const row = { id: 7, name: "Empresa Alfa", email: "contato@alfa.com.br", phone: "48999999999", customer_rank: 1 };

beforeEach(() => call.mockReset());

describe("Zord · clientes com permissoes ERP", () => {
    it("busca apenas clientes visiveis ao usuario", async () => {
        call.mockResolvedValue([row]);
        const result = await listCustomers("sessao", "Alfa");
        expect(result[0]?.name).toBe("Empresa Alfa");
        expect(call).toHaveBeenCalledWith("sessao", "res.partner", "search_read", [], expect.objectContaining({
            domain: [["customer_rank", ">", 0], ["active", "=", true], "|", ["name", "ilike", "Alfa"], ["email", "ilike", "Alfa"]],
        }));
    });

    it("cria apenas os campos autorizados com status de cliente", async () => {
        call.mockResolvedValue(8);
        expect(await createCustomer("sessao", { nome: "Empresa Beta", email: "", telefone: "" })).toBe(8);
        expect(call).toHaveBeenCalledWith("sessao", "res.partner", "create", [{
            name: "Empresa Beta", email: false, phone: false, customer_rank: 1,
        }]);
    });

    it("recusa editar um registro que nao pertence ao cadastro de clientes", async () => {
        call.mockResolvedValue([{ ...row, customer_rank: 0 }]);
        await expect(updateCustomer("sessao", 7, { nome: "Empresa Atualizada" })).rejects.toBeInstanceOf(CustomerNotFoundError);
        expect(call).toHaveBeenCalledTimes(1);
    });

    it("atualiza somente os dados permitidos", async () => {
        call.mockResolvedValueOnce([row]).mockResolvedValueOnce(true);
        await updateCustomer("sessao", 7, { telefone: "(48) 3456-1234" });
        expect(call).toHaveBeenLastCalledWith("sessao", "res.partner", "write", [[7], { phone: "(48) 3456-1234" }]);
    });

    it("nao encontra ids arbitrarios", async () => {
        call.mockResolvedValue([]);
        await expect(getCustomer("sessao", 999)).rejects.toBeInstanceOf(CustomerNotFoundError);
    });
});
