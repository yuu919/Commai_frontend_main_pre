"use client";
import React, { createContext, useContext, useState } from "react";

type EvidenceState = { evidenceId: string | null; message: string | null };

const EvidenceContext = createContext<{
  state: EvidenceState;
  setEvidence: (id: string, message?: string) => void;
} | null>(null);

export function EvidenceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EvidenceState>({ evidenceId: null, message: null });
  const setEvidence = (id: string, message?: string) => setState({ evidenceId: id, message: message ?? null });
  return <EvidenceContext.Provider value={{ state, setEvidence }}>{children}</EvidenceContext.Provider>;
}

export function useEvidence() {
  const ctx = useContext(EvidenceContext);
  if (!ctx) throw new Error("useEvidence must be used within EvidenceProvider");
  return ctx;
}


