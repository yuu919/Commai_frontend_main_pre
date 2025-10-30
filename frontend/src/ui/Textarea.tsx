import React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextareaBase({ className, ...rest }, ref) {
  return (
    <textarea
      className={[
        "w-full px-3 py-2 text-sm rounded-[var(--ui-radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg)]",
        "placeholder:text-[var(--fg-placeholder)] focus:outline-none",
        "disabled:bg-[var(--surface-1-disabled)] disabled:text-[var(--fg-disabled)]",
        className,
      ].filter(Boolean).join(" ")}
      ref={ref}
      {...rest}
    />
  );
});

export default Textarea;


