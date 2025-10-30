import type React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
};

export function Card({ children, className, onClick, disabled }: CardProps) {
  const interactive = typeof onClick === "function";
  const classes = [
    "rounded-[var(--ui-radius-md)] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--ui-shadow-sm)]",
    interactive && !disabled && "cursor-pointer transition-colors hover:bg-[var(--surface-2-hover)] active:bg-[var(--surface-2-active)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
    disabled && "opacity-60 cursor-not-allowed pointer-events-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      onClick={disabled ? undefined : onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["px-4 py-3 border-b border-[var(--border)]", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["px-4 py-3", className].filter(Boolean).join(" ")}>{children}</div>;
}


