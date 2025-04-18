import React from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  onSearch?: () => void;
  onFocus?: () => void;
  onClear?: () => void;
  borderColor?: string;
  focusBorderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  value = "",
  onChange,
  className = "",
  onSearch,
  onFocus,
  onClear,
  borderColor = "border-gray-300",
  focusBorderColor = "focus:border-green-600 focus:border-2",
  backgroundColor = "bg-white",
  textColor = "text-gray-800",
  iconColor = "text-gray-400 hover:text-gray-700",
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
    }
  };

  const handleClear = () => {
    if (onChange) {
      // Create a synthetic event to clear the input
      const event = {
        target: { value: "" }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          className={`w-full py-2 pl-4 pr-10 text-sm rounded-md border ${borderColor} ${backgroundColor} ${textColor} focus:outline-none focus:ring-0 ${focusBorderColor}`}
        />
        
        {/* Show clear button only if there is text */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute inset-y-0 right-8 flex items-center pr-1 ${iconColor}`}
            aria-label="Clear search"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
        
        {/* Search icon */}
        <div
          className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto cursor-pointer ${iconColor}`}
          onClick={onSearch}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;