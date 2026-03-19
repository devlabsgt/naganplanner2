"use client";

import { RotateCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function RefreshButton({ className }: { className?: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Un pequeño retraso para que se vea la animación antes de recargar
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (!mounted) {
    return <div className={cn("size-9 sm:size-10 rounded-full", className)} />;
  }

  return (
    <button
      onClick={handleRefresh}
      className={cn(
        "relative flex items-center justify-center size-9 sm:size-10 rounded-full transition-all hover:bg-muted/40 active:scale-90 overflow-hidden",
        className
      )}
      title="Refrescar página"
    >
      <RotateCw 
        className={cn(
          "size-[16px] sm:size-[18px] transition-all duration-500",
          isRefreshing && "animate-spin"
        )} 
      />
    </button>
  );
}
