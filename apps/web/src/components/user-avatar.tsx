"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function UserAvatar({ name, size = 36, className = "" }: {
    name: string;
    size?: number;
    className?: string;
}) {
    const [version, setVersion] = useState(0);
    const [unavailable, setUnavailable] = useState(false);

    useEffect(() => {
        const onChange = () => {
            setUnavailable(false);
            setVersion((value) => value + 1);
        };
        window.addEventListener("zord:avatar-changed", onChange);
        return () => window.removeEventListener("zord:avatar-changed", onChange);
    }, []);

    const initial = name.trim().slice(0, 1).toLocaleUpperCase("pt-BR") || "U";

    return (
        <span
            className={`user-avatar ${className}`}
            style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.35)) }}
            aria-label={`Avatar de ${name}`}
            role="img"
        >
            {unavailable ? (
                <span aria-hidden="true">{initial}</span>
            ) : (
                <Image
                    key={version}
                    src={`/api/usuarios/avatar?v=${version}`}
                    alt=""
                    width={size}
                    height={size}
                    unoptimized
                    priority={size <= 48}
                    onError={() => setUnavailable(true)}
                />
            )}
        </span>
    );
}
