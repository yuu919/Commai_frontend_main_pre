import type { EvidenceRepository, EvidenceResponse } from "@/features/inspector/types";
import { apiGetEvidenceById } from "@/lib/api/evidence";

export function createServerEvidenceRepository(): EvidenceRepository {
  return {
    async getById(evidenceId: string): Promise<EvidenceResponse> {
      const row = await apiGetEvidenceById(evidenceId);
      return { evidence: { id: String(row.id), flow_steps: (row as any).flow_steps ?? [] } } as EvidenceResponse;
    },
  };
}


