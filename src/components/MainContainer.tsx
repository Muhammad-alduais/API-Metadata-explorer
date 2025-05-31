import React, { useState } from 'react';
import { toast } from 'react-toastify';

import UrlInput from './UrlInput';
import Summary from './Summary';
import ResultsContainer from './ResultsContainer';
import { LoaderIcon } from 'lucide-react';

const MainContainer: React.FC = () => {
  const [jsonUrl, setJsonUrl] = useState<string>(
    'https://api.census.gov/data/timeseries/intltrade/exports/hs.json'
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJsonUrl(e.target.value);
  };

  const loadData = async () => {
    if (!jsonUrl) {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      if (!jsonData.dataset || !Array.isArray(jsonData.dataset)) {
        throw new Error('Invalid dataset format. The JSON must contain a dataset array.');
      }
      
      setData(jsonData);
      toast.success('Data loaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error(`Error: ${err instanceof Error ? err.message : 'Failed to load data'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!data) return;
    
    // Implementation for JSON export would go here
    toast.info('Preparing JSON export...');
  };

  const handleExportInsomnia = () => {
    if (!data) return;
    
    // Implementation for Insomnia export would go here
    toast.info('Preparing Insomnia export...');
  };

  return (
    <main className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <UrlInput 
            url={jsonUrl} 
            onChange={handleUrlChange} 
            onLoad={loadData} 
            isLoading={loading} 
          />
          
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoaderIcon size={48} className="animate-spin text-blue-600" />
              <span className="ml-4 text-lg text-gray-700">Loading metadata...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {data && !loading && (
            <>
              <Summary 
                data={data} 
                onExportJson={handleExportJson}
                onExportInsomnia={handleExportInsomnia}
              />
              <ResultsContainer data={data} />
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContainer;