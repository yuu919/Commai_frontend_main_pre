import type { RawFlowStep } from "@/features/inspector/utils/flowStepFormatter";

export interface EvidenceRecord {
  id?: string;
  flow_steps: RawFlowStep[];
}

export interface EvidenceResponse {
  evidence: EvidenceRecord;
}

export interface EvidenceRepository {
  getById(evidenceId: string): Promise<EvidenceResponse>;
}


