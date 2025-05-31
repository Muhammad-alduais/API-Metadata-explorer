import React, { useState } from 'react';
import EndpointGroup from './EndpointGroup';
import { SearchIcon } from 'lucide-react';

interface ResultsContainerProps {
  data: any;
}

const ResultsContainer: React.FC<ResultsContainerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || !data.dataset || !data.dataset.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No data available. Please load a valid metadata JSON file.
      </div>
    );
  }

  const endpointGroups = data.dataset
    .filter((dataset: any) => {
      if (!searchTerm) return true;
      
      const title = dataset.title || '';
      const description = dataset.description || '';
      const path = dataset.c_dataset ? dataset.c_dataset.join('/') : '';
      
      const searchLower = searchTerm.toLowerCase();
      return (
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        path.toLowerCase().includes(searchLower)
      );
    })
    .map((dataset: any, index: number) => {
      const endpointPath = dataset.c_dataset ? dataset.c_dataset.join('/') : '';
      return {
        id: index,
        title: dataset.title || `Endpoint ${index + 1}`,
        description: dataset.description || '',
        endpoint: `https://api.census.gov/data/${endpointPath}`,
      };
    });

  return (
    <div className="space-y-6 mt-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search endpoints by title, description or path..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {endpointGroups.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-500">No endpoints found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {endpointGroups.map((group: any) => (
            <EndpointGroup
              key={group.id}
              title={group.title}
              description={group.description}
              endpoint={group.endpoint}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsContainer;