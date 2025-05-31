import React, { useState, useEffect } from 'react';
import { splitCensusApiRequest } from '../utils/apiUtils';
import EndpointItem from './EndpointItem';
import CustomEndpoint from './CustomEndpoint';

interface EndpointGroupProps {
  title: string;
  description: string;
  endpoint: string;
}

const EndpointGroup: React.FC<EndpointGroupProps> = ({ 
  title, 
  description,
  endpoint 
}) => {
  const [variables, setVariables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState(endpoint);

  useEffect(() => {
    loadVariables();
  }, [endpoint]);

  const loadVariables = async () => {
    setIsLoading(true);
    try {
      const varsUrl = `${endpoint}/variables.json`;
      const response = await fetch(varsUrl);
      const data = await response.json();
      
      if (data.variables) {
        const varList = Object.keys(data.variables).filter(v => v !== "time");
        setVariables(varList);
      } else {
        setVariables([]);
      }
    } catch (error) {
      console.error('Failed to load variables:', error);
      setVariables([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Original endpoint URL with all variables
  const getVars = variables.length ? `?get=${variables.join(',')}` : '';
  const fullEndpointUrl = `${endpoint}${getVars}`;
  
  // Split URLs (max 10 vars each)
  const splitUrls = splitCensusApiRequest(fullEndpointUrl, 10);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 overflow-hidden transition-all duration-300 mb-8">
      <div className="p-5">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600 mb-4 text-sm">{description}</p>
        )}
        
        {/* Original Endpoint */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-5 bg-blue-600 rounded-sm mr-2"></span>
            Original Endpoint
          </h3>
          
          <EndpointItem
            title={title}
            endpoint={endpoint}
            url={fullEndpointUrl}
            variableCount={variables.length}
            isLoading={isLoading}
            onToggle={() => setIsExpanded(!isExpanded)}
            isExpanded={isExpanded}
          />
        </div>
        
        {/* Custom Endpoint */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-purple-700 mb-2 flex items-center">
            <span className="w-2 h-5 bg-purple-600 rounded-sm mr-2"></span>
            Custom Endpoint
          </h3>
          
          <CustomEndpoint 
            endpoint={endpoint}
            onUrlChange={setCustomUrl}
          />
          
          <EndpointItem
            title={`${title} (Custom)`}
            endpoint={endpoint}
            url={customUrl}
            variableCount={customUrl.includes('?get=') ? customUrl.split('?get=')[1].split(',').length : 0}
            isCompact={true}
          />
        </div>
        
        {/* Split Endpoints */}
        {variables.length > 0 && splitUrls.length > 1 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-cyan-700 mb-2 flex items-center">
              <span className="w-2 h-5 bg-cyan-500 rounded-sm mr-2"></span>
              Split Endpoints (Max 10 Variables Each)
            </h3>
            
            <div className="space-y-3">
              {splitUrls.map((splitUrl, index) => {
                const start = index * 10;
                const end = Math.min(start + 10, variables.length);
                const chunkVars = variables.slice(start, end);
                
                return (
                  <EndpointItem
                    key={index}
                    title={`${title} (Part ${index + 1})`}
                    endpoint={endpoint}
                    url={splitUrl}
                    variableCount={chunkVars.length}
                    variableList={chunkVars}
                    isCompact={true}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointGroup;