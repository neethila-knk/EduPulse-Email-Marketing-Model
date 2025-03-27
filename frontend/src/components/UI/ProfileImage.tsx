// components/UI/ProfileImage.tsx
import React, { useState, useRef } from 'react';

interface ProfileImageProps {
  initialImage?: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  className?: string;
  disabled?: boolean;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  initialImage = null,
  onChange,
  onRemove,
  className = '',
  disabled = false, 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onChange(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {previewUrl ? (
          // Display profile image with overlay buttons
          <div className="relative group">
            <img 
              src={previewUrl} 
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-gray-800 rounded-full p-2 mx-1 hover:bg-gray-100"
                title="Change Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-white text-red-500 rounded-full p-2 mx-1 hover:bg-gray-100"
                title="Remove Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          // Display placeholder with upload button
          <div 
            className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 border-4 border-gray-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700">Profile Picture</p>
        <p className="text-xs text-gray-500 mt-1">Click to upload or change</p>
      </div>
    </div>
  );
};

export default ProfileImage;