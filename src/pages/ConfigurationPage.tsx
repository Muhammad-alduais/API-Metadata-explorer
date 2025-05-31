import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  SettingsIcon,
  ShieldIcon,
  SaveIcon,
  AlertCircleIcon,
  DatabaseIcon,
  NetworkIcon
} from 'lucide-react';

const ConfigurationPage: React.FC = () => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      defaultDataSource: 'census',
      apiTimeout: '30',
      maxRetries: '3',
      cacheEnabled: true,
      cacheExpiry: '3600'
    }
  });

  const onSubmit = (data: any) => {
    console.log('Saving configuration:', data);
    // Implementation for saving configuration
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
              <DatabaseIcon size={18} className="mr-2 text-blue-600" />
              API Settings
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Data Source
                </label>
                <select
                  {...register('defaultDataSource')}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="census">Census API</option>
                  <option value="bls">BLS Data</option>
                  <option value="eurostat">Eurostat</option>
                  <option value="oecd">OECD Statistics</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the default data source for API requests
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Timeout (seconds)
                </label>
                <input
                  type="number"
                  {...register('apiTimeout')}
                  className="w-full rounded-md border border-gray-300 p-2"
                  min="1"
                  max="120"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum time to wait for API responses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  {...register('maxRetries')}
                  className="w-full rounded-md border border-gray-300 p-2"
                  min="0"
                  max="5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of retry attempts for failed requests
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('cacheEnabled')}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Enable Response Caching</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cache Expiry (seconds)
                </label>
                <input
                  type="number"
                  {...register('cacheExpiry')}
                  className="w-full rounded-md border border-gray-300 p-2"
                  min="60"
                  max="86400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How long to cache API responses
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <SaveIcon size={18} />
                <span>Save API Settings</span>
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
                <h3 className="text-sm font-medium text-gray-700 mb-2">Authentication</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Enable API Key Authentication</span>
                  </label>
                  <div className="pl-6">
                    <input
                      type="text"
                      placeholder="Enter API Key"
                      className="w-full mt-1 text-sm rounded-md border border-gray-300 p-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rate Limiting</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Enable Rate Limiting</span>
                  </label>
                  <div className="pl-6 space-y-2">
                    <input
                      type="number"
                      placeholder="Requests per minute"
                      className="w-full text-sm rounded-md border border-gray-300 p-2"
                    />
                    <p className="text-xs text-gray-500">
                      Maximum number of requests allowed per minute
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Monitoring</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Enable Request Logging</span>
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
                  Some security settings may require an application restart to take effect
                </p>
              </div>
            </div>
          </div>

          {/* Network Settings */}
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
              <NetworkIcon size={18} className="mr-2 text-blue-600" />
              Network Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Proxy Configuration</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Use Proxy Server</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Proxy Server URL"
                    className="w-full text-sm rounded-md border border-gray-300 p-2"
                  />
                  <input
                    type="number"
                    placeholder="Port"
                    className="w-full text-sm rounded-md border border-gray-300 p-2"
                    min="1"
                    max="65535"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">SSL/TLS Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                    <span className="text-sm text-gray-700">Verify SSL Certificates</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                    <span className="text-sm text-gray-700">Use TLS 1.3</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConfigurationPage;