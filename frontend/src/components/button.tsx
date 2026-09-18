import type { ComponentProps } from "react";

function Button({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={`w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-orange-600 active:bg-orange-700 ${className ?? ""}`}
      {...props}
    />
  );
}

export default Button;
