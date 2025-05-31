import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Search, RefreshCw } from 'lucide-react';

interface CustomEndpointProps {
  endpoint: string;
  onUrlChange: (url: string) => void;
}

interface Variable {
  name: string;
  label?: string;
  concept?: string;
  type?: string;
  required?: string;
}

const CustomEndpoint: React.FC<CustomEndpointProps> = ({ endpoint, onUrlChange }) => {
  const [variables, setVariables] = useState<Record<string, Variable>>({});
  const [selectedVars, setSelectedVars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVariables();
  }, [endpoint]);

  const loadVariables = async () => {
    setLoading(true);
    setError(null);
    try {
      const varsUrl = `${endpoint}/variables.json`;
      const response = await fetch(varsUrl);
      const data = await response.json();
      
      if (data.variables) {
        setVariables(data.variables);
      } else {
        throw new Error('No variables found in the response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variables');
    } finally {
      setLoading(false);
    }
  };

  const toggleVariable = (varName: string) => {
    const newSelected = new Set(selectedVars);
    if (newSelected.has(varName)) {
      newSelected.delete(varName);
    } else {
      newSelected.add(varName);
    }
    setSelectedVars(newSelected);
    
    // Update URL
    const varsString = Array.from(newSelected).join(',');
    const newUrl = varsString ? `${endpoint}?get=${varsString}` : endpoint;
    onUrlChange(newUrl);
  };

  const filteredVariables = Object.entries(variables)
    .filter(([name, data]) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        name.toLowerCase().includes(search) ||
        (data.label && data.label.toLowerCase().includes(search)) ||
        (data.concept && data.concept.toLowerCase().includes(search))
      );
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw size={24} className="animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading variables...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  const currentUrl = selectedVars.size > 0 ? `${endpoint}?get=${Array.from(selectedVars).join(',')}` : endpoint;

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-4">
      {/* Current URL Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg break-all">
        <div className="text-sm text-gray-600 mb-1">Current URL:</div>
        <div className="font-mono text-sm text-blue-700">{currentUrl}</div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredVariables.map(([name, data]) => (
          <div
            key={name}
            className="flex items-center p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
            onClick={() => toggleVariable(name)}
          >
            {selectedVars.has(name) ? (
              <CheckSquare size={20} className="text-blue-600 mr-2" />
            ) : (
              <Square size={20} className="text-gray-400 mr-2" />
            )}
            <div>
              <div className="font-medium text-gray-900">{name}</div>
              {data.label && (
                <div className="text-sm text-gray-600">{data.label}</div>
              )}
            </div>
            {data.required === "true" && (
              <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium text-blue-600">{selectedVars.size}</span> variables
        </div>
      </div>
    </div>
  );
};

export default CustomEndpoint;