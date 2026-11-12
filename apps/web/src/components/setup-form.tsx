"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { configuracaoInicialSchema } from "@/lib/validation";

export function SetupForm() {
    const router = useRouter();
    const [empresa, setEmpresa] = useState("");
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [token, setToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const parsed = configuracaoInicialSchema.safeParse({ empresa, nome, email, senha, token });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/instalacao/admin", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!response.ok) {
                setError(response.status === 403
                    ? "Chave inválida ou instalação já concluída."
                    : response.status === 503
                        ? "Banco de dados indisponível."
                        : "Confira os dados informados.");
                return;
            }
            router.replace("/painel");
            router.refresh();
        } catch {
            setError("Não foi possível conectar. Verifique sua internet.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="login-form" onSubmit={submit} noValidate>
            <div className="form-field">
                <label htmlFor="setup-empresa">Empresa</label>
                <input id="setup-empresa" required maxLength={160} autoComplete="organization"
                    value={empresa} onChange={(event) => setEmpresa(event.target.value)}
                    placeholder="Razão social ou nome fantasia" disabled={saving} />
            </div>
            <div className="form-field">
                <label htmlFor="setup-nome">Nome do administrador</label>
                <input id="setup-nome" required maxLength={160} autoComplete="name"
                    value={nome} onChange={(event) => setNome(event.target.value)}
                    placeholder="Seu nome" disabled={saving} />
            </div>
            <div className="form-field">
                <label htmlFor="setup-email">E-mail do administrador</label>
                <input id="setup-email" required maxLength={254} type="email" autoComplete="email"
                    value={email} onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@empresa.com.br" disabled={saving} />
            </div>
            <div className="form-field">
                <label htmlFor="setup-senha">Senha de acesso</label>
                <input id="setup-senha" required minLength={12} maxLength={256} type="password"
                    autoComplete="new-password" value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="No mínimo 12 caracteres" disabled={saving} />
            </div>
            <div className="form-field">
                <label htmlFor="setup-token">Chave única de instalação</label>
                <input id="setup-token" required maxLength={256} type="password"
                    autoComplete="off" value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Chave definida no ambiente seguro" disabled={saving} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="button button-primary button-login" disabled={saving}>
                {saving ? "Configurando..." : "Criar minha empresa no Zord"}
            </button>
        </form>
    );
}
