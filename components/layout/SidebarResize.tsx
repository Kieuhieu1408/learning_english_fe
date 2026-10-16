"use client";

export function SidebarResize({
  sidebarWidth,
  setSidebarWidth,
  setResizing,
}: {
  sidebarWidth: number;
  setSidebarWidth: (w: number | ((w: number) => number)) => void;
  setResizing: (r: boolean) => void;
}) {
  const clampSidebar = (x: number) =>
    Math.max(220, Math.min(x, 420, Math.round(window.innerWidth * 0.45)));

  return (
    <div
      className="sidebar-resize-handle"
      role="separator"
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      aria-valuemin={220}
      aria-valuemax={420}
      aria-valuenow={sidebarWidth}
      tabIndex={0}
      onDoubleClick={() => setSidebarWidth(244)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setResizing(true);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          setSidebarWidth(clampSidebar(e.clientX));
        }
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setResizing(false);
      }}
      onLostPointerCapture={() => setResizing(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          setSidebarWidth((w) =>
            clampSidebar(
              typeof w === "number" ?
                w + (e.key === "ArrowRight" ? 16 : -16)
              : 244,
            ),
          );
        }
        if (e.key === "Home") {
          e.preventDefault();
          setSidebarWidth(220);
        }
        if (e.key === "End") {
          e.preventDefault();
          setSidebarWidth(420);
        }
      }}
    />
  );
}
