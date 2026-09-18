import type { ComponentProps, ReactNode } from "react";
import Input from "./input.tsx";

interface FormFieldProps extends ComponentProps<"input"> {
  children?: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}

function FormField({
  label,
  required,
  id,
  error,
  maxLength,
  minLength,
  value,
  children,
  ...props
}: FormFieldProps) {
  const currentLength = typeof value === "string" ? value.length : undefined;

  const showMaxCounter = maxLength !== undefined && currentLength !== undefined;
  const showMinCounter =
    minLength !== undefined &&
    currentLength !== undefined &&
    currentLength < minLength;

  let counter: string | undefined;
  if (showMaxCounter) {
    counter = `${currentLength}/${maxLength}`;
  } else if (showMinCounter) {
    counter = `${currentLength}/${minLength}`;
  }

  return (
    <div>
      <label
        className="mb-1.5 block font-medium text-sm text-zinc-300"
        htmlFor={id}
      >
        {label}
        {required ? <span className="text-orange-500"> *</span> : null}
      </label>
      <div className="mt-1.5">
        {children ?? (
          <Input
            counter={counter}
            error={error}
            id={id}
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            value={value}
            {...props}
          />
        )}
      </div>
      <div className="mt-1 h-5">
        {error ? <p className="text-red-500 text-xs">{error}</p> : null}
      </div>
    </div>
  );
}

export default FormField;
