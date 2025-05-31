import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, TagIcon } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

interface VariableItemProps {
  variable: {
    name: string;
    label?: string;
    concept?: string;
    type?: string;
    [key: string]: any;
  };
}

const VariableItem: React.FC<VariableItemProps> = ({ variable }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Properties to show in the collapsed view
  const mainProperties = ['label', 'concept', 'type', 'required'];
  
  // Format simple properties for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden transition-all duration-300 hover:border-blue-300">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <TagIcon size={16} className="text-blue-600 mr-2" />
          <span className="font-mono font-medium text-blue-900">{variable.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {variable.type && (
            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">
              {variable.type}
            </span>
          )}
          
          {variable.required === 'true' && (
            <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800">
              required
            </span>
          )}
          
          {expanded ? 
            <ChevronUpIcon size={18} className="text-gray-500" /> : 
            <ChevronDownIcon size={18} className="text-gray-500" />
          }
        </div>
      </div>
      
      {/* Variable basic info */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        {variable.label && (
          <div className="text-sm">
            <span className="text-gray-600">Label:</span>{' '}
            <span className="text-gray-800">{variable.label}</span>
          </div>
        )}
        
        {!expanded && mainProperties.slice(1).map(prop => 
          variable[prop] && (
            <div key={prop} className="text-sm">
              <span className="text-gray-600">{prop}:</span>{' '}
              <span className="text-gray-800">{formatValue(variable[prop])}</span>
            </div>
          )
        )}
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="p-3 border-t border-gray-200">
          <SyntaxHighlighter 
            language="json" 
            style={docco}
            customStyle={{
              backgroundColor: 'transparent',
              padding: '0.5rem',
              fontSize: '0.875rem',
              borderRadius: '0.25rem'
            }}
          >
            {JSON.stringify(variable, null, 2)}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
};

export default VariableItem;