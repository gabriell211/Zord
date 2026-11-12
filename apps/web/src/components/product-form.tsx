"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { Product } from "@/lib/products";
import { formatPriceBRLInput, parsePriceBRL, productSchema } from "@/lib/products-validation";

export function ProductForm({ initial }: { initial?: Product }) {
    const router = useRouter();
    const [name, setName] = useState(initial?.name ?? "");
    const [sku, setSku] = useState(initial?.sku ?? "");
    const [price, setPrice] = useState(initial ? formatPriceBRLInput(initial.priceCents) : "0,00");
    const [quantity, setQuantity] = useState(String(initial?.quantity ?? 0));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const editing = Boolean(initial);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const priceCents = parsePriceBRL(price);
        const parsed = productSchema.safeParse({
            name, sku, priceCents, quantity: /^[0-9]+$/.test(quantity) ? Number(quantity) : Number.NaN,
        });
        if (!parsed.success) {
            setError(priceCents === null ? "Informe o preço em reais, por exemplo: 29,90." :
                parsed.error.issues[0]?.message ?? "Verifique os dados.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const response = await fetch(editing ? `/api/produtos/${initial?.id}` : "/api/produtos", {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(parsed.data),
            });
            if (!response.ok) {
                if (response.status === 409) setError("Essa referência já está cadastrada para sua empresa.");
                else if (response.status === 401) setError("Sua sessão expirou. Entre novamente.");
                else if (response.status === 422) setError("Revise os dados do produto.");
                else setError("Não foi possível salvar o produto. Tente novamente.");
                return;
            }
            router.push("/estoque?salvo=1");
            router.refresh();
        } catch {
            setError("Falha de conexão. Verifique sua rede.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={save} className="customer-form" noValidate>
            <div className="customer-form-heading">
                <span className="panel-kicker">CATÁLOGO DE PRODUTOS</span>
                <h2>{editing ? "Editar produto" : "Novo produto"}</h2>
                <p>Preços em reais, gravados em centavos para evitar erros de arredondamento.</p>
            </div>
            <div className="customer-fields">
                <div className="form-field">
                    <label htmlFor="produto-nome">Nome do produto <span aria-hidden="true">*</span></label>
                    <input id="produto-nome" required autoComplete="off" maxLength={160}
                        value={name} onChange={(event) => setName(event.target.value)}
                        placeholder="Ex.: Caderno 100 folhas" disabled={saving} />
                </div>
                <div className="customer-fields-row">
                    <div className="form-field">
                        <label htmlFor="produto-sku">Referência / SKU</label>
                        <input id="produto-sku" maxLength={64} autoComplete="off"
                            value={sku} onChange={(event) => setSku(event.target.value)}
                            placeholder="Ex.: CAD-100" disabled={saving} />
                    </div>
                    <div className="form-field">
                        <label htmlFor="produto-preco">Preço (R$) <span aria-hidden="true">*</span></label>
                        <input id="produto-preco" required inputMode="decimal" maxLength={10}
                            value={price} onChange={(event) => setPrice(event.target.value)}
                            placeholder="Ex.: 29,90" disabled={saving} />
                    </div>
                </div>
                <div className="form-field">
                    <label htmlFor="produto-estoque">Quantidade em estoque <span aria-hidden="true">*</span></label>
                    <input id="produto-estoque" required type="number" min={0} max={1000000} step={1}
                        value={quantity} onChange={(event) => setQuantity(event.target.value)}
                        disabled={saving} />
                </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="customer-form-footer">
                <Link href="/estoque" className="button button-secondary">Cancelar</Link>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar produto"}
                    <Icon name="arrow-right" size={17} />
                </button>
            </div>
        </form>
    );
}
