import { createHash } from "node:crypto";
import { z } from "zod";
import { database } from "@/lib/database";
import { getSessionUser } from "@/lib/identity";
import { createSaleSchema, type CreateSaleInput } from "@/lib/sales-validation";

const amountSchema = z.coerce.number().int().min(0).max(2_000_000_000_000);
const saleRow = z.object({
    id: z.number().int().positive(),
    customer_id: z.number().int().positive(),
    customer_name: z.string(),
    status: z.enum(["draft", "confirmed"]),
    total_cents: amountSchema,
    created_at: z.coerce.date(),
});
const lineRow = z.object({
    product_id: z.number().int().positive(),
    product_name: z.string(),
    sku: z.string().nullable(),
    quantity: z.number().int().positive(),
    unit_price_cents: z.number().int().nonnegative(),
    line_total_cents: amountSchema,
});
const productRow = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    sku: z.string().nullable(),
    price_cents: z.number().int().nonnegative(),
});
const idRow = z.object({ id: z.number().int().positive() });

export type Sale = {
    id: number;
    customerId: number;
    customerName: string;
    status: "draft" | "confirmed";
    totalCents: number;
    createdAt: string;
};
export type SaleItem = {
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
};

export class SaleAccessError extends Error {
    constructor() { super("Sessão inválida."); this.name = "SaleAccessError"; }
}
export class SaleNotFoundError extends Error {
    constructor() { super("Pedido não encontrado."); this.name = "SaleNotFoundError"; }
}
export class SaleDataError extends Error {
    constructor() { super("Cliente ou produto indisponível para esta empresa."); this.name = "SaleDataError"; }
}
export class SaleConflictError extends Error {
    constructor() { super("Chave de pedido já utilizada para outra operação."); this.name = "SaleConflictError"; }
}
export class SaleInsufficientStockError extends Error {
    constructor() { super("Estoque insuficiente para confirmar o pedido."); this.name = "SaleInsufficientStockError"; }
}

async function organizationFor(sessionId: string) {
    const user = await getSessionUser(sessionId);
    if (!user) throw new SaleAccessError();
    return { organizationId: user.organizationId, userId: user.uid };
}
function asSale(row: unknown): Sale {
    const sale = saleRow.parse(row);
    return {
        id: sale.id, customerId: sale.customer_id, customerName: sale.customer_name,
        status: sale.status, totalCents: sale.total_cents,
        createdAt: sale.created_at.toISOString(),
    };
}

export async function listSales(sessionId: string, query = ""): Promise<Sale[]> {
    const { organizationId } = await organizationFor(sessionId);
    const text = query.trim().slice(0, 80);
    const pattern = `%${text}%`;
    const db = database();
    const rows = await db`
        SELECT s.id, s.customer_id, c.name AS customer_name,
               s.status, s.total_cents, s.created_at
        FROM zord_sales AS s
        JOIN zord_customers AS c
          ON c.id = s.customer_id AND c.organization_id = s.organization_id
        WHERE s.organization_id = ${organizationId}
          AND (${text === ""} OR c.name ILIKE ${pattern} OR s.id::text = ${text})
        ORDER BY s.id DESC LIMIT 50
    `;
    return rows.map(asSale);
}

export async function getSale(sessionId: string, id: number): Promise<{ sale: Sale; items: SaleItem[] }> {
    const { organizationId } = await organizationFor(sessionId);
    const db = database();
    const headers = await db`
        SELECT s.id, s.customer_id, c.name AS customer_name,
               s.status, s.total_cents, s.created_at
        FROM zord_sales AS s
        JOIN zord_customers AS c
          ON c.id = s.customer_id AND c.organization_id = s.organization_id
        WHERE s.id = ${id} AND s.organization_id = ${organizationId}
        LIMIT 1
    `;
    if (!headers[0]) throw new SaleNotFoundError();
    const rows = await db`
        SELECT product_id, product_name, sku, quantity, unit_price_cents, line_total_cents
        FROM zord_sale_items WHERE organization_id = ${organizationId} AND sale_id = ${id}
        ORDER BY id
    `;
    return {
        sale: asSale(headers[0]),
        items: rows.map((row) => {
            const item = lineRow.parse(row);
            return {
                productId: item.product_id, productName: item.product_name,
                sku: item.sku ?? "", quantity: item.quantity,
                unitPriceCents: item.unit_price_cents, lineTotalCents: item.line_total_cents,
            };
        }),
    };
}

export async function createSale(sessionId: string, payload: CreateSaleInput): Promise<number> {
    const input = createSaleSchema.parse(payload);
    const { organizationId, userId } = await organizationFor(sessionId);
    const canonical = [...input.items].sort((a, b) => a.productId - b.productId);
    const fingerprint = createHash("sha256")
        .update(JSON.stringify({ customerId: input.customerId, items: canonical }))
        .digest("hex");
    const db = database();

    return db.begin(async (tx) => {
        const existing = await tx`
            SELECT id, request_fingerprint
            FROM zord_sales
            WHERE organization_id = ${organizationId}
              AND idempotency_key = ${input.idempotencyKey}
        `;
        if (existing[0]) {
            if (existing[0].request_fingerprint !== fingerprint) throw new SaleConflictError();
            return idRow.parse(existing[0]).id;
        }

        const customers = await tx`
            SELECT id FROM zord_customers
            WHERE id = ${input.customerId}
              AND organization_id = ${organizationId} AND active = true
            LIMIT 1
        `;
        if (!customers[0]) throw new SaleDataError();

        const ids = canonical.map((item) => item.productId);
        const products = await tx`
            SELECT id, name, sku, price_cents
            FROM zord_products
            WHERE organization_id = ${organizationId}
              AND active = true AND id IN ${tx(ids)}
            ORDER BY id
            FOR SHARE
        `;
        if (products.length !== ids.length) throw new SaleDataError();
        const byId = new Map(products.map((value) => {
            const product = productRow.parse(value);
            return [product.id, product] as const;
        }));

        const lines = canonical.map((item) => {
            const product = byId.get(item.productId);
            if (!product) throw new SaleDataError();
            return { product, quantity: item.quantity };
        });
        const total = lines.reduce(
            (sum, line) => sum + line.quantity * line.product.price_cents, 0,
        );
        if (!Number.isSafeInteger(total) || total > 2_000_000_000_000) throw new SaleDataError();

        const created = await tx`
            INSERT INTO zord_sales (
                organization_id, customer_id, created_by, idempotency_key,
                request_fingerprint, status, total_cents
            ) VALUES (
                ${organizationId}, ${input.customerId}, ${userId},
                ${input.idempotencyKey}, ${fingerprint}, 'draft', ${total}
            )
            ON CONFLICT (organization_id, idempotency_key) DO NOTHING
            RETURNING id
        `;
        if (!created[0]) {
            const winner = await tx`
                SELECT id, request_fingerprint FROM zord_sales
                WHERE organization_id = ${organizationId}
                  AND idempotency_key = ${input.idempotencyKey}
                LIMIT 1
            `;
            if (!winner[0] || winner[0].request_fingerprint !== fingerprint) throw new SaleConflictError();
            return idRow.parse(winner[0]).id;
        }
        const saleId = idRow.parse(created[0]).id;
        for (const { product, quantity } of lines) {
            await tx`
                INSERT INTO zord_sale_items (
                    organization_id, sale_id, product_id, product_name,
                    sku, quantity, unit_price_cents
                ) VALUES (
                    ${organizationId}, ${saleId}, ${product.id}, ${product.name},
                    ${product.sku}, ${quantity}, ${product.price_cents}
                )
            `;
        }
        return saleId;
    });
}

export async function confirmSale(sessionId: string, id: number): Promise<void> {
    const { organizationId } = await organizationFor(sessionId);
    const db = database();
    await db.begin(async (tx) => {
        const sales = await tx`
            SELECT id, status FROM zord_sales
            WHERE id = ${id} AND organization_id = ${organizationId}
            FOR UPDATE
        `;
        if (!sales[0]) throw new SaleNotFoundError();
        if (sales[0].status === "confirmed") return;

        const rows = await tx`
            SELECT product_id, quantity FROM zord_sale_items
            WHERE sale_id = ${id} AND organization_id = ${organizationId}
            ORDER BY product_id
        `;
        if (!rows.length) throw new SaleDataError();
        for (const row of rows) {
            const item = z.object({
                product_id: z.number().int().positive(),
                quantity: z.number().int().positive(),
            }).parse(row);
            const updated = await tx`
                UPDATE zord_products
                SET quantity = quantity - ${item.quantity}, updated_at = now()
                WHERE organization_id = ${organizationId} AND id = ${item.product_id}
                  AND active = true AND quantity >= ${item.quantity}
                RETURNING id
            `;
            if (!updated[0]) throw new SaleInsufficientStockError();
        }
        await tx`
            UPDATE zord_sales
            SET status = 'confirmed', confirmed_at = now(), updated_at = now()
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;
    });
}
