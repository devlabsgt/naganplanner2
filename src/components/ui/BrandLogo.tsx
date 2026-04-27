"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div className={cn("flex flex-col select-none", className)}>
      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center leading-none">
        <AuroraText variant="gold" className="drop-shadow-md">Nagan</AuroraText>
        <AuroraText variant="planner" className="ml-1 font-bold">Planner</AuroraText>
      </h1>
      <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-2 ml-0.5">
        Igl. Fuente de Poder | Camotán
      </span>
      <span className="text-[7px] sm:text-[8px] uppercase font-bold tracking-widest mt-[2px] ml-0.5">
        <AuroraText variant="gold">Pts. Milton Cordón & Josselyn de Cordón</AuroraText>
      </span>
    </div>
  );
}
