import React, { useState } from 'react';
import { SearchIcon, PlayIcon, AlertCircleIcon, DatabaseIcon, FileJsonIcon, UploadIcon, PlusIcon, XIcon } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { toast } from 'react-toastify';

SyntaxHighlighter.registerLanguage('json', json);

interface ApiAnalysis {
  apiType: string;
  baseUrl: string;
  auth: {
    type: string;
    required: boolean;
    location?: string;
  };
  methods: string[];
  format: {
    request: string;
    response: string;
  };
  parameters: {
    query: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    path: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  };
  headers: Array<{
    name: string;
    required: boolean;
    description?: string;
  }>;
  responseSchema: {
    type: string;
    properties: Record<string, any>;
  };
  rateLimit?: {
    requests: number;
    period: string;
    header?: string;
  };
  censusPatterns?: {
    matches: boolean;
    similarities: string[];
    variables?: Record<string, any>;
  };
}

interface Parameter {
  name: string;
  value: string;
}

const ApiEndpointAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<ApiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'insomnia' | 'openapi'>('insomnia');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [parameterInput, setParameterInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'json' | 'text'>('url');
  const [jsonInput, setJsonInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const exportCollection = () => {
    if (!analysis) {
      toast.error('No analysis data available to export');
      return;
    }

    try {
      const workspaceId = `wrk_${Date.now()}`;
      const requestId = `req_${Date.now()}`;

      // Determine API-specific configurations
      let apiConfig = {
        method: analysis.methods[0] || "GET",
        bodyType: analysis.format.request === 'JSON' ? 'application/json' : 'text/plain',
        authType: analysis.auth.type.toLowerCase(),
        headers: [...analysis.headers],
        parameters: [...analysis.parameters.query]
      };

      // Adjust configuration based on API type
      switch (analysis.apiType.toLowerCase()) {
        case 'graphql':
          apiConfig.method = 'POST';
          apiConfig.bodyType = 'application/json';
          apiConfig.headers.push({
            name: 'Content-Type',
            required: true,
            description: 'GraphQL request content type'
          });
          break;

        case 'soap':
          apiConfig.method = 'POST';
          apiConfig.bodyType = 'application/soap+xml';
          apiConfig.headers.push({
            name: 'Content-Type',
            required: true,
            description: 'SOAP request content type'
          });
          break;

        case 'odata':
          apiConfig.headers.push({
            name: 'OData-Version',
            required: true,
            description: 'OData protocol version'
          });
          break;
      }

      const insomniaCollection = {
        _type: "export",
        __export_format: 4,
        __export_date: new Date().toISOString(),
        __export_source: "insomnia.desktop.app:v2023.5.8",
        resources: [
          {
            _id: workspaceId,
            _type: "workspace",
            name: `${analysis.apiType} API Collection`,
            description: `Analyzed ${analysis.apiType} endpoint with ${analysis.parameters.query.length} parameters`,
            scope: "collection"
          },
          {
            _id: requestId,
            _type: "request",
            parentId: workspaceId,
            name: `${analysis.apiType} Request`,
            description: `Auto-generated ${analysis.apiType} request`,
            url: analysis.baseUrl,
            method: apiConfig.method,
            body: {
              mimeType: apiConfig.bodyType,
              text: analysis.apiType === 'graphql' ? 
                JSON.stringify({ query: "", variables: {} }) : 
                ""
            },
            parameters: [
              ...analysis.parameters.query.map(param => ({
                id: `param_${Date.now()}_${param.name}`,
                name: param.name,
                value: "",
                description: param.description || `${param.type} parameter`,
                disabled: !param.required
              })),
              ...analysis.parameters.path.map(param => ({
                id: `param_${Date.now()}_${param.name}`,
                name: param.name,
                value: "",
                description: param.description || `Path parameter (${param.type})`,
                disabled: false
              }))
            ],
            headers: apiConfig.headers.map(header => ({
              id: `header_${Date.now()}_${header.name}`,
              name: header.name,
              value: header.name === 'Content-Type' ? apiConfig.bodyType : "",
              description: header.description || "",
              disabled: !header.required
            })),
            authentication: analysis.auth.required ? {
              type: analysis.auth.type.toLowerCase(),
              disabled: false,
              prefix: analysis.auth.type === 'Bearer Token' ? 'Bearer' : undefined,
              token: "{{ auth_token }}"
            } : {},
            metaSortKey: -1,
            isPrivate: false,
            settingStoreCookies: true,
            settingSendCookies: true,
            settingDisableRenderRequestBody: false,
            settingEncodeUrl: true,
            settingRebuildPath: true,
            settingFollowRedirects: "global"
          }
        ]
      };

      // Add environment variables
      const envId = `env_${workspaceId}`;
      const envData: Record<string, string> = {
        base_url: analysis.baseUrl,
        auth_token: "your-auth-token-here"
      };

      // Add custom parameters to environment
      parameters.forEach(param => {
        envData[param.name] = param.value;
      });

      insomniaCollection.resources.push({
        _id: envId,
        _type: "environment",
        parentId: workspaceId,
        name: "Base Environment",
        data: envData
      });

      // Add rate limiting info if available
      if (analysis.rateLimit) {
        const rateLimit = analysis.rateLimit;
        insomniaCollection.resources[0].description += `\nRate Limit: ${rateLimit.requests} requests ${rateLimit.period}`;
      }

      const blob = new Blob([JSON.stringify(insomniaCollection, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insomnia_${analysis.apiType.toLowerCase()}_collection.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Successfully exported ${analysis.apiType} Insomnia collection`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export collection';
      toast.error(errorMessage);
    }
  };

  const addParameter = () => {
    if (!parameterInput.trim()) return;

    // Handle different formats
    if (inputType === 'json') {
      try {
        const parsed = JSON.parse(parameterInput);
        const newParams = Object.entries(parsed).map(([name, value]) => ({
          name,
          value: String(value)
        }));
        setParameters([...parameters, ...newParams]);
        setParameterInput('');
      } catch (e) {
        toast.error('Invalid JSON format');
      }
    } else if (inputType === 'text') {
      const pairs = parameterInput.split(',').map(pair => {
        const [name, value] = pair.split(':').map(s => s.trim());
        return { name, value };
      });
      setParameters([...parameters, ...pairs]);
      setParameterInput('');
    } else {
      const [name, value] = parameterInput.split(':').map(s => s.trim());
      if (name && value) {
        setParameters([...parameters, { name, value }]);
        setParameterInput('');
      }
    }
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const analyzeEndpoint = async () => {
    if (!url && !jsonInput && !textInput) {
      setError('Please enter an API endpoint URL or data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let analysisResult: ApiAnalysis;
      
      if (inputType === 'url') {
        // Add parameters to URL if present
        const urlObj = new URL(url);
        parameters.forEach(param => {
          urlObj.searchParams.append(param.name, param.value);
        });
        analysisResult = await analyzeRegularEndpoint(urlObj.toString());
      } else if (inputType === 'json') {
        analysisResult = await analyzeJsonInput(jsonInput);
      } else {
        analysisResult = await analyzeTextInput(textInput);
      }

      setAnalysis(analysisResult);
      toast.success('Analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze endpoint';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-4">
          {/* Input Type Selector */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setInputType('url')}
              className={`px-4 py-2 rounded-md ${
                inputType === 'url' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              URL Input
            </button>
            <button
              onClick={() => setInputType('json')}
              className={`px-4 py-2 rounded-md ${
                inputType === 'json' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              JSON Input
            </button>
            <button
              onClick={() => setInputType('text')}
              className={`px-4 py-2 rounded-md ${
                inputType === 'text' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Text Input
            </button>
          </div>

          {/* URL Input */}
          {inputType === 'url' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-grow relative">
                  <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter API endpoint URL..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Parameters Input */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={parameterInput}
                    onChange={(e) => setParameterInput(e.target.value)}
                    placeholder="Add parameter (name:value)"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addParameter()}
                  />
                  <button
                    onClick={addParameter}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon size={18} />
                  </button>
                </div>

                {/* Parameters List */}
                {parameters.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                    {parameters.map((param, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 bg-white px-2 py-1 rounded border border-gray-200"
                      >
                        <span className="text-sm">
                          <span className="font-medium">{param.name}:</span> {param.value}
                        </span>
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* JSON Input */}
          {inputType === 'json' && (
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON data here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {/* Text Input */}
          {inputType === 'text' && (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text data (comma or newline separated)..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {/* Analyze Button */}
          <div className="flex justify-end">
            <button
              onClick={analyzeEndpoint}
              disabled={loading}
              className={`flex items-center space-x-2 px-6 py-2 rounded-md text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <PlayIcon size={18} />
              )}
              <span>Analyze</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
          <AlertCircleIcon size={18} />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DatabaseIcon size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {analysis.censusPatterns?.matches ? 'Census API Endpoint' : 'Regular API Endpoint'}
              </h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as 'insomnia' | 'openapi')}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="insomnia">Insomnia Collection</option>
                <option value="openapi">OpenAPI Specification</option>
              </select>
              
              <button
                onClick={exportCollection}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
              >
                <FileJsonIcon size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <SyntaxHighlighter 
                language="json" 
                style={docco}
                customStyle={{
                  backgroundColor: 'transparent',
                  padding: '1rem',
                  margin: 0,
                  borderRadius: '0.375rem'
                }}
              >
                {JSON.stringify(analysis, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for regular API analysis
async function analyzeRegularEndpoint(url: string): Promise<ApiAnalysis> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await response.json() : await response.text();

  const urlParts = new URL(url);
  const pathSegments = urlParts.pathname.split('/').filter(Boolean);
  const queryParams = Array.from(urlParts.searchParams.entries());

  return {
    apiType: detectApiType(url, contentType, response.headers),
    baseUrl: `${urlParts.protocol}//${urlParts.host}${pathSegments[0] ? '/' + pathSegments[0] : ''}`,
    auth: detectAuth(response.headers),
    methods: ['GET'],
    format: {
      request: contentType.includes('json') ? 'JSON' : 'Plain Text',
      response: contentType.includes('json') ? 'JSON' : 'Plain Text'
    },
    parameters: {
      query: queryParams.map(([name, value]) => ({
        name,
        type: detectParamType(value),
        required: false,
        description: `Query parameter: ${name}`
      })),
      path: pathSegments.map((segment, index) => ({
        name: segment,
        type: 'string',
        description: `Path segment ${index + 1}`
      }))
    },
    headers: detectRequiredHeaders(response.headers),
    responseSchema: contentType.includes('json') 
      ? generateJsonSchema(data)
      : { type: 'string', properties: {} },
    rateLimit: detectRateLimit(response.headers),
    censusPatterns: {
      matches: false,
      similarities: []
    }
  };
}

const analyzeJsonInput = async (jsonData: string): Promise<ApiAnalysis> => {
  try {
    const data = JSON.parse(jsonData);
    return {
      apiType: 'JSON Data',
      baseUrl: '',
      auth: { type: 'None', required: false },
      methods: [],
      format: {
        request: 'JSON',
        response: 'JSON'
      },
      parameters: {
        query: [],
        path: []
      },
      headers: [],
      responseSchema: generateJsonSchema(data),
      censusPatterns: {
        matches: false,
        similarities: []
      }
    };
  } catch (e) {
    throw new Error('Invalid JSON data');
  }
};

const analyzeTextInput = async (text: string): Promise<ApiAnalysis> => {
  const lines = text.split(/[\n,]/).map(line => line.trim()).filter(Boolean);
  const parameters = lines.map(line => {
    const [name, value] = line.split(':').map(s => s.trim());
    return { name: name || line, value: value || '' };
  });

  return {
    apiType: 'Text Data',
    baseUrl: '',
    auth: { type: 'None', required: false },
    methods: [],
    format: {
      request: 'Text',
      response: 'Text'
    },
    parameters: {
      query: parameters.map(p => ({
        name: p.name,
        type: detectParamType(p.value),
        required: false,
        description: `Parameter: ${p.name}`
      })),
      path: []
    },
    headers: [],
    responseSchema: { type: 'string', properties: {} },
    censusPatterns: {
      matches: false,
      similarities: []
    }
  };
};

function detectApiType(url: string, contentType: string, headers: Headers): string {
  // Check URL patterns
  if (url.includes('/graphql')) return 'GraphQL';
  if (url.includes('odata')) return 'OData';
  
  // Check content type
  if (contentType.includes('soap+xml')) return 'SOAP';
  if (contentType.includes('graphql')) return 'GraphQL';
  if (contentType.includes('odata')) return 'OData';
  
  // Check headers
  if (headers.get('graphql-schema')) return 'GraphQL';
  if (headers.get('odata-version')) return 'OData';
  if (headers.get('soapaction')) return 'SOAP';
  
  // Check for Census API patterns
  if (url.includes('api.census.gov')) return 'Census';
  
  return 'REST';
}

function detectAuth(headers: Headers): { type: string; required: boolean; location?: string } {
  const authHeader = headers.get('www-authenticate');
  if (authHeader) {
    if (authHeader.toLowerCase().includes('bearer')) {
      return { type: 'Bearer Token', required: true, location: 'header' };
    }
    if (authHeader.toLowerCase().includes('basic')) {
      return { type: 'Basic Auth', required: true, location: 'header' };
    }
  }
  return { type: 'None', required: false };
}

function detectParamType(value: string): string {
  if (/^\d+$/.test(value)) return 'integer';
  if (/^\d*\.\d+$/.test(value)) return 'number';
  if (/^(true|false)$/i.test(value)) return 'boolean';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
  return 'string';
}

function detectRequiredHeaders(headers: Headers): Array<{ name: string; required: boolean; description?: string }> {
  const requiredHeaders = [];
  const contentType = headers.get('content-type');
  if (contentType) {
    requiredHeaders.push({
      name: 'Content-Type',
      required: true,
      description: `Expected: ${contentType}`
    });
  }
  return requiredHeaders;
}

function generateJsonSchema(data: any): { type: string; properties: Record<string, any> } {
  if (Array.isArray(data)) {
    return {
      type: 'array',
      properties: {
        items: generateJsonSchema(data[0])
      }
    };
  }
  if (typeof data === 'object' && data !== null) {
    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      properties[key] = {
        type: typeof value,
        ...(typeof value === 'object' && value !== null && { properties: generateJsonSchema(value).properties })
      };
    }
    return { type: 'object', properties };
  }
  return { type: typeof data, properties: {} };
}

function detectRateLimit(headers: Headers): { requests: number; period: string; header?: string } | undefined {
  const rateLimit = headers.get('x-ratelimit-limit');
  const rateLimitReset = headers.get('x-ratelimit-reset');
  
  if (rateLimit) {
    return {
      requests: parseInt(rateLimit, 10),
      period: rateLimitReset ? 'per reset period' : 'per hour',
      header: 'x-ratelimit-limit'
    };
  }
  return undefined;
}

export default ApiEndpointAnalyzer;

export default ApiEndpointAnalyzer