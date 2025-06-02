import React, { useState, useEffect } from 'react';
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
  UploadIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  XIcon,
  EditIcon
} from 'lucide-react';
import { mappingConfigs, mapMetadata, validateMapping } from '../utils/metadataMapper';

SyntaxHighlighter.registerLanguage('json', json);

const MappingSystemPage: React.FC = () => {
  const [sourceMetadata, setSourceMetadata] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [mappedOutput, setMappedOutput] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editMode, setEditMode] = useState<'text' | 'form'>('text');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setMappedOutput(null);
    setValidationErrors([]);
    setFormData({});

    // Set example data if available
    if (mappingConfigs[format]?.template) {
      setSourceMetadata(mappingConfigs[format].template);
      try {
        const parsed = yaml.load(mappingConfigs[format].template);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse template:', e);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSourceMetadata(content);
      try {
        const parsed = yaml.load(content);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse uploaded file:', e);
      }
    };
    reader.readAsText(file);
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = field.split('.');
      let current = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      
      // Update source metadata
      try {
        setSourceMetadata(JSON.stringify(newData, null, 2));
      } catch (e) {
        console.error('Failed to stringify form data:', e);
      }
      
      return newData;
    });
  };

  const renderFormFields = () => {
    if (!selectedFormat || !mappingConfigs[selectedFormat]?.fields) {
      return null;
    }

    return (
      <div className="space-y-4">
        {mappingConfigs[selectedFormat].fields.map((field, index) => (
          <div key={index} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'string' && (
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => updateFormField(field.name, e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder={field.description}
              />
            )}
            {field.type === 'array' && (
              <div className="space-y-2">
                {(formData[field.name] || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newArray = [...(formData[field.name] || [])];
                        newArray[i] = e.target.value;
                        updateFormField(field.name, newArray);
                      }}
                      className="flex-grow rounded-md border border-gray-300 p-2"
                    />
                    <button
                      onClick={() => {
                        const newArray = (formData[field.name] || []).filter((_: any, index: number) => index !== i);
                        updateFormField(field.name, newArray);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newArray = [...(formData[field.name] || []), ''];
                    updateFormField(field.name, newArray);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <PlusIcon size={14} />
                  <span>Add Item</span>
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">{field.description}</p>
          </div>
        ))}
      </div>
    );
  };

  const convertMetadata = () => {
    if (!sourceMetadata) {
      toast.error('Please provide source metadata');
      return;
    }

    setIsConverting(true);
    setValidationErrors([]);

    try {
      let parsedSource;
      try {
        parsedSource = JSON.parse(sourceMetadata);
      } catch {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BookOpenIcon size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Metadata Mapping System</h1>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
          >
            <HelpCircleIcon size={20} />
            <span>Help</span>
          </button>
        </div>

        {showHelp && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">Quick Guide</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Choose your metadata format from the dropdown</li>
              <li>Upload your metadata file or paste it in the text area</li>
              <li>Use the form fields for easier editing</li>
              <li>Click "Convert" to transform it to OpenAPI format</li>
              <li>Review the converted output</li>
              <li>Export to Insomnia if needed</li>
            </ol>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Source Input */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Source Metadata</h2>

              {/* Format Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What format is your metadata in?
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

              {/* Edit Mode Toggle */}
              {selectedFormat && (
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditMode('text')}
                      className={`px-4 py-2 rounded-md ${
                        editMode === 'text'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Text Mode
                    </button>
                    <button
                      onClick={() => setEditMode('form')}
                      className={`px-4 py-2 rounded-md ${
                        editMode === 'form'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Form Mode
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Upload */}
              <div className="mb-4">
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-300 transition-colors cursor-pointer">
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

              {/* Source Content */}
              {editMode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste your metadata here
                  </label>
                  <textarea
                    value={sourceMetadata}
                    onChange={(e) => setSourceMetadata(e.target.value)}
                    className="w-full h-[400px] font-mono text-sm rounded-md border border-gray-300 p-2"
                    placeholder="Paste your metadata here (JSON or YAML format)..."
                  />
                </div>
              ) : (
                renderFormFields()
              )}

              {/* Advanced Options Toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                >
                  {showAdvanced ? (
                    <ChevronUpIcon size={20} />
                  ) : (
                    <ChevronDownIcon size={20} />
                  )}
                  <span>Advanced Options</span>
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Advanced Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Strict mode</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Preserve additional properties</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Auto-generate examples</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Output and Controls */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">OpenAPI Output</h2>
                <div className="space-x-2">
                  <button
                    onClick={convertMetadata}
                    disabled={isConverting || !sourceMetadata}
                    className={`px-4 py-2 rounded-md ${
                      isConverting || !sourceMetadata
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
                      <h3 className="text-red-800 font-medium">Please fix these issues:</h3>
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