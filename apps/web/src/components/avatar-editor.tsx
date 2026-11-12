"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";

const MAX_IMAGE_SIZE = 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

async function fileBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        reader.onload = () => {
            if (typeof reader.result !== "string") {
                reject(new Error("Formato de imagem inesperado."));
                return;
            }
            const comma = reader.result.indexOf(",");
            if (comma < 0) {
                reject(new Error("Imagem inválida."));
                return;
            }
            resolve(reader.result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
    });
}

export function AvatarEditor({ name }: { name: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    function selectImage(event: ChangeEvent<HTMLInputElement>) {
        const candidate = event.target.files?.[0] ?? null;
        setError("");
        setNotice("");
        if (!candidate) {
            setFile(null);
            return;
        }
        if (!allowed.has(candidate.type) || candidate.size > MAX_IMAGE_SIZE || candidate.size === 0) {
            setFile(null);
            event.target.value = "";
            setError("Escolha uma imagem PNG, JPG ou WebP de até 1 MB.");
            return;
        }
        setFile(candidate);
    }

    async function save() {
        if (!file || saving) return;
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const base64 = await fileBase64(file);
            const response = await fetch("/api/usuarios/avatar", {
                method: "PUT",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64, mime: file.type }),
            });
            if (!response.ok) {
                setError(response.status === 401
                    ? "Sua sessão expirou. Entre novamente."
                    : "Não foi possível salvar o avatar. Verifique o formato e as permissões.");
                return;
            }
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
            window.dispatchEvent(new Event("zord:avatar-changed"));
            setNotice("Seu avatar foi atualizado.");
        } catch {
            setError("Não foi possível enviar a imagem. Verifique sua conexão.");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (saving) return;
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const response = await fetch("/api/usuarios/avatar", {
                method: "DELETE",
                credentials: "same-origin",
            });
            if (!response.ok) {
                setError("Não foi possível remover seu avatar.");
                return;
            }
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
            window.dispatchEvent(new Event("zord:avatar-changed"));
            setNotice("Avatar removido. A identificação padrão será utilizada.");
        } catch {
            setError("Erro de conexão ao remover o avatar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="avatar-editor">
            <div className="avatar-editor-header">
                <UserAvatar name={name} size={92} className="avatar-profile" />
                <div>
                    <h2>Sua foto de perfil</h2>
                    <p>Personalize sua conta com uma imagem única para você.</p>
                </div>
            </div>
            <div className="avatar-editor-actions">
                <label className="avatar-picker" htmlFor="avatar-input">
                    <Icon name="package" size={17} /> Escolher imagem
                </label>
                <input
                    id="avatar-input"
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={selectImage}
                    disabled={saving}
                    aria-describedby="avatar-instructions"
                />
                <button className="button button-primary" type="button" onClick={save} disabled={!file || saving}>
                    {saving ? "Salvando..." : "Salvar avatar"}
                </button>
                <button className="button button-secondary" type="button" onClick={remove} disabled={saving}>
                    Remover foto
                </button>
            </div>
            {file && <p className="avatar-selected">Selecionada: {file.name}</p>}
            <p id="avatar-instructions" className="avatar-help">PNG, JPG ou WebP · até 1 MB. A foto é exibida apenas para usuários autorizados no sistema.</p>
            {error && <p role="alert" className="form-error">{error}</p>}
            {notice && <p role="status" className="form-notice">{notice}</p>}
        </div>
    );
}
