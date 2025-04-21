import React from "react";

interface TextInputProps {
  id: string;
  name?: string;
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
  onFocus?: () => void; // Added onFocus event handler
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
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
  onFocus, // Add onFocus to the component props
}) => {
  // Check if we're using vertical layout
  const isVertical = className.includes("!flex-col");

  if (isVertical) {
    // Use a layout similar to PasswordInput for vertical layout
    return (
      <div className={`mb-4 ${className}`}>
        <label htmlFor={id} className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
          <input
            id={id}
            name={name || id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus} // Added onFocus event handler
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`block w-full px-3.5 py-2  border ${
              error ? "border-red-500" : "border-gray-300"
            } rounded-md bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 sm:text-sm ${
              disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-700"
            }`}
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  // Original layout for horizontal/responsive mode
  return (
    <div className={`flex flex-col md:flex-row md:items-center mb-4 ${className}`}>
      <div className="md:w-1/4 mb-1 md:mb-0">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div className="md:w-3/4">
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus} // Added onFocus event handler
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md  focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 sm:text-sm ${
            disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-700"
          }`}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default TextInput;