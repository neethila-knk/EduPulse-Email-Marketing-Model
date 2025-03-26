import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
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
          <select
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none text-gray-700 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600`}
          >
            <option value="" disabled className="text-gray-500">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default Select;