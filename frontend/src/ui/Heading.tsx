import React from "react";

export default function Heading({ level = 2, className = "", children, ...rest }: React.HTMLAttributes<HTMLHeadingElement> & { level?: 1|2|3|4|5|6 }) {
  type HeadingTag = "h1"|"h2"|"h3"|"h4"|"h5"|"h6";
  const Tag = ("h" + String(level)) as HeadingTag;
  const size = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : level === 3 ? "text-lg" : level === 4 ? "text-base" : level === 5 ? "text-sm" : "text-xs";
  const weight = level <= 3 ? "font-semibold" : "font-medium";
  const margin = level <= 2 ? "mt-4 mb-2" : "mt-3 mb-1.5";
  return (
    <Tag className={[size, weight, margin, "text-[var(--fg)]", className].join(" ")} {...rest}>
      {children}
    </Tag>
  );
}


