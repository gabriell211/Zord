import { z } from "zod";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";
import { productSchema, type ProductInput } from "@/lib/products-validation";

const productRow = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    sku: z.string().nullable(),
    price_cents: z.number().int().nonnegative(),
    quantity: z.number().int().nonnegative(),
});

export type Product = {
    id: number;
    name: string;
    sku: string;
    priceCents: number;
    quantity: number;
};

export class ProductAccessError extends Error {
    constructor() { super("Sessão inválida."); this.name = "ProductAccessError"; }
}
export class ProductNotFoundError extends Error {
    constructor() { super("Produto não encontrado."); this.name = "ProductNotFoundError"; }
}
export class ProductConflictError extends Error {
    constructor() { super("Já existe um produto com essa referência."); this.name = "ProductConflictError"; }
}

async function organizationFor(sessionId: string): Promise<number> {
    const session = await getSessionUser(sessionId);
    if (!session) throw new ProductAccessError();
    return session.organizationId;
}

function toProduct(row: unknown): Product {
    const parsed = productRow.parse(row);
    return {
        id: parsed.id, name: parsed.name, sku: parsed.sku ?? "",
        priceCents: parsed.price_cents, quantity: parsed.quantity,
    };
}

function rethrowUnique(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new ProductConflictError();
    }
    throw error;
}

export async function listProducts(sessionId: string, query = ""): Promise<Product[]> {
    const organizationId = await organizationFor(sessionId);
    const text = query.trim().slice(0, 80);
    const pattern = `%${text}%`;
    const db = database();
    const rows = await db`
        SELECT id, name, sku, price_cents, quantity
        FROM zord_products
        WHERE organization_id = ${organizationId}
          AND active = true
          AND (${text === ""} OR name ILIKE ${pattern} OR COALESCE(sku, '') ILIKE ${pattern})
        ORDER BY id DESC LIMIT 50
    `;
    return rows.map(toProduct);
}

export async function getProduct(sessionId: string, id: number): Promise<Product> {
    const organizationId = await organizationFor(sessionId);
    const db = database();
    const rows = await db`
        SELECT id, name, sku, price_cents, quantity
        FROM zord_products
        WHERE organization_id = ${organizationId} AND id = ${id} AND active = true
        LIMIT 1
    `;
    if (!rows[0]) throw new ProductNotFoundError();
    return toProduct(rows[0]);
}

export async function createProduct(sessionId: string, input: ProductInput): Promise<number> {
    const product = productSchema.parse(input);
    const organizationId = await organizationFor(sessionId);
    const db = database();
    try {
        const rows = await db`
            INSERT INTO zord_products (organization_id, name, sku, price_cents, quantity)
            VALUES (${organizationId}, ${product.name}, ${product.sku || null},
                    ${product.priceCents}, ${product.quantity})
            RETURNING id
        `;
        return z.number().int().positive().parse(rows[0]?.id);
    } catch (error) { rethrowUnique(error); }
}

export async function updateProduct(sessionId: string, id: number, input: ProductInput): Promise<void> {
    const product = productSchema.parse(input);
    const organizationId = await organizationFor(sessionId);
    const db = database();
    try {
        const rows = await db`
            UPDATE zord_products
            SET name = ${product.name}, sku = ${product.sku || null},
                price_cents = ${product.priceCents}, quantity = ${product.quantity},
                updated_at = now()
            WHERE organization_id = ${organizationId} AND id = ${id} AND active = true
            RETURNING id
        `;
        if (!rows[0]) throw new ProductNotFoundError();
    } catch (error) { rethrowUnique(error); }
}
