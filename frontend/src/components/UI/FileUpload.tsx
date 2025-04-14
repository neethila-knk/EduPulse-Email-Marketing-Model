import React, { useState } from "react";
import Button from "./Button";

interface FileUploadProps {
  id: string;
  label: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
  labelClassName?: string;
  accept?: string;
  helpText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  onChange,
  error,
  className = "",
  labelClassName = "text-sm font-medium",
  helpText,
  accept,
}) => {
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onChange(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileName(e.dataTransfer.files[0].name);
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileRemove = () => {
    setFileName("");
    onChange(null);
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-4 ${className}`}>
      {/* Label */}
      <div className="sm:w-1/4 w-full pt-2">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label}
        </label>
      </div>

      {/* Upload Area */}
      <div className="sm:w-3/4 w-full">
        {fileName ? (
          <div className="border border-gray-300 rounded-md p-4 flex items-center justify-between">
            <span className="text-gray-700 truncate">{fileName}</span>
          </div>
        ) : (
          <div
            className={`relative ${
              dragActive
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor={id}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 ">
                <svg
                  className="w-8 h-8 mb-3 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-1 text-sm text-gray-500 text-center">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                {helpText && (
                  <p className="text-xs text-center text-gray-500">
                    {helpText}
                  </p>
                )}
              </div>
            </label>
            <input
              id={id}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Buttons */}
        {fileName && (
          <div className="mt-2 flex flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFileRemove}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Error */}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default FileUpload;
