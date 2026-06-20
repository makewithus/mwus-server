"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top loading bar that fires on every route change.
 * Gives instant visual feedback so navigation feels fast even
 * when the new page is fetching data.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Start bar
    setVisible(true);
    setWidth(0);

    // Animate to ~85% quickly then slow down
    let w = 0;
    const tick = () => {
      w = w < 70 ? w + 4 : w < 85 ? w + 0.6 : w;
      setWidth(w);
      if (w < 85) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Complete after a short delay (page has rendered)
    timerRef.current = setTimeout(() => {
      setWidth(100);
      setTimeout(() => setVisible(false), 200);
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2,
        width: `${width}%`,
        background: "var(--accent-blue)",
        zIndex: 9999,
        transition: width === 100 ? "width 0.15s ease-out" : "none",
        boxShadow: "0 0 8px var(--accent-blue)",
      }}
    />
  );
}
