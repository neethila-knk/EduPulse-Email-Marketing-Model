// components/UI/FileUpload.tsx
import React, { useState } from 'react';

interface FileUploadProps {
  id: string;
  label: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
  labelClassName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  onChange,
  error,
  className = '',
  labelClassName = 'text-sm font-medium',
}) => {
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onChange(files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileName(e.dataTransfer.files[0].name);
      onChange(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file removal
  const handleFileRemove = () => {
    setFileName('');
    onChange(null);
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={`flex mb-4 ${className}`}>
      <div className="w-1/4 pt-2">
        <label htmlFor={id} className={`block ${labelClassName} text-gray-700`}>
          {label}
        </label>
      </div>
      <div className="w-3/4">
        {fileName ? (
          // Display file name when a file is selected
          <div className="border border-gray-300 rounded-md p-4 flex items-center justify-between">
            <span className="text-gray-700">{fileName}</span>
          </div>
        ) : (
          // Dropzone when no file is selected
          <div 
            className={`relative ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG, PDF or other files</p>
              </div>
            </label>
            <input 
              id={id} 
              type="file" 
              className="hidden" 
              onChange={handleFileSelect} 
            />
          </div>
        )}
        
        {/* File action buttons */}
        {fileName && (
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={() => document.getElementById(id)?.click()}
              className="px-4 py-1 border border-green-500 text-green-600 rounded-md text-sm mr-2"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleFileRemove}
              className="px-4 py-1 border border-green-500 text-green-600 rounded-md text-sm"
            >
              Remove
            </button>
          </div>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;