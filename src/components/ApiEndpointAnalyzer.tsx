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
  path: string[];
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
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [parameterInput, setParameterInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'json' | 'text'>('url');
  const [jsonInput, setJsonInput] = useState('');
  const [textInput, setTextInput] = useState('');

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

  const parseUrl = (urlString: string) => {
    try {
      const parsedUrl = new URL(urlString);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      
      // Known API patterns for path/parameter detection
      const apiPatterns = {
        github: {
          baseUrl: 'https://api.github.com',
          pathParams: ['users', 'repos', 'gists', 'issues'],
          queryParams: ['page', 'per_page', 'sort', 'direction']
        },
        census: {
          baseUrl: 'https://api.census.gov',
          pathParams: ['data', 'timeseries', 'acs', 'dec'],
          queryParams: ['get', 'for', 'in', 'time']
        },
        // Add more API patterns as needed
      };

      // Detect which API we're dealing with
      let detectedApi = null;
      for (const [api, pattern] of Object.entries(apiPatterns)) {
        if (urlString.startsWith(pattern.baseUrl)) {
          detectedApi = { api, pattern };
          break;
        }
      }

      let path = [];
      let queryParams = [];

      if (detectedApi) {
        // Handle known API patterns
        const { api, pattern } = detectedApi;
        
        // Split path into known path segments and parameters
        path = pathSegments.filter(segment => {
          return pattern.pathParams.includes(segment) || 
                 pattern.pathParams.some(p => segment.startsWith(p + '/'));
        });

        // The remaining segments are likely path parameters
        const pathParams = pathSegments.filter(segment => !path.includes(segment));
        
        // Add path parameters to the parameters list
        pathParams.forEach(param => {
          if (!parameters.some(p => p.value === param)) {
            parameters.push({
              name: `path_${param}`,
              value: param
            });
          }
        });

        // Handle query parameters
        parsedUrl.searchParams.forEach((value, key) => {
          if (pattern.queryParams.includes(key)) {
            queryParams.push({ name: key, value });
          }
        });
      } else {
        // Generic handling for unknown APIs
        path = pathSegments;
        parsedUrl.searchParams.forEach((value, key) => {
          queryParams.push({ name: key, value });
        });
      }

      return {
        baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
        path,
        queryParams
      };
    } catch (error) {
      throw new Error('Invalid URL format');
    }
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
        const parsedUrl = parseUrl(url);
        const urlWithParams = new URL(url);
        parameters.forEach(param => {
          urlWithParams.searchParams.append(param.name, param.value);
        });
        
        analysisResult = await analyzeRegularEndpoint(urlWithParams.toString(), parsedUrl);
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

  const exportCollection = async () => {
    if (!analysis) {
      toast.error('No analysis data available to export');
      return;
    }

    try {
      const workspaceId = `wrk_${Date.now()}`;
      const requestId = `req_${Date.now()}`;
      const envId = `env_${workspaceId}`;

      // Build environment data
      const envData: Record<string, any> = {
        base_url: analysis.baseUrl
      };

      // Add parameters to environment
      parameters.forEach(param => {
        envData[`param_${param.name}`] = param.value;
      });

      // Add auth token if required
      if (analysis.auth.required) {
        envData.auth_token = "your-auth-token-here";
      }

      // Build the request URL with path parameters
      const urlPath = analysis.path.join('/');
      const requestUrl = `{{ base_url }}/${urlPath}`;

      // Build headers based on API type
      const headers = [...analysis.headers];
      if (analysis.apiType === 'GraphQL') {
        headers.push({
          name: 'Content-Type',
          required: true,
          description: 'GraphQL request content type',
          value: 'application/json'
        });
      } else if (analysis.apiType === 'SOAP') {
        headers.push({
          name: 'Content-Type',
          required: true,
          description: 'SOAP request content type',
          value: 'application/soap+xml'
        });
      }

      // Build request body based on API type
      let body: any = {};
      if (analysis.apiType === 'GraphQL') {
        body = {
          mimeType: 'application/json',
          text: JSON.stringify({
            query: "query { ... }",
            variables: {}
          })
        };
      } else if (analysis.apiType === 'SOAP') {
        body = {
          mimeType: 'application/soap+xml',
          text: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <!-- Add your SOAP request here -->
  </soap:Body>
</soap:Envelope>`
        };
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
            description: `Generated from ${analysis.apiType} endpoint analysis`,
            scope: "collection"
          },
          {
            _id: envId,
            _type: "environment",
            parentId: workspaceId,
            name: "Base Environment",
            data: envData
          },
          {
            _id: requestId,
            _type: "request",
            parentId: workspaceId,
            name: `${analysis.apiType} Request`,
            description: `Auto-generated ${analysis.apiType} request`,
            url: requestUrl,
            method: analysis.methods[0] || "GET",
            body: body,
            parameters: [
              ...analysis.parameters.query.map(param => ({
                name: param.name,
                value: `{{ param_${param.name} }}`,
                description: param.description || `${param.type} parameter`,
                disabled: !param.required
              })),
              ...analysis.parameters.path.map(param => ({
                name: param.name,
                value: `{{ param_${param.name} }}`,
                description: param.description || `Path parameter (${param.type})`,
                disabled: false
              }))
            ],
            headers: headers.map(header => ({
              id: `header_${Date.now()}_${header.name}`,
              name: header.name,
              value: header.value || "",
              description: header.description || "",
              disabled: !header.required
            })),
            authentication: analysis.auth.required ? {
              type: analysis.auth.type.toLowerCase(),
              disabled: false,
              prefix: analysis.auth.type === 'Bearer Token' ? 'Bearer' : undefined,
              token: "{{ auth_token }}"
            } : {
              type: "none"
            }
          }
        ]
      };

      // Add rate limiting info if available
      if (analysis.rateLimit) {
        insomniaCollection.resources[0].description += `\nRate Limit: ${analysis.rateLimit.requests} requests ${analysis.rateLimit.period}`;
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
                {analysis.apiType} API Endpoint
              </h3>
            </div>
            
            <button
              onClick={exportCollection}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FileJsonIcon size={18} />
              <span>Export Insomnia Collection</span>
            </button>
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
async function analyzeRegularEndpoint(url: string, parsedUrl: any): Promise<ApiAnalysis> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await response.json() : await response.text();

  return {
    apiType: detectApiType(url, contentType, response.headers),
    baseUrl: parsedUrl.baseUrl,
    path: parsedUrl.path,
    auth: detectAuth(response.headers),
    methods: detectMethods(response.headers),
    format: {
      request: contentType.includes('json') ? 'JSON' : 'Plain Text',
      response: contentType.includes('json') ? 'JSON' : 'Plain Text'
    },
    parameters: {
      query: parsedUrl.queryParams.map(({ name, value }: any) => ({
        name,
        type: detectParamType(value),
        required: false,
        description: `Query parameter: ${name}`
      })),
      path: parsedUrl.path.map((segment: string, index: number) => ({
        name: segment,
        type: 'string',
        description: `Path segment ${index + 1}`
      }))
    },
    headers: detectRequiredHeaders(response.headers),
    responseSchema: contentType.includes('json') 
      ? generateJsonSchema(data)
      : { type: 'string', properties: {} },
    rateLimit: detectRateLimit(response.headers)
  };
}

const analyzeJsonInput = async (jsonData: string): Promise<ApiAnalysis> => {
  try {
    const data = JSON.parse(jsonData);
    return {
      apiType: 'JSON Data',
      baseUrl: '',
      path: [],
      auth: { type: 'None', required: false },
      methods: ['GET'],
      format: {
        request: 'JSON',
        response: 'JSON'
      },
      parameters: {
        query: [],
        path: []
      },
      headers: [],
      responseSchema: generateJsonSchema(data)
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
    path: [],
    auth: { type: 'None', required: false },
    methods: ['GET'],
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
    responseSchema: { type: 'string', properties: {} }
  };
};

function detectApiType(url: string, contentType: string, headers: Headers): string {
  // Check URL patterns
  if (url.includes('/graphql')) return 'GraphQL';
  if (url.includes('api.github.com')) return 'GitHub REST';
  if (url.includes('api.census.gov')) return 'Census';
  if (url.includes('odata')) return 'OData';
  
  // Check content type
  if (contentType.includes('soap+xml')) return 'SOAP';
  if (contentType.includes('graphql')) return 'GraphQL';
  if (contentType.includes('odata')) return 'OData';
  
  // Check headers
  if (headers.get('graphql-schema')) return 'GraphQL';
  if (headers.get('odata-version')) return 'OData';
  if (headers.get('soapaction')) return 'SOAP';
  
  return 'REST';
}

function detectMethods(headers: Headers): string[] {
  const allowHeader = headers.get('allow');
  if (allowHeader) {
    return allowHeader.split(',').map(method => method.trim());
  }
  return ['GET'];
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

function detectRequiredHeaders(headers: Headers): Array<{ name: string; required: boolean; description?: string; value?: string }> {
  const requiredHeaders = [];
  const contentType = headers.get('content-type');
  if (contentType) {
    requiredHeaders.push({
      name: 'Content-Type',
      required: true,
      description: `Expected: ${contentType}`,
      value: contentType
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