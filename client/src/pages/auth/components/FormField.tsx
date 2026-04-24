interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  children?: React.ReactNode;
  autocomplete?: string;
}

export default function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1 group">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold tracking-tight text-black">{label}</p>
        {children}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full border-b-2 border-black py-2 px-0 text-black font-medium placeholder:text-black/40 outline-none focus:border-blue tracking-tight transition-colors duration-200 font-figtree"
      />
    </div>
  );
}
