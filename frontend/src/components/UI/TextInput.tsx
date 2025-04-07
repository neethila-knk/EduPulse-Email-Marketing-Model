// components/UI/TextInput.tsx
import React from "react";

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  error,
  required = false,
  className = "",
  labelClassName = "text-sm font-medium",
  disabled = false,
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center mb-4 ${className}`}>
      <div className="md:w-1/4 mb-1 md:mb-0">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label}
        </label>
      </div>
      <div className="md:w-3/4">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-gray-700"
          }`}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default TextInput;
