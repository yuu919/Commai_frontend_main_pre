import React from "react";

type Size = "sm" | "md" | "lg";
type TableProps = React.HTMLAttributes<HTMLTableElement> & { compact?: boolean; size?: Size };
type Highlight = 'accent' | 'warn' | 'success' | 'error' | 'info';
type ThProps = React.ThHTMLAttributes<HTMLTableCellElement> & { highlight?: Highlight; sortable?: boolean };
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement> & { highlight?: Highlight };
type TrProps = React.HTMLAttributes<HTMLTableRowElement> & { highlight?: Highlight };

type TableConfig = { size: Size };
const TableConfigContext = React.createContext<TableConfig>({ size: "md" });

export const Table: React.FC<TableProps> & { Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>; Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>; Th: React.FC<ThProps>; Td: React.FC<TdProps>; Tr: React.FC<TrProps> } = (({ className = "", compact = false, size = "md", children, ...props }: React.PropsWithChildren<TableProps>) => {
  const effectiveSize: Size = compact ? "sm" : size;
  return (
    <TableConfigContext.Provider value={{ size: effectiveSize }}>
      <table className={["w-full border-collapse", className].join(" ")} {...props}>
        {children}
      </table>
    </TableConfigContext.Provider>
  );
}) as any;

const TheadImpl: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = "", ...props }) => (
  <thead className={className} {...props} />
);
const TbodyImpl: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = "", ...props }) => (
  <tbody className={className} {...props} />
);
function highlightClass(h?: Highlight) {
  if (!h) return "";
  const map: Record<Highlight, string> = {
    accent: "bg-[var(--surface-accent-soft)]",
    warn: "bg-[var(--surface-warn-soft)]",
    success: "bg-[var(--surface-success-soft)]",
    error: "bg-[var(--surface-error-soft)]",
    info: "bg-[var(--surface-2)]",
  };
  return map[h];
}

const ThImpl: React.FC<ThProps> = ({ className = "", style, highlight, sortable: _sortable, ...props }) => {
  const { size } = React.useContext(TableConfigContext);
  const paddingClass = size === "sm" ? "p-1" : size === "lg" ? "p-3" : "p-2";
  const minHeightVar = size === "sm" ? "var(--ui-control-h-sm)" : size === "lg" ? "var(--ui-control-h-lg)" : "var(--ui-control-h-md)";
  return (
    <th
      className={["text-left", paddingClass, highlightClass(highlight), className].join(" ")}
      style={{ ...(style || {}), color: 'var(--fg)', minHeight: minHeightVar }}
      {...props}
    />
  );
};
const TdImpl: React.FC<TdProps> = ({ className = "", style, highlight, ...props }) => {
  const { size } = React.useContext(TableConfigContext);
  const paddingClass = size === "sm" ? "p-1" : size === "lg" ? "p-3" : "p-2";
  const minHeightVar = size === "sm" ? "var(--ui-control-h-sm)" : size === "lg" ? "var(--ui-control-h-lg)" : "var(--ui-control-h-md)";
  return (
    <td
      className={[paddingClass, highlightClass(highlight), className].join(" ")}
      style={{ ...(style || {}), minHeight: minHeightVar }}
      {...props}
    />
  );
};
const TrImpl: React.FC<TrProps> = ({ className = "", style, highlight, ...props }) => (
  <tr
    className={[
      "outline-none",
      "hover:bg-[var(--surface-2)]",
      highlightClass(highlight),
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
      className,
    ].join(" ")}
    style={{ ...(style || {}), borderTop: '1px solid var(--border)' }}
    {...props}
  />
);

Table.Thead = TheadImpl;
Table.Tbody = TbodyImpl;
Table.Th = ThImpl;
Table.Td = TdImpl;
Table.Tr = TrImpl;

export default Table;


