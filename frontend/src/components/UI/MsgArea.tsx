import React from "react";

interface MsgAreaProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  height?: string;
  disabled?: boolean;
  onFocus?: () => void;
}

const MsgArea: React.FC<MsgAreaProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "",
  error,
  required = false,
  className = "",
  labelClassName = "text-sm font-medium",
  height = "h-40",
  disabled = false,
  onFocus,
}) => {
  const isVertical = className.includes("!flex-col");

  if (isVertical) {
    return (
      <div className={`mb-4 ${className}`}>
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
          <textarea
            id={id}
            name={name || id}
            value={value}
            onChange={onChange}
            onFocus={onFocus} 
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`w-full px-3 py-2 border ${
              error ? "border-red-500" : "border-gray-300"
            } rounded-md text-gray-700 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 sm:text-sm ${height} ${
              disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
            }`}
            
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col md:flex-row md:items-start mb-4 ${className}`}
    >
      <div className="md:w-1/4 mb-1 md:mb-0 pt-2">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div className="md:w-3/4">
        <textarea
          id={id}
          name={name || id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 sm:text-sm ${height} ${
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

export default MsgArea;
