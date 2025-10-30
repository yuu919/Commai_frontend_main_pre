import type React from "react";
import Surface from "./Surface";

type AppHeaderProps = React.HTMLAttributes<HTMLElement>;

export default function AppHeader({ className, children, ...rest }: AppHeaderProps) {
  return (
    <header className={["w-full h-[var(--app-header-h)] flex items-center", className || ""].join(" ")} role="banner" {...rest}>
      <Surface className="w-full h-full border-b flex items-center justify-between px-4" variant="panel">
        {children}
      </Surface>
    </header>
  );
}


