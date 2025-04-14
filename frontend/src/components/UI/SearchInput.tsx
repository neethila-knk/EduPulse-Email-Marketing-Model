import React from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  onSearch?: () => void;
  borderColor?: string; // Optional tailwind class for border color
  focusBorderColor?: string; // Optional focus border class
  backgroundColor?: string; // Optional background class
  textColor?: string; // Optional text class
  iconColor?: string; // Optional icon color
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  value,
  onChange,
  className = "",
  onSearch,
  borderColor = "border-gray-300",
  focusBorderColor = "focus:border-green-600",
  backgroundColor = "bg-white",
  textColor = "text-gray-800",
  iconColor = "text-gray-400 hover:text-gray-700",
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={`w-full py-2 pl-4 pr-10 text-sm rounded-md border ${borderColor} ${backgroundColor} ${textColor} focus:outline-none focus:ring-0 ${focusBorderColor}`}
      />
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
  );
};

export default SearchInput;
