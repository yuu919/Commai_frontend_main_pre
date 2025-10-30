"use client";

import { useCallback, useMemo, useState } from "react";

export interface SelectedFile {
  file: File;
}

export function useFileUpload() {
  const [files, setFiles] = useState<SelectedFile[]>([]);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr.map((f) => ({ file: f }))]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setFiles([]), []);

  const totalSize = useMemo(
    () => files.reduce((acc, { file }) => acc + (file?.size || 0), 0),
    [files]
  );

  return { files, addFiles, removeAt, clear, totalSize };
}

export default useFileUpload;


