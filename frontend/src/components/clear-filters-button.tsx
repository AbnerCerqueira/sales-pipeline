import { X } from "lucide-react";
import { cn } from "../lib/utils.ts";
import { Button } from "./ui/button.tsx";

interface ClearFiltersButtonProps {
  className?: string;
  onClear: () => void;
}

function ClearFiltersButton({ className, onClear }: ClearFiltersButtonProps) {
  return (
    <Button
      className={cn(
        "h-9 rounded-full border-orange-500/30 bg-orange-500/10 px-3 font-medium text-orange-300 text-xs hover:bg-orange-500/15 hover:text-orange-300",
        className
      )}
      onClick={onClear}
      type="button"
      variant="secondary"
    >
      <X size={12} />
      Limpar filtros
    </Button>
  );
}

export type { ClearFiltersButtonProps };
export { ClearFiltersButton };
