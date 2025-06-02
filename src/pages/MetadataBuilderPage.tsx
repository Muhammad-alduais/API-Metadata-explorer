import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  BookOpenIcon,
  CodeIcon,
  DatabaseIcon,
  FileJsonIcon,
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  PackageIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  SaveIcon
} from 'lucide-react';

SyntaxHighlighter.registerLanguage('json', json);

interface MetadataField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  format?: string;
  example?: string;
}

interface Endpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: MetadataField[];
  responses: {
    [key: string]: {
      description: string;
      content?: {
        [key: string]: {
          schema: any;
        };
      };
    };
  };
}

const MetadataBuilderPage: React.FC = () => {
  const [customMetadata, setCustomMetadata] = useState<{
    info: {
      title: string;
      version: string;
      description: string;
    };
    servers: { url: string; description: string }[];
    endpoints: Endpoint[];
  }>({
    info: {
      title: '',
      version: '1.0.0',
      description: ''
    },
    servers: [{ url: '', description: '' }],
    endpoints: []
  });

  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'preview' | 'validation'>('structure');
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(null);

  const { register, handleSubmit, watch } = useForm();

  const validateMetadata = () => {
    const errors: string[] = [];

    // Basic validation
    if (!customMetadata.info.title) {
      errors.push('API title is required');
    }
    if (!customMetadata.info.version) {
      errors.push('API version is required');
    }
    if (customMetadata.servers.length === 0 || !customMetadata.servers[0].url) {
      errors.push('At least one server URL is required');
    }
    if (customMetadata.endpoints.length === 0) {
      errors.push('At least one endpoint is required');
    }

    // Endpoint validation
    customMetadata.endpoints.forEach((endpoint, index) => {
      if (!endpoint.path) {
        errors.push(`Endpoint ${index + 1}: Path is required`);
      }
      if (!endpoint.method) {
        errors.push(`Endpoint ${index + 1}: HTTP method is required`);
      }
      if (!endpoint.summary) {
        errors.push(`Endpoint ${index + 1}: Summary is required`);
      }

      // Parameter validation
      endpoint.parameters.forEach((param, paramIndex) => {
        if (!param.name) {
          errors.push(`Endpoint ${index + 1}, Parameter ${paramIndex + 1}: Name is required`);
        }
        if (!param.type) {
          errors.push(`Endpoint ${index + 1}, Parameter ${paramIndex + 1}: Type is required`);
        }
      });
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const convertToOpenApi = () => {
    if (!validateMetadata()) {
      toast.error('Please fix validation errors before converting');
      return;
    }

    setConverting(true);

    try {
      const openApiDocument = {
        openapi: '3.0.3',
        info: customMetadata.info,
        servers: customMetadata.servers,
        paths: {}
      };

      // Convert endpoints to OpenAPI paths
      customMetadata.endpoints.forEach(endpoint => {
        if (!openApiDocument.paths[endpoint.path]) {
          openApiDocument.paths[endpoint.path] = {};
        }

        openApiDocument.paths[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.summary,
          description: endpoint.description,
          parameters: endpoint.parameters.map(param => ({
            name: param.name,
            in: param.type === 'path' ? 'path' : 'query',
            required: param.required,
            description: param.description,
            schema: {
              type: param.type === 'integer' ? 'integer' : 'string',
              format: param.format,
              example: param.example
            }
          })),
          responses: endpoint.responses
        };
      });

      setOpenApiSpec(openApiDocument);
      toast.success('Successfully converted to OpenAPI specification');
    } catch (error) {
      toast.error('Error converting to OpenAPI format');
      console.error('Conversion error:', error);
    } finally {
      setConverting(false);
    }
  };

  const addEndpoint = () => {
    setCustomMetadata(prev => ({
      ...prev,
      endpoints: [
        ...prev.endpoints,
        {
          path: '',
          method: 'GET',
          summary: '',
          description: '',
          parameters: [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {}
                  }
                }
              }
            }
          }
        }
      ]
    }));
  };

  const removeEndpoint = (index: number) => {
    setCustomMetadata(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index)
    }));
    if (selectedEndpoint === index) {
      setSelectedEndpoint(null);
    }
  };

  const addParameter = (endpointIndex: number) => {
    setCustomMetadata(prev => {
      const newEndpoints = [...prev.endpoints];
      newEndpoints[endpointIndex].parameters.push({
        name: '',
        type: 'string',
        required: false,
        description: ''
      });
      return { ...prev, endpoints: newEndpoints };
    });
  };

  const removeParameter = (endpointIndex: number, paramIndex: number) => {
    setCustomMetadata(prev => {
      const newEndpoints = [...prev.endpoints];
      newEndpoints[endpointIndex].parameters = newEndpoints[endpointIndex].parameters.filter(
        (_, i) => i !== paramIndex
      );
      return { ...prev, endpoints: newEndpoints };
    });
  };

  const exportToInsomnia = () => {
    if (!openApiSpec) {
      toast.error('Please convert to OpenAPI format first');
      return;
    }

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
          {/* Left Panel - Metadata Structure */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                <LayersIcon size={18} className="mr-2 text-blue-600" />
                Metadata Structure
              </h2>

              {/* Basic Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Title
                  </label>
                  <input
                    type="text"
                    value={customMetadata.info.title}
                    onChange={e =>
                      setCustomMetadata(prev => ({
                        ...prev,
                        info: { ...prev.info, title: e.target.value }
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="My API"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={customMetadata.info.version}
                    onChange={e =>
                      setCustomMetadata(prev => ({
                        ...prev,
                        info: { ...prev.info, version: e.target.value }
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={customMetadata.info.description}
                    onChange={e =>
                      setCustomMetadata(prev => ({
                        ...prev,
                        info: { ...prev.info, description: e.target.value }
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    placeholder="API description..."
                  />
                </div>
              </div>

              {/* Servers */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Servers</h3>
                {customMetadata.servers.map((server, index) => (
                  <div key={index} className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={server.url}
                      onChange={e => {
                        const newServers = [...customMetadata.servers];
                        newServers[index].url = e.target.value;
                        setCustomMetadata(prev => ({ ...prev, servers: newServers }));
                      }}
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="https://api.example.com"
                    />
                    <input
                      type="text"
                      value={server.description}
                      onChange={e => {
                        const newServers = [...customMetadata.servers];
                        newServers[index].description = e.target.value;
                        setCustomMetadata(prev => ({ ...prev, servers: newServers }));
                      }}
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="Server description"
                    />
                  </div>
                ))}
              </div>

              {/* Endpoints */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-medium text-gray-700">Endpoints</h3>
                  <button
                    onClick={addEndpoint}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <PlusIcon size={16} />
                    <span>Add Endpoint</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {customMetadata.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">
                          Endpoint {index + 1}
                        </h4>
                        <button
                          onClick={() => removeEndpoint(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={endpoint.path}
                            onChange={e => {
                              const newEndpoints = [...customMetadata.endpoints];
                              newEndpoints[index].path = e.target.value;
                              setCustomMetadata(prev => ({
                                ...prev,
                                endpoints: newEndpoints
                              }));
                            }}
                            className="rounded-md border border-gray-300 p-2"
                            placeholder="/path"
                          />
                          <select
                            value={endpoint.method}
                            onChange={e => {
                              const newEndpoints = [...customMetadata.endpoints];
                              newEndpoints[index].method = e.target.value;
                              setCustomMetadata(prev => ({
                                ...prev,
                                endpoints: newEndpoints
                              }));
                            }}
                            className="rounded-md border border-gray-300 p-2"
                          >
                            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(method => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>

                        <input
                          type="text"
                          value={endpoint.summary}
                          onChange={e => {
                            const newEndpoints = [...customMetadata.endpoints];
                            newEndpoints[index].summary = e.target.value;
                            setCustomMetadata(prev => ({
                              ...prev,
                              endpoints: newEndpoints
                            }));
                          }}
                          className="w-full rounded-md border border-gray-300 p-2"
                          placeholder="Summary"
                        />

                        <textarea
                          value={endpoint.description}
                          onChange={e => {
                            const newEndpoints = [...customMetadata.endpoints];
                            newEndpoints[index].description = e.target.value;
                            setCustomMetadata(prev => ({
                              ...prev,
                              endpoints: newEndpoints
                            }));
                          }}
                          className="w-full rounded-md border border-gray-300 p-2"
                          rows={2}
                          placeholder="Description"
                        />

                        {/* Parameters */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-700">
                              Parameters
                            </h5>
                            <button
                              onClick={() => addParameter(index)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              <PlusIcon size={14} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <div
                                key={paramIndex}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="text"
                                  value={param.name}
                                  onChange={e => {
                                    const newEndpoints = [...customMetadata.endpoints];
                                    newEndpoints[index].parameters[paramIndex].name =
                                      e.target.value;
                                    setCustomMetadata(prev => ({
                                      ...prev,
                                      endpoints: newEndpoints
                                    }));
                                  }}
                                  className="flex-grow rounded-md border border-gray-300 p-1 text-sm"
                                  placeholder="Parameter name"
                                />
                                <select
                                  value={param.type}
                                  onChange={e => {
                                    const newEndpoints = [...customMetadata.endpoints];
                                    newEndpoints[index].parameters[paramIndex].type =
                                      e.target.value;
                                    setCustomMetadata(prev => ({
                                      ...prev,
                                      endpoints: newEndpoints
                                    }));
                                  }}
                                  className="rounded-md border border-gray-300 p-1 text-sm"
                                >
                                  <option value="string">String</option>
                                  <option value="integer">Integer</option>
                                  <option value="boolean">Boolean</option>
                                  <option value="array">Array</option>
                                  <option value="object">Object</option>
                                </select>
                                <button
                                  onClick={() => removeParameter(index, paramIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview and Validation */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('structure')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'structure'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Structure
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'validation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Validation
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-50 rounded-lg p-4">
              {activeTab === 'structure' && (
                <div>
                  <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                    <CodeIcon size={18} className="mr-2 text-blue-600" />
                    Current Structure
                  </h2>
                  <SyntaxHighlighter
                    language="json"
                    style={docco}
                    customStyle={{
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem'
                    }}
                  >
                    {JSON.stringify(customMetadata, null, 2)}
                  </SyntaxHighlighter>
                </div>
              )}

              {activeTab === 'preview' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center text-lg font-semibold text-gray-700">
                      <FileJsonIcon size={18} className="mr-2 text-blue-600" />
                      OpenAPI Preview
                    </h2>
                    <div className="space-x-2">
                      <button
                        onClick={convertToOpenApi}
                        disabled={converting}
                        className={`px-4 py-2 rounded-md ${
                          converting
                            ? 'bg-blue-400'
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
                      Click "Convert" to see the OpenAPI specification
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'validation' && (
                <div>
                  <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                    <AlertCircleIcon size={18} className="mr-2 text-blue-600" />
                    Validation Results
                  </h2>

                  {validationErrors.length > 0 ? (
                    <div className="space-y-2">
                      {validationErrors.map((error, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 text-red-600 bg-red-50 p-2 rounded"
                        >
                          <AlertCircleIcon size={16} className="mt-0.5" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded">
                      <CheckCircleIcon size={20} />
                      <span>No validation errors found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MetadataBuilderPage;