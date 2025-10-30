import type { EvidenceRepository, EvidenceResponse } from "@/features/inspector/types";
import type { RawFlowStep } from "@/features/inspector/utils/flowStepFormatter";

const sampleSteps: RawFlowStep[] = [
  {
    id: 1,
    evidence_id: "mock-1",
    step_order: 1,
    step_type: "routing",
    step_name: "クエリ分析",
    description: "",
    input_data: { query: "売上の推移を教えて" },
    output_data: { analysis_plan: ["データ収集", "品質評価", "回答合成"], required_tools: ["web_search"] },
    reasoning: "質問の意図を抽出し、必要情報源を決定。",
    duration_ms: 350,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    error_message: undefined,
  },
  {
    id: 2,
    evidence_id: "mock-1",
    step_order: 2,
    step_type: "execution",
    step_name: "並列検索実行",
    description: "",
    input_data: { parallel_tasks: ["web_search", "hybrid_search"], search_queries: { web_search: ["売上 推移 2024"], hybrid_search: ["売上 2023-2025"] } },
    output_data: { successful_tools: ["web_search"], total_results: 12 },
    reasoning: "複数検索で網羅性を確保。",
    duration_ms: 1200,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    error_message: undefined,
  },
  {
    id: 3,
    evidence_id: "mock-1",
    step_order: 3,
    step_type: "reasoning",
    step_name: "推論エンジン",
    description: "",
    input_data: {},
    output_data: { key_points: ["売上は前年比+8%", "季節性が強い"], reasoning_result: "売上は右肩上がりで推移。" },
    reasoning: "収集情報を統合し要点を抽出。",
    duration_ms: 800,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    error_message: undefined,
  },
  {
    id: 4,
    evidence_id: "mock-1",
    step_order: 4,
    step_type: "synthesis",
    step_name: "最終回答合成",
    description: "",
    input_data: { total_iterations: 2 },
    output_data: { response_length: 120, final_quality_score: 92, total_duration_ms: 2450, final_answer_preview: "前年対比で8%成長..." },
    reasoning: "回答を整形し品質を評価。",
    duration_ms: 150,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    error_message: undefined,
  },
];

export function createMockEvidenceRepository(): EvidenceRepository {
  return {
    async getById(evidenceId: string): Promise<EvidenceResponse> {
      const steps = sampleSteps.map((s) => ({ ...s, evidence_id: evidenceId }));
      return { evidence: { id: evidenceId, flow_steps: steps } };
    },
  };
}


