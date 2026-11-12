"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { Customer } from "@/lib/customers";
import type { Product } from "@/lib/products";
import { createSaleSchema } from "@/lib/sales-validation";

type Line = { productId: number; quantity: number };
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function SalesForm({ customers, products }: { customers: Customer[]; products: Product[] }) {
    const router = useRouter();
    const keyRef = useRef<string | null>(null);
    const [customerId, setCustomerId] = useState(0);
    const [productId, setProductId] = useState(0);
    const [quantity, setQuantity] = useState("1");
    const [lines, setLines] = useState<Line[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const items = lines.map((line) => ({
        ...line,
        product: products.find((product) => product.id === line.productId),
    }));
    const total = items.reduce(
        (value, line) => value + (line.product?.priceCents ?? 0) * line.quantity, 0,
    );

    function addLine() {
        const product = products.find((entry) => entry.id === productId);
        const amount = Number(quantity);
        if (!product || !Number.isInteger(amount) || amount < 1 || amount > 1000) {
            setError("Escolha um produto e uma quantidade entre 1 e 1000.");
            return;
        }
        if (lines.some((line) => line.productId === productId)) {
            setError("Este produto já está no pedido.");
            return;
        }
        if (lines.length >= 20) {
            setError("Cada pedido aceita até 20 produtos diferentes.");
            return;
        }
        keyRef.current = null;
        setLines((current) => [...current, { productId, quantity: amount }]);
        setProductId(0);
        setQuantity("1");
        setError("");
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        keyRef.current ??= crypto.randomUUID();
        const parsed = createSaleSchema.safeParse({
            customerId, idempotencyKey: keyRef.current,
            items: lines.map(({ productId: id, quantity: amount }) => ({
                productId: id, quantity: amount,
            })),
        });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Confira o pedido.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/vendas", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!response.ok) {
                const data: unknown = await response.json().catch(() => null);
                const message = data && typeof data === "object" && "error" in data &&
                    typeof data.error === "string" ? data.error : "Não foi possível salvar o pedido.";
                setError(response.status === 401 ? "Sessão expirada. Entre novamente." : message);
                return;
            }
            const data: unknown = await response.json();
            if (!data || typeof data !== "object" || !("id" in data) ||
                typeof data.id !== "number" || !Number.isInteger(data.id) || data.id < 1) {
                setError("O servidor retornou uma resposta inválida.");
                return;
            }
            router.push(`/vendas/${data.id}`);
            router.refresh();
        } catch {
            setError("Falha na conexão. Tente novamente para reutilizar a mesma chave de pedido.");
        } finally { setSaving(false); }
    }

    return (
        <form className="customer-form" onSubmit={submit} noValidate>
            <div className="customer-form-heading">
                <span className="panel-kicker">PEDIDO COMERCIAL</span>
                <h2>Montar proposta</h2>
                <p>O preço de cada item é registrado no momento da criação. Nenhum saldo é descontado nesta etapa.</p>
            </div>
            <div className="customer-fields">
                <div className="form-field">
                    <label htmlFor="venda-cliente">Cliente <span aria-hidden="true">*</span></label>
                    <select id="venda-cliente" required value={customerId} disabled={saving}
                        onChange={(event) => { keyRef.current = null; setCustomerId(Number(event.target.value)); }}>
                        <option value={0}>Selecione um cliente</option>
                        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                    </select>
                </div>
                <div className="customer-fields-row">
                    <div className="form-field">
                        <label htmlFor="venda-produto">Produto</label>
                        <select id="venda-produto" value={productId} disabled={saving}
                            onChange={(event) => setProductId(Number(event.target.value))}>
                            <option value={0}>Selecione um produto</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}{product.sku ? ` (${product.sku})` : ""} — {brl.format(product.priceCents / 100)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label htmlFor="venda-quantidade">Quantidade</label>
                        <input id="venda-quantidade" type="number" min={1} max={1000} step={1}
                            required value={quantity} disabled={saving}
                            onChange={(event) => setQuantity(event.target.value)} />
                    </div>
                </div>
                <button type="button" className="button button-secondary" onClick={addLine} disabled={saving}>
                    Adicionar item <Icon name="check" size={17} />
                </button>
                {lines.length > 0 && <div className="table-scroll" tabIndex={0} role="region" aria-label="Produtos selecionados">
                    <table className="data-table">
                        <thead><tr>
                            <th scope="col">Produto</th><th scope="col">Qtde.</th>
                            <th scope="col">Subtotal</th><th scope="col" className="table-end">Ações</th>
                        </tr></thead>
                        <tbody>
                            {items.map((item) => <tr key={item.productId}>
                                <td className="table-primary">{item.product?.name ?? "Produto"}</td>
                                <td>{item.quantity}</td>
                                <td>{brl.format((item.product?.priceCents ?? 0) * item.quantity / 100)}</td>
                                <td className="table-end">
                                    <button type="button" className="customer-edit-link" disabled={saving}
                                        onClick={() => {
                                            keyRef.current = null;
                                            setLines((current) => current.filter((line) => line.productId !== item.productId));
                                        }}>
                                        Remover
                                    </button>
                                </td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>}
                <p className="form-description">Total do pedido: <strong>{brl.format(total / 100)}</strong></p>
                {error && <p className="form-error" role="alert">{error}</p>}
            </div>
            <div className="customer-form-footer">
                <Link className="button button-secondary" href="/vendas">Cancelar</Link>
                <button className="button button-primary" type="submit" disabled={saving || lines.length === 0}>
                    {saving ? "Salvando..." : "Salvar como rascunho"} <Icon name="arrow-right" size={17} />
                </button>
            </div>
        </form>
    );
}
