"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function logout() {
        if (loading) return;
        setLoading(true);
        try {
            await fetch("/api/autenticacao/sair", { method: "POST", credentials: "same-origin" });
        } finally {
            router.replace("/login");
            router.refresh();
        }
    }

    return (
        <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
            disabled={loading}
            aria-label={loading ? "Encerrando sessão" : "Encerrar sessão"}
        >
            <Icon name="logout" size={19} />
            <span>{loading ? "Saindo..." : "Sair da conta"}</span>
        </button>
    );
}
