import { z } from "zod";

export const ThreadIdSchema = z.string().min(1);

export const RenameThreadSchema = z.object({
  threadId: ThreadIdSchema,
  title: z.string().trim().min(1).max(120),
});

export const DeleteThreadSchema = z.object({
  threadId: ThreadIdSchema,
});

export type RenameThreadInput = z.infer<typeof RenameThreadSchema>;
export type DeleteThreadInput = z.infer<typeof DeleteThreadSchema>;
export const MoveThreadSchema = z.object({
  threadId: ThreadIdSchema,
  projectId: z.number().int().nonnegative().nullable(),
});
export type MoveThreadInput = z.infer<typeof MoveThreadSchema>;


