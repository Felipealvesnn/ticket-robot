import { ValidationError } from "../utils/validation";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "select";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  errors?: ValidationError[];
  children?: React.ReactNode; // Para options do select
  disabled?: boolean;
  description?: string;
}

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  errors = [],
  children,
  disabled = false,
  description,
}: FormFieldProps) {
  const fieldErrors = errors.filter((error) => error.field === name);
  const hasError = fieldErrors.length > 0;

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = hasError
    ? "border-red-300 bg-red-50"
    : "border-gray-300";
  const disabledClasses = disabled
    ? "bg-gray-50 text-gray-500 cursor-not-allowed"
    : "";

  const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses}`;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
          disabled={disabled}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
        />
      )}

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {hasError && (
        <div className="space-y-1">
          {fieldErrors.map((error, index) => (
            <p key={index} className="text-xs text-red-600">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
