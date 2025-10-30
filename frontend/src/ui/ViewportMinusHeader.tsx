import type React from "react";

export default function ViewportMinusHeader({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["min-h-[calc(100vh-var(--app-header-h))]", className || ""].join(" ")} {...rest}>
      {children}
    </div>
  );
}


