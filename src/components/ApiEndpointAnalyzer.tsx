import React, { useState } from 'react';
import { SearchIcon, PlayIcon, AlertCircleIcon } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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
  };
}

const ApiEndpointAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<ApiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEndpoint = async () => {
    if (!url) {
      setError('Please enter an API endpoint URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Perform OPTIONS request to get API metadata
      const options = await fetch(url, { method: 'OPTIONS' }).catch(() => null);
      
      // Perform GET request to analyze response
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('json') ? await response.json() : await response.text();

      // Analyze URL structure
      const urlParts = new URL(url);
      const pathSegments = urlParts.pathname.split('/').filter(Boolean);
      const queryParams = Array.from(urlParts.searchParams.entries());

      // Detect API type
      const apiType = detectApiType(url, contentType, data);

      // Build analysis object
      const analysisResult: ApiAnalysis = {
        apiType,
        baseUrl: `${urlParts.protocol}//${urlParts.host}${pathSegments[0] ? '/' + pathSegments[0] : ''}`,
        auth: detectAuth(response.headers),
        methods: options ? options.headers.get('allow')?.split(',').map(m => m.trim()) || ['GET'] : ['GET'],
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
        rateLimit: detectRateLimit(response.headers)
      };

      // Analyze similarities to Census API patterns
      analysisResult.censusPatterns = analyzeCensusPatterns(analysisResult);

      setAnalysis(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze endpoint');
    } finally {
      setLoading(false);
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">API Analysis Results</h3>
          </div>
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
      )}
    </div>
  );
};

// Helper functions
function detectApiType(url: string, contentType: string, data: any): string {
  if (url.includes('/graphql')) return 'GraphQL';
  if (contentType.includes('soap')) return 'SOAP';
  if (contentType.includes('json')) {
    if (url.includes('/api/v')) return 'REST';
    if (url.includes('odata')) return 'OData';
  }
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

function analyzeCensusPatterns(analysis: ApiAnalysis): { matches: boolean; similarities: string[] } {
  const similarities = [];

  // Check for Census-like patterns
  if (analysis.baseUrl.includes('api.census.gov')) {
    similarities.push('Census API domain');
  }
  if (analysis.parameters.query.some(p => p.name === 'get')) {
    similarities.push('Uses "get" parameter for variable selection');
  }
  if (analysis.format.response === 'JSON') {
    similarities.push('JSON response format');
  }

  return {
    matches: similarities.length > 0,
    similarities
  };
}

export default ApiEndpointAnalyzer;