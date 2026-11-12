import { z } from "zod";
import { modelCall, ErpRequestError } from "@/lib/erp";
import { clienteSchema, type ClienteInput } from "@/lib/validation";

const customerSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.union([z.string(), z.literal(false)]).optional(),
    phone: z.union([z.string(), z.literal(false)]).optional(),
    customer_rank: z.number().int().nonnegative(),
});

const customersSchema = z.array(customerSchema);

export type Customer = {
    id: number;
    name: string;
    email: string;
    phone: string;
};

export class CustomerNotFoundError extends Error {
    constructor() {
        super("Cliente não encontrado.");
        this.name = "CustomerNotFoundError";
    }
}

function customerFromRecord(record: z.infer<typeof customerSchema>): Customer {
    return {
        id: record.id,
        name: record.name,
        email: typeof record.email === "string" ? record.email : "",
        phone: typeof record.phone === "string" ? record.phone : "",
    };
}

function allowedValues(data: Partial<ClienteInput>): Record<string, string | false> {
    const values: Record<string, string | false> = {};
    if (data.nome !== undefined) values.name = data.nome;
    if (data.email !== undefined) values.email = data.email || false;
    if (data.telefone !== undefined) values.phone = data.telefone || false;
    return values;
}

export async function listCustomers(sessionId: string, query = ""): Promise<Customer[]> {
    const domain: unknown[][] = [["customer_rank", ">", 0], ["active", "=", true]];
    if (query.trim()) {
        domain.push("|", ["name", "ilike", query.trim()], ["email", "ilike", query.trim()]);
    }
    const result = await modelCall(sessionId, "res.partner", "search_read", [], {
        domain,
        fields: ["name", "email", "phone", "customer_rank"],
        limit: 50,
        order: "id desc",
    });
    const parsed = customersSchema.safeParse(result);
    if (!parsed.success) throw new ErpRequestError();
    return parsed.data.filter((record) => record.customer_rank > 0).map(customerFromRecord);
}

export async function getCustomer(sessionId: string, id: number): Promise<Customer> {
    const result = await modelCall(sessionId, "res.partner", "search_read", [], {
        domain: [["id", "=", id], ["customer_rank", ">", 0]],
        fields: ["name", "email", "phone", "customer_rank"],
        limit: 1,
    });
    const parsed = customersSchema.safeParse(result);
    if (!parsed.success) throw new ErpRequestError();
    const record = parsed.data.find((customer) => customer.id === id && customer.customer_rank > 0);
    if (!record) throw new CustomerNotFoundError();
    return customerFromRecord(record);
}

export async function createCustomer(sessionId: string, data: ClienteInput): Promise<number> {
    const validated = clienteSchema.parse(data);
    const values = { ...allowedValues(validated), customer_rank: 1 };
    const response = await modelCall(sessionId, "res.partner", "create", [values]);
    const parsed = z.number().int().positive().safeParse(response);
    if (!parsed.success) throw new ErpRequestError();
    return parsed.data;
}

export async function updateCustomer(
    sessionId: string,
    id: number,
    values: Partial<ClienteInput>,
): Promise<void> {
    await getCustomer(sessionId, id);
    const changed = allowedValues(values);
    if (Object.keys(changed).length === 0) throw new ErpRequestError();
    const updated = await modelCall(sessionId, "res.partner", "write", [[id], changed]);
    if (updated !== true) throw new ErpRequestError();
}
