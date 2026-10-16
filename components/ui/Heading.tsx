import React from "react";

import type { ReactNode } from "react";

export function Heading({
  children,
  level = 1,
  className = "",
}: {
  children: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return <Tag className={className}>{children}</Tag>;
}
