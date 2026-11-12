"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/lib/validation";
import { Icon } from "@/components/icons";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;
        const input = loginSchema.safeParse({ usuario, senha });
        if (!input.success) {
            setError(input.error.issues[0]?.message ?? "Confira os dados informados.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/autenticacao/entrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(input.data),
            });
            if (!response.ok) {
                setError(response.status === 503
                    ? "O serviço está temporariamente indisponível."
                    : response.status === 429
                        ? "Muitas tentativas. Tente novamente mais tarde."
                        : "Não foi possível entrar. Confira suas credenciais.");
                return;
            }
            router.replace("/painel");
            router.refresh();
        } catch {
            setError("Não foi possível conectar. Verifique sua conexão e tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="login-form" onSubmit={submit} noValidate>
            {searchParams.get("motivo") === "sessao" && (
                <div className="form-notice" role="status">
                    Sua sessão terminou. Entre novamente para continuar.
                </div>
            )}
            <div className="form-field">
                <label htmlFor="usuario">Usuário ou e-mail</label>
                <input
                    id="usuario"
                    type="text"
                    autoComplete="username"
                    value={usuario}
                    onChange={(event) => setUsuario(event.target.value)}
                    placeholder="seu.usuario@empresa.com.br"
                    required
                    maxLength={254}
                    disabled={loading}
                />
            </div>
            <div className="form-field">
                <div className="form-label-row">
                    <label htmlFor="senha">Senha</label>
                </div>
                <input
                    id="senha"
                    type="password"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha"
                    required
                    maxLength={4096}
                    disabled={loading}
                />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary button-login" type="submit" disabled={loading}>
                <span>{loading ? "Entrando..." : "Entrar no Zord"}</span>
                <Icon name={loading ? "refresh" : "arrow-right"} size={19} />
            </button>
            <p className="form-support">Problemas para acessar? Contate o administrador da sua empresa.</p>
        </form>
    );
}
