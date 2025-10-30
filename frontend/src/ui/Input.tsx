import React from "react";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "md" | "lg";
};

const sizeToClass: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-[var(--ui-control-h-sm)] px-3 text-sm",
  md: "h-[var(--ui-control-h-md)] px-3 text-sm",
  lg: "h-[var(--ui-control-h-lg)] px-4 text-base",
};

export const Input = (React.forwardRef<HTMLInputElement, InputProps>(({ className, size = "md", ...rest }, ref) => {
  const classes = [
    "w-full rounded-[var(--ui-radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg)]",
    "placeholder:text-[var(--fg-placeholder)] focus:outline-none disabled:bg-[var(--surface-1-disabled)] disabled:text-[var(--fg-disabled)]",
    sizeToClass[size],
    className || "",
  ]
    .filter(Boolean)
    .join(" ");
  return <input ref={ref} className={classes} {...rest} />;
})) as React.ForwardRefExoticComponent<React.PropsWithoutRef<InputProps> & React.RefAttributes<HTMLInputElement>>;

Input.displayName = "Input";

export default Input;


