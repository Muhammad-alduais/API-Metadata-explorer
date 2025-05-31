import React, { useState, useEffect } from 'react';
import { SlidersIcon, SearchIcon } from 'lucide-react';
import VariableItem from './VariableItem';

interface VariablesListProps {
  endpoint: string;
  variableList?: string[];
}

interface Variable {
  name: string;
  label?: string;
  concept?: string;
  type?: string;
  [key: string]: any;
}

const VariablesList: React.FC<VariablesListProps> = ({ endpoint, variableList }) => {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    const fetchVariables = async () => {
      if (variableList && variableList.length > 0) {
        // If we already have the variable list, no need to fetch
        setLoading(false);
        return;
      }

      try {
        const varsUrl = `${endpoint}/variables.json`;
        const response = await fetch(varsUrl);
        const data = await response.json();
        
        if (data.variables) {
          setVariables(data.variables);
        } else {
          setError('No variables found in the response');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variables');
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [endpoint, variableList]);

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500">
        Loading variables...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  // Filter variables based on search and build the variables array
  const variableEntries: Variable[] = [];
  
  if (variableList && variableList.length > 0) {
    // If a specific list is provided, use only those variables
    variableList.forEach(name => {
      if (variables[name]) {
        variableEntries.push({ name, ...variables[name] });
      } else {
        variableEntries.push({ name });
      }
    });
  } else {
    // Otherwise use all variables from the fetched data
    Object.entries(variables).forEach(([name, data]) => {
      variableEntries.push({ name, ...data as any });
    });
  }

  // Apply search filter
  const filteredVariables = variableEntries.filter(variable => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      variable.name.toLowerCase().includes(search) ||
      (variable.label && variable.label.toLowerCase().includes(search)) ||
      (variable.concept && variable.concept.toLowerCase().includes(search))
    );
  });

  // Limit display count
  const displayedVariables = filteredVariables.slice(0, displayCount);
  const hasMore = displayedVariables.length < filteredVariables.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full p-2 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-700 text-sm">
          <SlidersIcon size={14} />
          <span>{filteredVariables.length}</span>
        </div>
      </div>
      
      {displayedVariables.length === 0 ? (
        <div className="py-4 text-center text-gray-500">
          No variables found matching your search.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayedVariables.map((variable) => (
              <VariableItem key={variable.name} variable={variable} />
            ))}
          </div>
          
          {hasMore && (
            <button
              onClick={() => setDisplayCount(prev => prev + 10)}
              className="w-full py-2 mt-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Show more ({filteredVariables.length - displayCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default VariablesList;