import React from "react";

export default function LLMHeading({ level = 2, className = "", children, ...rest }: React.HTMLAttributes<HTMLHeadingElement> & { level?: 1|2|3|4|5|6 }) {
  const tag = level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : level === 4 ? "h4" : level === 5 ? "h5" : "h6";
  const size = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : level === 3 ? "text-lg" : level === 4 ? "text-base" : level === 5 ? "text-sm" : "text-xs";
  const weight = level <= 3 ? "font-semibold" : "font-medium";
  const margin = level <= 2 ? "mt-4 mb-2" : "mt-3 mb-1.5";
  return React.createElement(
    tag,
    { className: [size, weight, margin, "text-[var(--fg)]", className].join(" "), ...rest },
    children
  );
}


