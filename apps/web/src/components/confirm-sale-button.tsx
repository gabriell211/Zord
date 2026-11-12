"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function ConfirmSaleButton({ saleId }: { saleId: number }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function confirm() {
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`/api/vendas/${saleId}/confirmar`, {
                method: "POST",
                credentials: "same-origin",
            });
            if (!response.ok) {
                const data: unknown = await response.json().catch(() => null);
                const message = data && typeof data === "object" && "error" in data &&
                    typeof data.error === "string" ? data.error : "Não foi possível confirmar.";
                setError(message);
                return;
            }
            router.refresh();
        } catch {
            setError("Conexão indisponível. Confira o pedido antes de tentar novamente.");
        } finally { setSaving(false); }
    }

    return (
        <div>
            <button type="button" className="button button-primary" disabled={saving}
                onClick={confirm} aria-label="Confirmar pedido e dar baixa no estoque">
                {saving ? "Confirmando..." : "Confirmar pedido e baixar estoque"}
                <Icon name="check" size={18} />
            </button>
            {error && <p className="form-error" role="alert">{error}</p>}
        </div>
    );
}
