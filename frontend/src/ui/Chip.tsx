import type React from "react";

type Size = "sm" | "md";
type Variant = "neutral" | "primary" | "accent" | "success" | "warning" | "error";
type As = "span" | "button" | "a" | "div";

type ChipOwnProps<T extends As> = {
  as?: T;
  size?: Size;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type PropsOf<T extends As> = T extends "button"
  ? React.ButtonHTMLAttributes<HTMLButtonElement>
  : T extends "a"
    ? React.AnchorHTMLAttributes<HTMLAnchorElement>
    : T extends "div"
      ? React.HTMLAttributes<HTMLDivElement>
      : React.HTMLAttributes<HTMLSpanElement>;

export default function Chip<T extends As = "span">({
  as,
  children,
  size = "md",
  variant = "neutral",
  className = "",
  ...rest
}: ChipOwnProps<T> & PropsOf<T>) {
  const pad = size === "sm" ? "h-6 text-[11px] px-2" : "h-7 text-xs px-3";
  const variantClass = {
    neutral: "bg-[var(--surface-pill)] text-[var(--fg-muted-50)] border border-[var(--border)]",
    primary: "bg-[var(--primary)] text-[var(--fg-on-primary,white)] border-transparent",
    accent: "bg-[var(--accent)] text-[var(--fg-on-primary,white)] border-transparent",
    success: "bg-[var(--surface-success-soft)] text-[var(--fg-success-strong)] border-transparent",
    warning: "bg-[var(--surface-warn-soft)] text-[var(--fg-warn-strong)] border-transparent",
    error: "bg-[var(--surface-error-soft)] text-[var(--fg-error-strong)] border-transparent",
  }[variant];
  const Comp = (as || "span") as any;
  return (
    <Comp
      className={[
        "inline-flex items-center rounded-full select-none align-middle",
        pad,
        variantClass,
        as === "button" ? "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" : "",
        className,
      ].join(" ")}
      {...(rest as any)}
    >
      {children}
    </Comp>
  );
}


