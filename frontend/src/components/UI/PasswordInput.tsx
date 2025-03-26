import React from 'react';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  error,
  required = false,
  className = '',
  labelClassName = 'text-sm font-medium',
}) => {
  return (
    <div className={`flex mb-4 ${className}`}>
      <div className="w-1/4 pt-2">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label}
        </label>
      </div>
      <div className="w-3/4">
        <div className="relative">
          <input
            id={id}
            type="password"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-700 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600`}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PasswordInput;