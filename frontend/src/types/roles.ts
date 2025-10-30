export type Role = "owner" | "manager" | "general" | "none";

export interface ResourceDef {
  id: string;
  categoryId: string;
  categoryLabel: string;
  name: string;
  description?: string;
  aliases?: string[];
  threshold: Role;
}
