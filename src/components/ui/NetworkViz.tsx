"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./Effects";

/** Animated node-and-edge "neural network" graphic. */
export default function NetworkViz({
  width,
  height,
  nodes,
  linkDistance,
  className,
  preserveAspectRatio,
}: {
  width: number;
  height: number;
  nodes: number;
  linkDistance: number;
  className?: string;
  preserveAspectRatio?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const reduce = prefersReducedMotion();
    const pts = Array.from({ length: nodes }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(svg);

    const draw = () => {
      if (visible) {
        let h = "";
        if (!reduce)
          pts.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
          });
        for (let i = 0; i < nodes; i++)
          for (let j = i + 1; j < nodes; j++) {
            const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
            if (d < linkDistance)
              h += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke-opacity="${((1 - d / linkDistance) * 0.55).toFixed(2)}"/>`;
          }
        pts.forEach((p, i) => {
          h += `<circle cx="${p.x}" cy="${p.y}" r="${i % 4 ? 2.4 : 4.2}" opacity="${i % 4 ? 0.6 : 1}"/>`;
        });
        svg.innerHTML = h;
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [width, height, nodes, linkDistance]);

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
    />
  );
}
