import { z } from "zod";

const databaseId = z.number().int().min(1).max(2_147_483_647);
export const saleItemSchema = z.strictObject({
    productId: databaseId,
    quantity: z.number().int().min(1).max(1000),
});
export const createSaleSchema = z.strictObject({
    customerId: databaseId,
    idempotencyKey: z.uuid(),
    items: z.array(saleItemSchema).min(1).max(20).superRefine((items, context) => {
        const seen = new Set<number>();
        for (const [index, item] of items.entries()) {
            if (seen.has(item.productId)) {
                context.addIssue({
                    code: "custom",
                    path: [index, "productId"],
                    message: "Não repita o mesmo produto no pedido.",
                });
            }
            seen.add(item.productId);
        }
    }),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export function saleNumber(id: number): string {
    return `ZV-${String(id).padStart(6, "0")}`;
}
