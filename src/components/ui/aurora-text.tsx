"use client";

import { useTheme } from "next-themes";
import React, { memo, useEffect, useState } from "react";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
  variant?: "default" | "gold" | "silver" | "silver-adaptive" | "planner";
}

const VARIANTS_DARK = {
  default: ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  gold: ["#ffd700", "#d6a738", "#ffcc33", "#b8860b"],
  silver: ["#ffffff", "#f8fafc", "#f1f5f9", "#ffffff"],
  "silver-adaptive": ["#ffffff", "#e5e7eb", "#9ca3af", "#f3f4f6"],
  planner: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1"],
};

const VARIANTS_LIGHT = {
  default: ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  gold: ["#ffd700", "#d6a738", "#ffcc33", "#b8860b"],
  silver: ["#ffffff", "#e5e7eb", "#9ca3af", "#f3f4f6"],
  "silver-adaptive": ["#111827", "#374151", "#4b5563", "#000000"], // Negro/Gris para fondo claro
  planner: ["#0f172a", "#1e293b", "#334155", "#475569"],
};

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors,
    speed = 1,
    variant = "default",
  }: AuroraTextProps) => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // En el servidor o antes de montar, usamos los de dark por defecto (o los que pasen)
    const currentTheme = resolvedTheme || theme;
    const currentVariants = mounted && currentTheme === "light" ? VARIANTS_LIGHT : VARIANTS_DARK;
    const finalColors = colors || currentVariants[variant];

    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${finalColors.join(", ")}, ${finalColors[0]
        })`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="animate-aurora relative bg-size-[200%_auto] bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  },
);

AuroraText.displayName = "AuroraText";
