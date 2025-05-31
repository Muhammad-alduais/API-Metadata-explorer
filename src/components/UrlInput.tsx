import React from 'react';
import { LoaderIcon } from 'lucide-react';

interface UrlInputProps {
  url: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoad: () => void;
  isLoading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ url, onChange, onLoad, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onLoad();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="flex-grow">
        <input
          type="text"
          id="jsonUrl"
          placeholder="Enter JSON URL"
          value={url}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
          disabled={isLoading}
        />
      </div>
      <button
        onClick={onLoad}
        disabled={isLoading}
        className={`px-6 py-2.5 rounded-lg font-medium text-white ${
          isLoading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        } transition-colors duration-200 shadow-sm flex items-center justify-center min-w-[100px]`}
      >
        {isLoading ? (
          <>
            <LoaderIcon size={18} className="animate-spin mr-2" />
            Loading
          </>
        ) : (
          'Load'
        )}
      </button>
    </div>
  );
};

export default UrlInput;