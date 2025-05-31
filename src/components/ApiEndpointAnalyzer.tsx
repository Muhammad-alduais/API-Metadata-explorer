import React, { useState } from 'react';
import { SearchIcon, PlayIcon, AlertCircleIcon, DatabaseIcon, FileJsonIcon } from 'lucide-react';
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

const ApiEndpointAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<ApiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'insomnia' | 'openapi'>('insomnia');

  const analyzeEndpoint = async () => {
    if (!url) {
      setError('Please enter an API endpoint URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, try to detect if it's a Census API endpoint
      const isCensusApi = url.includes('api.census.gov');
      let analysisResult: ApiAnalysis;

      if (isCensusApi) {
        // Handle Census API endpoint
        analysisResult = await analyzeCensusEndpoint(url);
      } else {
        // Handle regular API endpoint
        analysisResult = await analyzeRegularEndpoint(url);
      }

      setAnalysis(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze endpoint');
    } finally {
      setLoading(false);
    }
  };

  const exportCollection = async () => {
    if (!analysis) return;

    try {
      if (exportType === 'insomnia') {
        const collection = generateInsomniaCollection(analysis);
        downloadJson(collection, 'insomnia_collection.json');
        toast.success('Insomnia collection exported successfully');
      } else {
        const spec = generateOpenApiSpec(analysis);
        downloadJson(spec, 'openapi_spec.json');
        toast.success('OpenAPI specification exported successfully');
      }
    } catch (err) {
      toast.error('Failed to export collection');
    }
  };

  return (
    <div className="space-y-6">
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
        <button
          onClick={analyzeEndpoint}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white ${
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

// Helper functions for Census API analysis
async function analyzeCensusEndpoint(url: string): Promise<ApiAnalysis> {
  // Try to fetch variables.json for Census endpoints
  const varsUrl = url.endsWith('/') ? `${url}variables.json` : `${url}/variables.json`;
  
  try {
    const response = await fetch(varsUrl);
    const varsData = await response.json();

    return {
      apiType: 'Census REST API',
      baseUrl: url,
      auth: { type: 'None', required: false },
      methods: ['GET'],
      format: {
        request: 'JSON',
        response: 'JSON'
      },
      parameters: {
        query: Object.entries(varsData.variables || {}).map(([name, data]: [string, any]) => ({
          name,
          type: data.type || 'string',
          required: data.required === 'true',
          description: data.label || data.description
        })),
        path: []
      },
      headers: [],
      responseSchema: {
        type: 'array',
        properties: {
          items: {
            type: 'array',
            properties: {
              items: { type: 'string' }
            }
          }
        }
      },
      censusPatterns: {
        matches: true,
        similarities: ['Census API endpoint', 'Variables metadata available'],
        variables: varsData.variables
      }
    };
  } catch {
    throw new Error('Failed to fetch Census API metadata');
  }
}

// Helper functions for regular API analysis
async function analyzeRegularEndpoint(url: string): Promise<ApiAnalysis> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await response.json() : await response.text();

  const urlParts = new URL(url);
  const pathSegments = urlParts.pathname.split('/').filter(Boolean);
  const queryParams = Array.from(urlParts.searchParams.entries());

  return {
    apiType: detectApiType(url, contentType),
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

function detectApiType(url: string, contentType: string): string {
  if (url.includes('/graphql')) return 'GraphQL';
  if (contentType.includes('soap')) return 'SOAP';
  if (url.includes('odata')) return 'OData';
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

function generateInsomniaCollection(analysis: ApiAnalysis): any {
  const workspaceId = `wrk_${Date.now()}`;
  const collection = {
    _type: "export",
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: "insomnia.desktop.app:v2023.5.8",
    resources: [
      {
        _id: workspaceId,
        _type: "workspace",
        name: "API Collection",
        description: "",
        scope: "collection"
      }
    ]
  };

  // Add request based on analysis
  const requestId = `req_${Date.now()}`;
  const request = {
    _id: requestId,
    _type: "request",
    parentId: workspaceId,
    name: "API Request",
    method: analysis.methods[0],
    url: analysis.baseUrl,
    parameters: analysis.parameters.query.map(param => ({
      name: param.name,
      value: "",
      description: param.description
    })),
    headers: analysis.headers.map(header => ({
      name: header.name,
      value: "",
      description: header.description
    }))
  };

  collection.resources.push(request);
  return collection;
}

function generateOpenApiSpec(analysis: ApiAnalysis): any {
  return {
    openapi: "3.0.3",
    info: {
      title: "API Specification",
      version: "1.0.0"
    },
    paths: {
      "/": {
        get: {
          parameters: [
            ...analysis.parameters.query.map(param => ({
              name: param.name,
              in: "query",
              schema: { type: param.type },
              required: param.required,
              description: param.description
            }))
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: analysis.responseSchema
                }
              }
            }
          }
        }
      }
    }
  };
}

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default ApiEndpointAnalyzer;