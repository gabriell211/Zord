import type { ReactNode } from "react";

export type IconName =
    | "overview" | "users" | "target" | "receipt" | "shopping"
    | "package" | "wallet" | "credit-card" | "search" | "arrow-right"
    | "arrow-up-right" | "chevron-right" | "menu" | "close" | "logout"
    | "shield" | "globe" | "refresh" | "empty" | "filter" | "check";

const paths: Record<IconName, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2" /><path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    shopping: <><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    package: <><path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 15h2M6 5V3h12" /></>,
    "credit-card": <><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 10h19M7 15h4" /></>,
    search: <><circle cx="10.7" cy="10.7" r="6.4" /><path d="m16 16 5 5" /></>,
    "arrow-right": <><path d="M4 12h16m-7-7 7 7-7 7" /></>,
    "arrow-up-right": <><path d="M6 18 18 6M8 6h10v10" /></>,
    "chevron-right": <path d="m9 6 6 6-6 6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M5 5 19 19M19 5 5 19" />,
    logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M15 8l4 4-4 4M8 12h11" /></>,
    shield: <><path d="m12 2 8 4v5c0 5-3.2 8.7-8 11-4.8-2.3-8-6-8-11V6l8-4Z" /><path d="m9 12 2 2 4-4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a16 16 0 0 1 0 18M12 3a16 16 0 0 0 0 18" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2" /></>,
    empty: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 9h8M8 13h8M8 17h4" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    check: <path d="m4 12 5 5L20 6" />,
};

export function Icon({ name, size = 20, className }: {
    name: IconName; size?: number; className?: string;
}) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
        >
            {paths[name]}
        </svg>
    );
}
