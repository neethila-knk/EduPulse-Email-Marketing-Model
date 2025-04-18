import React from "react";

interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  height?: string;
  labelClassName?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "",
  error,
  required = false,
  className = "",
  height = "h-40",
  labelClassName = "text-sm font-medium",
}) => {
  return (
    <div className={`flex mb-4 ${className}`}>
      <div className="w-1/4 pt-2">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label}
        </label>
      </div>
      <div className="w-3/4">
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md font-mono text-gray-700 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 ${height}`}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default TextArea;
