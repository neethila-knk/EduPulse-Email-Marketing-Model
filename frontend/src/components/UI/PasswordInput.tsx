import { useState } from "react";

interface PasswordInputProps {
  id: string;
  name?: string; // Add name property
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onFocus?: () => void; 
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name, // Add name to props destructuring
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  onFocus, 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name || id} // Use name prop or fall back to id
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`block w-full px-3.5 py-2 border ${
            error ? "border-red-300" : "border-gray-300"
          } rounded-md bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 sm:text-sm ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          disabled={disabled}
        >
          {showPassword ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;