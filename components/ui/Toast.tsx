import React from "react";

import { Sparkles } from "lucide-react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <div role="status" className="toast" onClick={onDismiss}>
      <Sparkles size={14} className="shrink-0 text-[#a1a6ef]" />
      <span>{message}</span>
    </div>
  );
}
