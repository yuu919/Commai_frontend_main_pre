"use server";
import { apiCreateProject } from "@/lib/api/projects";

export async function serverCreateProject(name: string, description?: string | null) {
  return apiCreateProject(name, description);
}


