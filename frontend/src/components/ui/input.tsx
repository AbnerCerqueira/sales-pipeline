import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {}

function Input({ className, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const togglePassword = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="relative">
      <input
        className={cn(
          "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
          isPassword && "pr-10",
          className
        )}
        data-slot="input"
        type={inputType}
        {...props}
      />
      {isPassword ? (
        <button
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          onClick={togglePassword}
          type="button"
        >
          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      ) : null}
    </div>
  );
}

export { Input };
