import type React from "react";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "base" | "panel" | "thread" | "chatInput" | "secondary";
  interactive?: boolean;
  active?: boolean;
  radius?: "none" | "xs" | "sm" | "md" | "lg";
  bordered?: boolean;
  borderSide?: "all" | "t" | "r" | "b" | "l";
  elevated?: boolean;
};

const variantClass: Record<NonNullable<SurfaceProps["variant"]>, string> = {
  base: "bg-[var(--surface-1)]",
  panel: "bg-[var(--surface-1)]",
  thread: "bg-[var(--surface-thread)]",
  chatInput: "bg-[var(--surface-chat-input)]",
  secondary: "bg-[var(--surface-2)]",
};

const radiusClass: Record<NonNullable<SurfaceProps["radius"]>, string> = {
  none: "rounded-none",
  xs: "rounded-[var(--ui-radius-xs)]",
  sm: "rounded-[var(--ui-radius-sm)]",
  md: "rounded-[var(--ui-radius-md)]",
  lg: "rounded-[var(--ui-radius-lg)]",
};

export default function Surface({ variant = "base", interactive = false, active = false, radius, bordered = false, borderSide, elevated = false, className, ...rest }: SurfaceProps) {
  const classes = [
    variantClass[variant],
    interactive && !active && "transition-colors hover:bg-[var(--surface-2-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
    active && "bg-[var(--accent-soft)] text-[var(--fg)]",
    radius ? radiusClass[radius] : "",
    bordered ? "border border-[var(--border)]" : "",
    !bordered && borderSide === "t" && "border-t border-[var(--border)]",
    !bordered && borderSide === "r" && "border-r border-[var(--border)]",
    !bordered && borderSide === "b" && "border-b border-[var(--border)]",
    !bordered && borderSide === "l" && "border-l border-[var(--border)]",
    elevated && "shadow-[var(--ui-shadow-sm)]",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}


