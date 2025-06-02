import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import yaml from 'js-yaml';
import {
  BookOpenIcon,
  FileJsonIcon,
  PackageIcon,
  UploadIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';

SyntaxHighlighter.registerLanguage('json', json);

const MetadataBuilderPage: React.FC = () => {
  const [sourceMetadata, setSourceMetadata] = useState<string>('');
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSourceMetadata(content);
    };
    reader.readAsText(file);
  };

  const convertToOpenApi = async () => {
    if (!sourceMetadata) {
      toast.error('Please provide source metadata');
      return;
    }

    setConverting(true);
    setError(null);

    try {
      // Try parsing as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(sourceMetadata);
      } catch {
        // If JSON parsing fails, try YAML
        try {
          parsedData = yaml.load(sourceMetadata);
        } catch {
          throw new Error('Invalid metadata format. Please provide valid JSON or YAML.');
        }
      }

      // Auto-detect structure and convert to OpenAPI
      const openApiDoc = {
        openapi: '3.0.3',
        info: {
          title: parsedData.title || parsedData.name || parsedData.info?.title || 'API',
          version: parsedData.version || parsedData.info?.version || '1.0.0',
          description: parsedData.description || parsedData.info?.description || ''
        },
        servers: [],
        paths: {}
      };

      // Extract server information
      if (parsedData.servers) {
        openApiDoc.servers = parsedData.servers;
      } else if (parsedData.baseUrl || parsedData.baseUri) {
        openApiDoc.servers = [{
          url: parsedData.baseUrl || parsedData.baseUri,
          description: 'API Server'
        }];
      }

      // Extract endpoints/paths
      if (parsedData.paths) {
        // Already in OpenAPI format
        openApiDoc.paths = parsedData.paths;
      } else if (parsedData.endpoints) {
        // Convert endpoints array to paths object
        parsedData.endpoints.forEach((endpoint: any) => {
          const path = endpoint.path || endpoint.url || '/';
          const method = (endpoint.method || 'get').toLowerCase();

          if (!openApiDoc.paths[path]) {
            openApiDoc.paths[path] = {};
          }

          openApiDoc.paths[path][method] = {
            summary: endpoint.summary || endpoint.description || `${method.toUpperCase()} ${path}`,
            description: endpoint.description || '',
            parameters: endpoint.parameters || [],
            responses: endpoint.responses || {
              '200': {
                description: 'Successful response'
              }
            }
          };
        });
      }

      setOpenApiSpec(openApiDoc);
      toast.success('Successfully converted to OpenAPI format');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert metadata';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConverting(false);
    }
  };

  const exportToInsomnia = () => {
    if (!openApiSpec) return;

    const insomniaExport = {
      _type: 'export',
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: 'metadata.builder',
      resources: [
        {
          _id: `wrk_${Date.now()}`,
          _type: 'workspace',
          name: openApiSpec.info.title,
          description: openApiSpec.info.description,
          scope: 'collection'
        }
      ]
    };

    const blob = new Blob([JSON.stringify(insomniaExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insomnia_collection.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Exported to Insomnia collection format');
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpenIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">API Metadata Builder</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Source Input */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Source Metadata</h2>

              {/* File Upload */}
              <div className="mb-4">
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadIcon size={24} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          accept=".json,.yaml,.yml"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JSON or YAML files
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Your Metadata
                </label>
                <textarea
                  value={sourceMetadata}
                  onChange={(e) => setSourceMetadata(e.target.value)}
                  className="w-full h-[400px] font-mono text-sm rounded-md border border-gray-300 p-2"
                  placeholder="Paste your metadata here (JSON or YAML format)..."
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Output and Controls */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">OpenAPI Output</h2>
                <div className="space-x-2">
                  <button
                    onClick={convertToOpenApi}
                    disabled={converting || !sourceMetadata}
                    className={`px-4 py-2 rounded-md ${
                      converting || !sourceMetadata
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white flex items-center space-x-2`}
                  >
                    {converting ? (
                      <>
                        <RefreshCwIcon size={16} className="animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightIcon size={16} />
                        <span>Convert</span>
                      </>
                    )}
                  </button>
                  {openApiSpec && (
                    <button
                      onClick={exportToInsomnia}
                      className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                    >
                      <PackageIcon size={16} />
                      <span>Export</span>
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-md flex items-start space-x-2 text-red-600">
                  <AlertCircleIcon size={18} className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {openApiSpec ? (
                <SyntaxHighlighter
                  language="json"
                  style={docco}
                  customStyle={{
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem'
                  }}
                >
                  {JSON.stringify(openApiSpec, null, 2)}
                </SyntaxHighlighter>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Convert your metadata to see the OpenAPI specification
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">
                Supported Metadata Formats
              </h3>
              <div className="space-y-2 text-sm text-blue-600">
                <p>• JSON or YAML format</p>
                <p>• Automatic structure detection</p>
                <p>• Common fields: title, version, description, endpoints</p>
                <p>• Existing OpenAPI/Swagger specifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MetadataBuilderPage;