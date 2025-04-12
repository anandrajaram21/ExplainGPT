"use client";

import { useEffect, useState } from "react";

export default function CursorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Add specific cursor styles - using CSS variables for better performance
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --cursor-x: -100px;
        --cursor-y: -100px;
      }
      
      * {
        cursor: none !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "currentColor",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.7,
          transform: `translate(${position.x}px, ${position.y}px)`,
          willChange: "transform",
        }}
        aria-hidden="true"
      />
      {children}
    </>
  );
}
