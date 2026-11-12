"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { clienteSchema } from "@/lib/validation";
import type { Customer } from "@/lib/customers";

export function CustomerForm({ initial }: { initial?: Customer }) {
    const router = useRouter();
    const [nome, setNome] = useState(initial?.name ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [telefone, setTelefone] = useState(initial?.phone ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const editing = Boolean(initial);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const parsed = clienteSchema.safeParse({ nome, email, telefone });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
            return;
        }
        setError("");
        setSaving(true);
        try {
            const response = await fetch(editing ? `/api/clientes/${initial?.id}` : "/api/clientes", {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(parsed.data),
            });
            if (!response.ok) {
                setError(response.status === 401
                    ? "Sua sessão expirou. Faça login novamente."
                    : response.status === 422
                        ? "Verifique os dados e tente novamente."
                        : "Não foi possível salvar. Confira suas permissões e tente novamente.");
                return;
            }
            router.push("/clientes?salvo=1");
            router.refresh();
        } catch {
            setError("Falha de conexão. Verifique sua rede e tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={save} className="customer-form" noValidate>
            <div className="customer-form-heading">
                <span className="panel-kicker">INFORMAÇÕES DO CLIENTE</span>
                <h2>{editing ? "Editar cadastro" : "Novo cadastro"}</h2>
                <p>Preencha os dados essenciais. Informações fiscais podem ser complementadas na implantação brasileira.</p>
            </div>
            <div className="customer-fields">
                <div className="form-field">
                    <label htmlFor="cliente-nome">Nome ou razão social <span aria-hidden="true">*</span></label>
                    <input
                        id="cliente-nome"
                        required
                        type="text"
                        autoComplete="organization"
                        maxLength={160}
                        value={nome}
                        onChange={(event) => setNome(event.target.value)}
                        placeholder="Ex.: Empresa Exemplo Ltda."
                        disabled={saving}
                    />
                </div>
                <div className="customer-fields-row">
                    <div className="form-field">
                        <label htmlFor="cliente-email">E-mail</label>
                        <input
                            id="cliente-email"
                            type="email"
                            autoComplete="email"
                            maxLength={254}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="contato@empresa.com.br"
                            disabled={saving}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="cliente-telefone">Telefone</label>
                        <input
                            id="cliente-telefone"
                            type="tel"
                            autoComplete="tel"
                            maxLength={32}
                            value={telefone}
                            onChange={(event) => setTelefone(event.target.value)}
                            placeholder="(48) 99999-9999"
                            disabled={saving}
                        />
                    </div>
                </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="customer-form-footer">
                <Link href="/clientes" className="button button-secondary">Cancelar</Link>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}
                    <Icon name="arrow-right" size={17} />
                </button>
            </div>
        </form>
    );
}
