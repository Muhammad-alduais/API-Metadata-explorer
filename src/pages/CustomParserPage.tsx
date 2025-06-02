import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import yaml from 'js-yaml';
import { 
  CodeIcon, 
  UploadIcon, 
  LinkIcon, 
  FileJsonIcon,
  CheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  InfoIcon
} from 'lucide-react';

SyntaxHighlighter.registerLanguage('json', json);

interface FormInputs {
  url?: string;
  file?: FileList;
  format: string;
  authType: string;
  authToken?: string;
  username?: string;
  password?: string;
}

const formatExamples = {
  json: 'https://api.github.com/repos/octocat/Hello-World',
  yaml: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml',
  openapi: 'https://petstore3.swagger.io/api/v3/openapi.json',
  raml: 'https://raw.githubusercontent.com/raml-org/raml-examples/master/others/world-music-api/api.raml'
};

const CustomParserPage: React.FC = () => {
  const { register, handleSubmit, watch, setValue } = useForm<FormInputs>({
    defaultValues: {
      format: 'auto',
      authType: 'none'
    }
  });
  
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insomniaCollection, setInsomniaCollection] = useState<any>(null);
  
  const authType = watch('authType');
  const selectedFormat = watch('format');

  useEffect(() => {
    if (selectedFormat !== 'auto') {
      setValue('url', formatExamples[selectedFormat as keyof typeof formatExamples] || '');
    }
  }, [selectedFormat, setValue]);

  const detectFormat = (content: string): string => {
    try {
      // Try parsing as JSON
      JSON.parse(content);
      return 'json';
    } catch {
      try {
        // Try parsing as YAML
        yaml.load(content);
        return 'yaml';
      } catch {
        // Check for specific format indicators
        if (content.includes('swagger:') || content.includes('openapi:')) {
          return 'openapi';
        }
        if (content.startsWith('#%RAML')) {
          return 'raml';
        }
      }
    }
    throw new Error('Unable to detect format');
  };

  const parseContent = async (content: string, format: string = 'auto') => {
    try {
      const detectedFormat = format === 'auto' ? detectFormat(content) : format;
      let parsed;

      switch (detectedFormat) {
        case 'json':
          parsed = JSON.parse(content);
          break;
        case 'yaml':
          parsed = yaml.load(content);
          break;
        case 'openapi':
          // Convert OpenAPI/Swagger to normalized format
          parsed = yaml.load(content);
          break;
        default:
          throw new Error(`Unsupported format: ${detectedFormat}`);
      }

      return parsed;
    } catch (error) {
      throw new Error(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertToInsomniaCollection = (data: any) => {
    const workspaceId = `wrk_${Date.now()}`;
    const resources = [
      {
        _id: workspaceId,
        _type: "workspace",
        name: data.info?.title || "Imported API",
        description: data.info?.description || "",
        scope: "collection"
      }
    ];

    // Add environment
    const envId = `env_${workspaceId}`;
    resources.push({
      _id: envId,
      _type: "environment",
      parentId: workspaceId,
      name: "Base Environment",
      data: {
        base_url: data.servers?.[0]?.url || data.basePath || ""
      }
    });

    // Process endpoints
    if (data.paths) {
      Object.entries(data.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
          if (method === 'parameters' || method === '$ref') return;

          const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          resources.push({
            _id: requestId,
            _type: "request",
            parentId: workspaceId,
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            description: operation.description || "",
            method: method.toUpperCase(),
            url: `{{ base_url }}${path}`,
            parameters: operation.parameters?.map((param: any) => ({
              name: param.name,
              value: param.default || "",
              description: param.description || "",
              disabled: !param.required
            })) || [],
            headers: [],
            authentication: {}
          });
        });
      });
    }

    return {
      _type: "export",
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: "custom.api.parser",
      resources
    };
  };

  const onSubmit = async (data: FormInputs) => {
    setLoading(true);
    setError(null);
    setParsedData(null);
    setInsomniaCollection(null);

    try {
      let content: string;

      if (data.url) {
        // Fetch from URL
        const headers: Record<string, string> = {};
        if (data.authType === 'bearer' && data.authToken) {
          headers.Authorization = `Bearer ${data.authToken}`;
        } else if (data.authType === 'basic' && data.username && data.password) {
          headers.Authorization = `Basic ${btoa(`${data.username}:${data.password}`)}`;
        }

        const response = await fetch(data.url, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        content = await response.text();
      } else if (data.file?.[0]) {
        // Read file
        content = await data.file[0].text();
      } else {
        throw new Error('Please provide either a URL or a file');
      }

      // Parse the content
      const parsed = await parseContent(content, data.format);
      setParsedData(parsed);

      // Convert to Insomnia collection
      const collection = convertToInsomniaCollection(parsed);
      setInsomniaCollection(collection);

      toast.success('API metadata parsed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadInsomniaCollection = () => {
    if (!insomniaCollection) return;

    const blob = new Blob([JSON.stringify(insomniaCollection, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insomnia_collection.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Insomnia collection downloaded');
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CodeIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Custom API Parser</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  {...register('format')}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="auto">Auto Detect</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                  <option value="openapi">OpenAPI/Swagger</option>
                  <option value="raml">RAML</option>
                </select>
                {selectedFormat !== 'auto' && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-start space-x-2">
                    <InfoIcon size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      Example URL provided for {selectedFormat.toUpperCase()} format
                    </div>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Metadata URL
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow relative">
                    <LinkIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      {...register('url')}
                      placeholder="https://api.example.com/swagger.json"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Upload File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadIcon size={24} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          {...register('file')}
                          className="sr-only"
                          accept=".json,.yaml,.yml,.raml"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JSON, YAML, OpenAPI, or RAML files up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication
                </label>
                <select
                  {...register('authType')}
                  className="w-full rounded-md border border-gray-300 p-2 mb-2"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>

                {authType === 'bearer' && (
                  <input
                    type="text"
                    {...register('authToken')}
                    placeholder="Bearer Token"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                )}

                {authType === 'basic' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      {...register('username')}
                      placeholder="Username"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="Password"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <LoaderIcon size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CodeIcon size={18} />
                    <span>Parse API Metadata</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 rounded-md flex items-start space-x-2">
                <AlertCircleIcon size={18} className="text-red-600 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            {parsedData && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-700">Parsed Metadata</h2>
                  {insomniaCollection && (
                    <button
                      onClick={downloadInsomniaCollection}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <FileJsonIcon size={18} />
                      <span>Download Collection</span>
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <SyntaxHighlighter
                    language="json"
                    style={docco}
                    customStyle={{
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem'
                    }}
                  >
                    {JSON.stringify(parsedData, null, 2)}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {insomniaCollection && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Insomnia Collection</h2>
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <SyntaxHighlighter
                    language="json"
                    style={docco}
                    customStyle={{
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem'
                    }}
                  >
                    {JSON.stringify(insomniaCollection, null, 2)}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default CustomParserPage;