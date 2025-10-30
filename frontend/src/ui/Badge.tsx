import type React from "react";

export type BadgeVariant = "neutral" | "primary" | "accent" | "success" | "warning" | "error";
type LegacyVariant = "default"; // backward-compat alias
type Size = "sm" | "md" | "lg";

export default function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant | LegacyVariant; size?: Size }) {
  const normalized: BadgeVariant = (variant === "default" ? "neutral" : variant) as BadgeVariant;

  const variantClass = {
    neutral: "bg-[var(--surface-2)] text-[var(--fg)] border-[var(--border)]",
    primary: "bg-[var(--primary)] text-[var(--fg-on-primary,white)] border-transparent",
    accent: "bg-[var(--accent)] text-[var(--fg-on-primary,white)] border-transparent",
    success: "bg-[var(--success)] text-white border-transparent",
    warning: "bg-[var(--warn)] text-white border-transparent",
    error: "bg-[var(--error)] text-white border-transparent",
  }[normalized];

  const sizeClass = {
    sm: "h-5 text-[11px] px-2",
    md: "h-6 text-xs px-2.5",
    lg: "h-7 text-sm px-3",
  }[size];

  return (
    <span
      className={[
        "inline-flex items-center rounded-[var(--ui-radius-sm)] border select-none align-middle",
        sizeClass,
        variantClass,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}


