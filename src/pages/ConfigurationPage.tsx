import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  SettingsIcon,
  ShieldIcon,
  LayersIcon,
  SaveIcon,
  AlertCircleIcon
} from 'lucide-react';

const ConfigurationPage: React.FC = () => {
  const { register, handleSubmit } = useForm({
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
          <SettingsIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">System Configuration</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
              <SettingsIcon size={18} className="mr-2 text-blue-600" />
              Configuration Settings
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <SaveIcon size={18} />
                <span>Save Configuration</span>
              </button>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
              <ShieldIcon size={18} className="mr-2 text-blue-600" />
              Security Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Access Control</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Enable RBAC</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">API Key Authentication</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Environment</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Sandbox Mode</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Development Environment</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Monitoring</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Audit Logging</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Performance Monitoring</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-md flex items-start space-x-2">
                <AlertCircleIcon size={18} className="text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Changes to security settings may require system restart
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Preview */}
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
              <LayersIcon size={18} className="mr-2 text-blue-600" />
              Metadata Preview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">Census Population Estimates</h3>
                <p className="text-sm text-gray-500 mb-3">Structural metadata for population estimates dataset</p>
                <pre className="text-sm font-mono bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify({
                    type: "dataset",
                    properties: {
                      temporal_coverage: "2010-2020",
                      spatial_coverage: "United States",
                      update_frequency: "Annual"
                    }
                  }, null, 2)}
                </pre>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">BLS Employment Statistics</h3>
                <p className="text-sm text-gray-500 mb-3">Technical metadata for employment data</p>
                <pre className="text-sm font-mono bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify({
                    type: "api_endpoint",
                    format: "JSON",
                    authentication: "API_KEY",
                    rate_limit: "500/hour"
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConfigurationPage;