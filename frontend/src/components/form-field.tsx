import type { ComponentProps } from "react";
import Input from "./input.tsx";

interface FormFieldProps extends ComponentProps<"input"> {
  label: string;
  required?: boolean;
}

function FormField({ label, required, id, ...props }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-medium text-sm text-zinc-300" htmlFor={id}>
        {label}
        {required ? <span className="text-orange-500"> *</span> : null}
      </label>
      <Input id={id} required={required} {...props} />
    </div>
  );
}

export default FormField;
