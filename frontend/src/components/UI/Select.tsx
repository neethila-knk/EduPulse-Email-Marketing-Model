import { Fragment } from "react";
import { Listbox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

interface Option {
  label: string;
  value: string;
  description?: string;
  count?: number;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  length?: "full" | "1/2" | "1/3" | "1/4";
  label?: string;
  showCount?: boolean;
  disabled?: boolean;
  onFocus?: () => void; 
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  size = "md",
  length = "full",
  label,
  showCount = true,
  onFocus, 
 
}) => {
  const selected = options.find((o) => o.value === value);

  const sizeClasses = {
    sm: "py-1.5 pl-2 pr-8 text-sm",
    md: "py-2 pl-3 pr-10 text-base",
    lg: "py-3 pl-4 pr-10 text-lg",
  }[size];

  const lengthClasses = {
    full: "w-full",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  }[length];

  return (
    <div className={`relative ${lengthClasses}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange}>
        <Listbox.Button
          className={`relative cursor-default rounded-md border border-gray-300 bg-white ${sizeClasses} text-left text-gray-700 focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 w-full`}
        onFocus={onFocus} 
        >
          <span className="block truncate">
            {selected ? selected.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
          </span>
        </Listbox.Button>

        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm sm:text-base shadow-lg focus:outline-none list-none">

          {options.length > 0 ? (
            options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                as={Fragment}
              >
                {({ active, selected }) => (
                  <li
                    className={`relative cursor-pointer select-none px-4 py-2 ${
                      active ? "bg-green-100 text-green-900" : "text-gray-900"
                    }`}
                    style={{ listStyleType: "none" }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="block truncate text-sm text-gray-500">
                            {option.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center">
                        {showCount && option.count !== undefined && (
                          <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-medium leading-none text-green-600 bg-green-100 rounded-full">
                            {option.count}
                          </span>
                        )}

                        {selected && (
                          <span className="flex items-center text-green-600">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )}
              </Listbox.Option>
            ))
          ) : (
            <li className="text-center text-sm text-gray-500 px-4 py-2">
              No options available
            </li>
          )}
        </Listbox.Options>
      </Listbox>
    </div>
  );
};

export default CustomSelect;
