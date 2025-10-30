"use client";

import useSWR from "swr";
import { getEvidenceById, getEvidenceByMessage } from "@/features/inspector/api/evidence";
import { formatFlowSteps } from "@/features/inspector/utils/flowStepFormatter";

type EvidenceFlowResponse = {
  evidence: any;
  formattedFlowSteps: ReturnType<typeof formatFlowSteps>;
};

export function useEvidenceFlow(
  evidenceId?: string | number,
  opts?: { messageId?: number; chatId?: string }
) {
  const hasMsg = !!(opts?.messageId && opts?.chatId);
  const key = (evidenceId || hasMsg)
    ? ["evidence-flow", evidenceId ?? null, hasMsg ? opts!.messageId : null, hasMsg ? opts!.chatId : null]
    : null;
  return useSWR<EvidenceFlowResponse>(
    key,
    async () => {
      let evidence: any;
      if (opts?.messageId && opts?.chatId) {
        const byMsg = await getEvidenceByMessage(opts.messageId, opts.chatId);
        evidence = byMsg.evidence;
      } else {
        const byId = await getEvidenceById(String(evidenceId));
        evidence = byId.evidence;
      }
      const formattedFlowSteps = formatFlowSteps(evidence?.flow_steps ?? []);
      return { evidence, formattedFlowSteps };
    },
    { revalidateOnFocus: true, dedupingInterval: 1000 }
  );
}

export default useEvidenceFlow;


