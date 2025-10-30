import type React from "react";
import "@/styles/llm.css";

type Props = React.HTMLAttributes<HTMLDivElement> & { copyMarkdown?: string };

export default function LLMTable({ className = "", children, copyMarkdown, ...rest }: Props) {
  return (
    <div className={["relative group overflow-x-auto my-2", className].join(" ")} {...rest}>
      {children}
      {typeof copyMarkdown === "string" && (
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-0.5 rounded-ui-xs bg-surface-2-active bg-surface-2-hover"
          onClick={() => navigator.clipboard.writeText(copyMarkdown)}
          title="テーブルをコピー"
          type="button"
        >コピー</button>
      )}
    </div>
  );
}


