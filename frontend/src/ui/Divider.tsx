import React from "react";

export const Divider: React.FC<React.HTMLAttributes<HTMLHRElement>> = ({ className = "", ...props }) => (
  <hr className={["h-px w-full bg-[var(--border)] border-0", className].join(" ")} {...props} />
);

export default Divider;


