import React, { useState } from 'react';
import { ChevronRightIcon, ClipboardCopyIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react';
import VariablesList from './VariablesList';

interface EndpointItemProps {
  title: string;
  endpoint: string;
  url: string;
  variableCount: number;
  variableList?: string[];
  isLoading?: boolean;
  onToggle?: () => void;
  isExpanded?: boolean;
  isCompact?: boolean;
}

const EndpointItem: React.FC<EndpointItemProps> = ({
  title,
  endpoint,
  url,
  variableCount,
  variableList,
  isLoading = false,
  onToggle,
  isExpanded = false,
  isCompact = false
}) => {
  const [copied, setCopied] = useState(false);

  const copyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`bg-white rounded-lg border ${isCompact ? 'border-cyan-200' : 'border-blue-200'} transition-all duration-300 hover:shadow-md`}>
      <div 
        className={`flex items-center p-3 cursor-pointer ${onToggle ? 'hover:bg-blue-50' : ''}`}
        onClick={onToggle}
        data-custom-url={isCompact ? url : undefined}
      >
        {onToggle && (
          <ChevronRightIcon 
            size={20} 
            className={`text-blue-600 mr-2 transition-transform duration-300 ${isExpanded ? 'transform rotate-90' : ''}`} 
          />
        )}
        
        <div className="flex-grow">
          <div className="flex flex-col gap-2">
            <div className={`font-medium ${isCompact ? 'text-sm text-gray-700' : 'text-base text-gray-800'}`}>
              {title}
            </div>
            
            <div className={`px-2 py-1 rounded font-mono text-xs md:text-sm text-blue-700 bg-blue-50 break-all`}>
              {url}
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={e => e.stopPropagation()} 
                className="ml-1 inline-flex hover:text-blue-900"
              >
                <ExternalLinkIcon size={14} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isCompact 
              ? 'bg-cyan-100 text-cyan-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {variableCount} vars
          </span>
          
          <button
            className={`p-1.5 rounded-md text-sm flex items-center transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : `${isCompact ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`
            }`}
            onClick={copyEndpoint}
          >
            {copied ? <CheckIcon size={16} /> : <ClipboardCopyIcon size={16} />}
          </button>
        </div>
      </div>
      
      {isExpanded && onToggle && (
        <div className="px-4 pb-3 pt-1 border-t border-blue-100">
          {isLoading ? (
            <div className="py-4 text-center text-gray-500">
              Loading variables...
            </div>
          ) : (
            <VariablesList endpoint={endpoint} variableList={variableList} />
          )}
        </div>
      )}
    </div>
  );
};

export default EndpointItem;