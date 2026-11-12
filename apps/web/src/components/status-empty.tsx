import { Icon } from "@/components/icons";

export function StatusEmpty({
    title,
    description,
    variant = "empty",
}: {
    title: string;
    description: string;
    variant?: "empty" | "error";
}) {
    return (
        <div className="empty-state" role={variant === "error" ? "alert" : "status"}>
            <span className={`empty-icon ${variant === "error" ? "empty-icon-error" : ""}`}>
                <Icon name={variant === "error" ? "shield" : "empty"} size={25} />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}
