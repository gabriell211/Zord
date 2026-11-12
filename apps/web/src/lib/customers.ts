import { z } from "zod";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";
import { atualizarClienteSchema, clienteSchema, type ClienteInput } from "@/lib/validation";

const customerSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
});

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

export class CustomerAccessError extends Error {
    constructor() {
        super("Sessão sem acesso a clientes.");
        this.name = "CustomerAccessError";
    }
}

async function organizationFor(sessionId: string): Promise<number> {
    const user = await getSessionUser(sessionId);
    if (!user) throw new CustomerAccessError();
    return user.organizationId;
}

function toCustomer(value: unknown): Customer {
    const parsed = customerSchema.parse(value);
    return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email ?? "",
        phone: parsed.phone ?? "",
    };
}

export async function listCustomers(sessionId: string, query = ""): Promise<Customer[]> {
    const organizationId = await organizationFor(sessionId);
    const text = query.trim().slice(0, 80);
    const pattern = "%" + text + "%";
    const db = database();
    const rows = await db`
        SELECT id, name, email, phone
        FROM zord_customers
        WHERE organization_id = ${organizationId}
          AND active = true
          AND (${text === ""} OR name ILIKE ${pattern} OR COALESCE(email, '') ILIKE ${pattern})
        ORDER BY id DESC
        LIMIT 50
    `;
    return rows.map(toCustomer);
}

export async function getCustomer(sessionId: string, id: number): Promise<Customer> {
    const organizationId = await organizationFor(sessionId);
    const db = database();
    const rows = await db`
        SELECT id, name, email, phone
        FROM zord_customers
        WHERE organization_id = ${organizationId} AND id = ${id} AND active = true
        LIMIT 1
    `;
    if (!rows[0]) throw new CustomerNotFoundError();
    return toCustomer(rows[0]);
}

export async function createCustomer(sessionId: string, data: ClienteInput): Promise<number> {
    const validated = clienteSchema.parse(data);
    const organizationId = await organizationFor(sessionId);
    const db = database();
    const rows = await db`
        INSERT INTO zord_customers (organization_id, name, email, phone)
        VALUES (
            ${organizationId},
            ${validated.nome},
            ${validated.email || null},
            ${validated.telefone || null}
        )
        RETURNING id
    `;
    return z.number().int().positive().parse(rows[0]?.id);
}

export async function updateCustomer(
    sessionId: string,
    id: number,
    values: Partial<ClienteInput>,
): Promise<void> {
    const parsed = atualizarClienteSchema.parse(values);
    const organizationId = await organizationFor(sessionId);
    const db = database();
    const rows = await db`
        UPDATE zord_customers
        SET name = CASE WHEN ${parsed.nome !== undefined} THEN ${parsed.nome ?? ""} ELSE name END,
            email = CASE WHEN ${parsed.email !== undefined} THEN ${parsed.email || null} ELSE email END,
            phone = CASE WHEN ${parsed.telefone !== undefined} THEN ${parsed.telefone || null} ELSE phone END,
            updated_at = now()
        WHERE id = ${id} AND organization_id = ${organizationId} AND active = true
        RETURNING id
    `;
    if (rows.length === 0) throw new CustomerNotFoundError();
}
