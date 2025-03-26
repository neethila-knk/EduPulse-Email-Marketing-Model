import React from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search',
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full py-2 pl-4 pr-10 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default SearchInput;