import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  DatabaseIcon, 
  LayersIcon, 
  SettingsIcon,
  ShieldIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon
} from 'lucide-react';

const MetadataPage: React.FC = () => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      dataSource: 'census',
      metadataType: 'structural',
      parser: 'default'
    }
  });

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <DatabaseIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Metadata Processing System</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                <SettingsIcon size={18} className="mr-2 text-blue-600" />
                Configuration
              </h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Source
                  </label>
                  <select
                    {...register('dataSource')}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="census">Census API</option>
                    <option value="bls">BLS Data</option>
                    <option value="eurostat">Eurostat</option>
                    <option value="oecd">OECD Statistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metadata Type
                  </label>
                  <select
                    {...register('metadataType')}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="structural">Structural</option>
                    <option value="descriptive">Descriptive</option>
                    <option value="administrative">Administrative</option>
                    <option value="technical">Technical</option>
                    <option value="quality">Quality</option>
                    <option value="spatial">Spatial</option>
                    <option value="process">Process</option>
                    <option value="semantic">Semantic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parser Configuration
                  </label>
                  <select
                    {...register('parser')}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="default">Default Parser</option>
                    <option value="custom">Custom Parser</option>
                    <option value="extended">Extended Parser</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Configuration
                </button>
              </form>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                <ShieldIcon size={18} className="mr-2 text-blue-600" />
                Security Settings
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Enable RBAC</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Sandbox Mode</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Audit Logging</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex-grow relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search metadata..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                <PlusIcon size={18} />
                <span>New Schema</span>
              </button>
            </div>

            {/* Metadata Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                <LayersIcon size={18} className="mr-2 text-blue-600" />
                Metadata Preview
              </h2>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">Census Population Estimates</h3>
                      <p className="text-sm text-gray-500">Structural metadata for population estimates dataset</p>
                    </div>
                    <button className="text-red-600 hover:text-red-700">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {JSON.stringify({
                      type: "dataset",
                      properties: {
                        temporal_coverage: "2010-2020",
                        spatial_coverage: "United States",
                        update_frequency: "Annual"
                      }
                    }, null, 2)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">BLS Employment Statistics</h3>
                      <p className="text-sm text-gray-500">Technical metadata for employment data</p>
                    </div>
                    <button className="text-red-600 hover:text-red-700">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {JSON.stringify({
                      type: "api_endpoint",
                      format: "JSON",
                      authentication: "API_KEY",
                      rate_limit: "500/hour"
                    }, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MetadataPage;