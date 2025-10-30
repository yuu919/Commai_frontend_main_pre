import type React from "react";

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "asChild"> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};

const sizeToClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-[var(--ui-control-h-sm)] px-3 text-sm",
  md: "h-[var(--ui-control-h-md)] px-4 text-sm",
  lg: "h-[var(--ui-control-h-lg)] px-5 text-base",
};

const variantToClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:bg-[var(--accent-disabled-bg)]",
  ghost:
    "bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--surface-2-hover)] active:bg-[var(--surface-2-active)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50",
  danger:
    "bg-[var(--error)] text-white hover:bg-[var(--error-hover)] active:bg-[var(--error-active)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--error)] disabled:bg-[var(--error-disabled-bg)]",
};

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  children,
  asChild, // swallow unknown prop from reaching DOM
  ...rest
}) => {
  const compat = (className || "");
  const usesLegacyBtn = /\bbtn(?![a-z-])/i.test(compat) || /\bbtn-(sm|lg)\b/i.test(compat);
  const computedSizeClass = usesLegacyBtn ? "" : sizeToClass[size];
  const computedVariantClass = usesLegacyBtn ? "" : variantToClass[variant];
  const classes = [
    "inline-flex items-center justify-center rounded-[var(--ui-radius-sm)] shadow-[var(--ui-shadow-sm)] transition-colors border border-[var(--border)]",
    computedSizeClass,
    computedVariantClass,
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;


