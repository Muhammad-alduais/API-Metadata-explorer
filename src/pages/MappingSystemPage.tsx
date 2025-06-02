import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import yaml from 'js-yaml';
import {
  BookOpenIcon,
  ArrowRightIcon,
  FileJsonIcon,
  PackageIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UploadIcon
} from 'lucide-react';
import { mappingConfigs, mapMetadata, validateMapping } from '../utils/metadataMapper';

SyntaxHighlighter.registerLanguage('json', json);

const MappingSystemPage: React.FC = () => {
  const [sourceMetadata, setSourceMetadata] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [mappedOutput, setMappedOutput] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setMappedOutput(null);
    setValidationErrors([]);

    // Set example data if available
    if (mappingConfigs[format]?.examples[0]) {
      setSourceMetadata(JSON.stringify(mappingConfigs[format].examples[0].source, null, 2));
    }
  };

  const handleSourceChange = (value: string) => {
    setSourceMetadata(value);
    setMappedOutput(null);
    setValidationErrors([]);
  };

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

  const convertMetadata = () => {
    if (!sourceMetadata || !selectedFormat) {
      toast.error('Please provide source metadata and select a format');
      return;
    }

    setIsConverting(true);
    setValidationErrors([]);

    try {
      let parsedSource;
      try {
        parsedSource = JSON.parse(sourceMetadata);
      } catch {
        // Try parsing as YAML if JSON fails
        parsedSource = yaml.load(sourceMetadata);
      }

      const mappingConfig = mappingConfigs[selectedFormat];
      const errors = validateMapping(parsedSource, mappingConfig);

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error('Validation errors found');
        return;
      }

      const result = mapMetadata(parsedSource, mappingConfig);
      setMappedOutput(result);
      toast.success('Metadata converted successfully');
    } catch (error) {
      toast.error('Error converting metadata: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConverting(false);
    }
  };

  const exportToInsomnia = () => {
    if (!mappedOutput) return;

    const insomniaExport = {
      _type: 'export',
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: 'metadata.mapper',
      resources: [
        {
          _id: `wrk_${Date.now()}`,
          _type: 'workspace',
          name: mappedOutput.info?.title || 'Mapped API',
          description: mappedOutput.info?.description || '',
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
          <h1 className="text-2xl font-bold text-gray-800">Metadata Mapping System</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Source Input */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Source Metadata</h2>

              {/* Format Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => handleFormatChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Select format...</option>
                  {Object.entries(mappingConfigs).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Metadata File
                </label>
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
                          accept=".json,.yaml,.yml,.raml"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JSON, YAML, or RAML files
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Content
                </label>
                <textarea
                  value={sourceMetadata}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full h-[400px] font-mono text-sm rounded-md border border-gray-300 p-2"
                  placeholder="Paste your metadata here..."
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Output and Controls */}
          <div className="space-y-6">
            {/* Conversion Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">OpenAPI Output</h2>
                <div className="space-x-2">
                  <button
                    onClick={convertMetadata}
                    disabled={isConverting || !sourceMetadata || !selectedFormat}
                    className={`px-4 py-2 rounded-md ${
                      isConverting || !sourceMetadata || !selectedFormat
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white flex items-center space-x-2`}
                  >
                    {isConverting ? (
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
                  {mappedOutput && (
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

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4">
                  <div className="bg-red-50 rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircleIcon size={20} className="text-red-600 mr-2" />
                      <h3 className="text-red-800 font-medium">Validation Errors</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-red-600 text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Mapped Output */}
              {mappedOutput ? (
                <SyntaxHighlighter
                  language="json"
                  style={docco}
                  customStyle={{
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem'
                  }}
                >
                  {JSON.stringify(mappedOutput, null, 2)}
                </SyntaxHighlighter>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Convert your metadata to see the OpenAPI specification
                </div>
              )}
            </div>

            {/* Format Description */}
            {selectedFormat && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">
                  {mappingConfigs[selectedFormat].name} Format
                </h3>
                <p className="text-sm text-blue-600">
                  {mappingConfigs[selectedFormat].description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MappingSystemPage;