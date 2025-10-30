import type { EvidenceRepository, EvidenceResponse } from "@/features/inspector/types";
import type { RawFlowStep } from "@/features/inspector/utils/flowStepFormatter";

const sampleSteps: RawFlowStep[] = [
  { id: 1, evidence_id: "mock-1", step_order: 1, step_type: "routing", step_name: "クエリ分析", description: "", input_data: { query: "売上の推移" }, output_data: { analysis_plan: ["収集", "評価", "合成"], required_tools: ["web_search"] }, reasoning: "質問の意図分析", duration_ms: 350, status: "completed", started_at: new Date().toISOString(), completed_at: new Date().toISOString(), error_message: undefined },
];

export function createMockEvidenceRepository(): EvidenceRepository {
  return {
    async getById(evidenceId: string): Promise<EvidenceResponse> {
      const steps = sampleSteps.map((s) => ({ ...s, evidence_id: evidenceId }));
      return { evidence: { id: evidenceId, flow_steps: steps } };
    },
  };
}


