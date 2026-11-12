import { z } from "zod";

export const productSchema = z.strictObject({
    name: z.string().trim().min(2, "Informe o nome do produto.").max(160),
    sku: z.string().trim().max(64).regex(/^[\\p{L}\\p{N} _./-]*$/u, "Referência inválida."),
    priceCents: z.number().int().min(0).max(99_999_999),
    quantity: z.number().int().min(0).max(1_000_000),
});

export type ProductInput = z.infer<typeof productSchema>;

export function parsePriceBRL(value: string): number | null {
    const text = value.trim();
    if (!/^(?:0|[1-9]\\d{0,5})(?:[,.]\\d{1,2})?$/.test(text)) return null;
    const [whole, cents = ""] = text.replace(",", ".").split(".");
    const result = Number(whole) * 100 + Number(cents.padEnd(2, "0"));
    return Number.isSafeInteger(result) && result <= 99_999_999 ? result : null;
}

export function formatPriceBRLInput(cents: number): string {
    return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}
