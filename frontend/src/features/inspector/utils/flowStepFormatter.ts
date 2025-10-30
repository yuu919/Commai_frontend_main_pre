export interface FormattedFlowStep {
  id: string;
  stepTitle: string;
  reasoning?: string;
  inputData?: Array<{ label: string; value: string | string[] }>;
  outputData?: Array<{ label: string; value: string | string[] }>;
  duration?: string;
  timestamp: string;
  status: string;
}

export interface RawFlowStep {
  id: number;
  evidence_id: string;
  step_order: number;
  step_type: string;
  step_name: string;
  description?: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  reasoning?: string;
  duration_ms?: number;
  status: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${seconds}秒`;
};

const getStepTitle = (stepName: string, _stepOrder: number): string => {
  switch (stepName) {
    case "専用ルーター判定":
    case "二段ルーター判定":
    case "自律判定完了":
      return "ルートの決定";
    case "クエリ分析":
      return "必要情報源と処理計画の決定";
    case "並列実行":
    case "並列検索実行":
      return "ツール並列実行";
    case "結果収集・重複除去":
      return "検索結果の収集と整理";
    case "品質評価":
      return "情報品質の評価";
    case "推論エンジン":
      return "収集情報をもとに推論";
    case "品質チェック":
      return "分析結果の品質検証";
    case "回答合成":
    case "最終回答合成":
      return "最終回答の生成";
    case "ツール選択判断":
      return "ツール選択判断";
    case "自律品質評価":
      return "品質評価判断";
    default:
      return stepName;
  }
};

const formatInputData = (stepName: string, inputData: Record<string, any> | undefined): Array<{ label: string; value: string | string[] }> => {
  if (!inputData) return [];
  const formatted: Array<{ label: string; value: string | string[] }> = [];
  switch (stepName) {
    case "専用ルーター判定":
    case "二段ルーター判定":
      if (inputData.user_query) formatted.push({ label: "ユーザー質問", value: inputData.user_query });
      if (inputData.route_decision) formatted.push({ label: "使用するツール", value: inputData.route_decision === "NONE" ? "ツール不要" : inputData.route_decision });
      if (inputData.route_reason) formatted.push({ label: "ルート決定の理由", value: inputData.route_reason });
      break;
    case "クエリ分析":
      if (inputData.query) formatted.push({ label: "ユーザー質問", value: inputData.query });
      break;
    case "並列実行":
    case "並列検索実行":
      if (inputData.parallel_tasks) {
        const tasks = Array.isArray(inputData.parallel_tasks) ? inputData.parallel_tasks.join(", ") : String(inputData.parallel_tasks);
        formatted.push({ label: "実行タスク", value: tasks });
      }
      if (inputData.search_queries) {
        const queryLines: string[] = [];
        if (inputData.search_queries.hybrid_search?.length > 0) {
          queryLines.push("📊 ハイブリッド検索:");
          inputData.search_queries.hybrid_search.forEach((q: string, i: number) => queryLines.push(`  ${i + 1}. ${q}`));
        }
        if (inputData.search_queries.web_search?.length > 0) {
          if (queryLines.length > 0) queryLines.push("");
          queryLines.push("🌐 Web検索:");
          inputData.search_queries.web_search.forEach((q: string, i: number) => queryLines.push(`  ${i + 1}. ${q}`));
        }
        if (queryLines.length > 0) formatted.push({ label: "検索クエリ", value: queryLines });
      }
      break;
    case "回答合成":
      if (inputData.total_iterations !== undefined) formatted.push({ label: "反復回数", value: String(inputData.total_iterations) });
      break;
    case "ツール選択判断":
      if (inputData.tool_count !== undefined) formatted.push({ label: "ツール数", value: String(inputData.tool_count) });
      if (inputData.selected_tools) {
        const tools = Array.isArray(inputData.selected_tools) ? inputData.selected_tools.join(", ") : String(inputData.selected_tools);
        formatted.push({ label: "選択ツール", value: tools });
      }
      break;
    case "自律品質評価":
      if (inputData.decision) formatted.push({ label: "判断結果", value: inputData.decision });
      if (inputData.content_length !== undefined) formatted.push({ label: "回答文字数", value: String(inputData.content_length) });
      if (inputData.search_results_count !== undefined) formatted.push({ label: "検索結果数", value: String(inputData.search_results_count) });
      break;
    default:
      break;
  }
  return formatted;
};

const formatOutputData = (stepName: string, outputData: Record<string, any> | undefined): Array<{ label: string; value: string | string[] }> => {
  if (!outputData) return [];
  const formatted: Array<{ label: string; value: string | string[] }> = [];
  switch (stepName) {
    case "クエリ分析":
      if (outputData.analysis_plan) {
        const plans = Array.isArray(outputData.analysis_plan) ? outputData.analysis_plan.join(" → ") : String(outputData.analysis_plan);
        formatted.push({ label: "計画", value: plans });
      }
      if (outputData.required_tools) {
        const tools = Array.isArray(outputData.required_tools) ? outputData.required_tools.join(", ") : String(outputData.required_tools);
        formatted.push({ label: "使用ツール", value: tools });
      }
      if (outputData.search_queries) {
        const queries: string[] = [];
        if (outputData.search_queries.web_search?.length > 0) queries.push(`ウェブ検索: ${outputData.search_queries.web_search.join(", ")}`);
        if (outputData.search_queries.hybrid_search?.length > 0) queries.push(`ハイブリッド検索: ${outputData.search_queries.hybrid_search.join(", ")}`);
        if (queries.length > 0) formatted.push({ label: "検索クエリ", value: queries.join(" | ") });
      }
      break;
    case "並列実行":
    case "並列検索実行":
      if (outputData.successful_tools && Array.isArray(outputData.successful_tools)) formatted.push({ label: "成功したツール", value: outputData.successful_tools.join(", ") });
      if (outputData.failed_tools && Array.isArray(outputData.failed_tools) && outputData.failed_tools.length > 0) formatted.push({ label: "失敗したツール", value: outputData.failed_tools.join(", ") });
      if (outputData.total_results !== undefined) formatted.push({ label: "取得した結果数", value: String(outputData.total_results) });
      break;
    case "結果収集・重複除去":
      if (outputData.deduplicated_count !== undefined) formatted.push({ label: "重複除去後の結果数", value: String(outputData.deduplicated_count) });
      if (outputData.removed_duplicates !== undefined) formatted.push({ label: "除去した重複数", value: String(outputData.removed_duplicates) });
      break;
    case "推論エンジン":
      if (outputData.reasoning_result) {
        const preview = outputData.reasoning_result.length > 100 ? outputData.reasoning_result.substring(0, 100) + "..." : outputData.reasoning_result;
        formatted.push({ label: "推論結果", value: preview });
      }
      if (outputData.key_points && Array.isArray(outputData.key_points)) formatted.push({ label: "キーポイント", value: outputData.key_points.join(" | ") });
      break;
    case "品質チェック":
    case "品質評価":
      if (outputData.quality_decision) formatted.push({ label: "検証結果", value: outputData.quality_decision });
      if (outputData.overall_score !== undefined) formatted.push({ label: "品質スコア", value: `${outputData.overall_score}/100` });
      if (outputData.is_sufficient !== undefined) formatted.push({ label: "情報充足性", value: outputData.is_sufficient ? "十分" : "不十分" });
      if (outputData.recommendation) formatted.push({ label: "推奨アクション", value: outputData.recommendation === "continue" ? "追加検索" : "回答合成" });
      break;
    case "回答合成":
    case "最終回答合成":
      if (outputData.response_length !== undefined) formatted.push({ label: "回答文字数", value: `${outputData.response_length}文字` });
      if (outputData.final_quality_score !== undefined) formatted.push({ label: "最終品質スコア", value: `${outputData.final_quality_score}/100` });
      if (outputData.total_duration_ms !== undefined) formatted.push({ label: "総処理時間", value: formatDuration(outputData.total_duration_ms) });
      if (outputData.final_answer_preview) formatted.push({ label: "回答プレビュー", value: outputData.final_answer_preview });
      break;
    case "思考分析結果":
      if (outputData && outputData.tool_decisions) {
        const tools = (Array.isArray(outputData.tool_decisions) ? outputData.tool_decisions : []).map((td: any) => td.tool || td.name || "unknown");
        if (tools.length > 0) formatted.push({ label: "選択ツール", value: tools.join(", ") });
      }
      if (outputData && outputData.next_action) formatted.push({ label: "次のアクション推定", value: outputData.next_action });
      break;
    default:
      break;
  }
  return formatted;
};

const mergeQueryAnalysisSteps = (steps: RawFlowStep[]): RawFlowStep[] => {
  const merged: RawFlowStep[] = [];
  let queryAnalysisStep: RawFlowStep | null = null;
  for (const step of steps) {
    if (step.step_name === "クエリ分析") {
      if (!queryAnalysisStep) {
        queryAnalysisStep = { ...step };
      } else {
        queryAnalysisStep.output_data = step.output_data || queryAnalysisStep.output_data;
        queryAnalysisStep.reasoning = step.reasoning || queryAnalysisStep.reasoning;
        queryAnalysisStep.completed_at = step.completed_at || queryAnalysisStep.completed_at;
        queryAnalysisStep.status = step.status === "completed" ? "completed" : queryAnalysisStep.status;
      }
    } else {
      if (queryAnalysisStep) {
        merged.push(queryAnalysisStep);
        queryAnalysisStep = null;
      }
      merged.push(step);
    }
  }
  if (queryAnalysisStep) merged.push(queryAnalysisStep);
  return merged;
};

export const formatFlowSteps = (rawSteps: RawFlowStep[]): FormattedFlowStep[] => {
  const filteredSteps = rawSteps.filter(step => step.step_name !== "自律ルーター処理中");
  const mergedSteps = mergeQueryAnalysisSteps(filteredSteps);
  return mergedSteps.map((step) => {
    const stepTitle = getStepTitle(step.step_name, step.step_order);
    const inputData = formatInputData(step.step_name, step.input_data);
    const outputData = formatOutputData(step.step_name, step.output_data);
    if (step.error_message) outputData.push({ label: "エラーメッセージ", value: step.error_message });
    return {
      id: `step_${step.evidence_id}_${step.step_order}`,
      stepTitle,
      reasoning: step.reasoning,
      inputData,
      outputData,
      duration: step.duration_ms ? formatDuration(step.duration_ms) : undefined,
      timestamp: step.started_at,
      status: step.status,
    };
  });
};


