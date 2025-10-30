import type React from "react";

export default function LLMList({ ordered = false, className = "", children, ...rest }: React.HTMLAttributes<HTMLUListElement> & { ordered?: boolean }) {
  const Comp: any = ordered ? "ol" : "ul";
  return (
    <Comp className={["my-2 pl-5 leading-7", ordered ? "list-decimal" : "list-disc", className].join(" ")} {...rest}>
      {children}
    </Comp>
  );
}


