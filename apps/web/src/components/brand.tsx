import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <Link className="brand" href="/painel" aria-label="Zord — página inicial">
            <span className="brand-symbol" aria-hidden="true">
                <svg width="25" height="25" viewBox="0 0 32 32" fill="none">
                    <path d="M6 8h20v5L13 23h13v4H6v-5l13-10H6V8Z" fill="currentColor" />
                </svg>
            </span>
            {!compact && (
                <span className="brand-word">
                    zord<span className="brand-dot">.</span>
                </span>
            )}
        </Link>
    );
}
