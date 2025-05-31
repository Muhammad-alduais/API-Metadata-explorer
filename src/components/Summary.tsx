import React, { useState } from 'react';
import { 
  FileJsonIcon, 
  PackageIcon,
  BarChart2Icon,
  LoaderIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

interface SummaryProps {
  data: any;
  onExportJson: () => void;
  onExportInsomnia: () => void;
}

const Summary: React.FC<SummaryProps> = ({ data, onExportJson, onExportInsomnia }) => {
  const [exportingOpenAPI, setExportingOpenAPI] = useState(false);
  const [exportingInsomnia, setExportingInsomnia] = useState(false);

  if (!data || !data.dataset) return null;

  const totalOriginal = data.dataset.length;
  const endpointData = data.dataset.map((dataset: any) => {
    const endpointPath = dataset.c_dataset ? dataset.c_dataset.join('/') : '';
    return {
      title: dataset.title || 'Unnamed Endpoint',
      endpoint: `https://api.census.gov/data/${endpointPath}`,
      varCount: 0
    };
  });

  const totalSplit = Math.ceil(endpointData.reduce((sum: number, ep: any) => sum + (ep.varCount > 0 ? Math.ceil(ep.varCount / 10) : 2), 0));
  const totalVars = endpointData.reduce((sum: number, ep: any) => sum + ep.varCount, 0) || totalOriginal * 15;

  const handleOpenAPIExport = async () => {
    setExportingOpenAPI(true);
    try {
      // Convert data to OpenAPI format
      const openApiSpec = {
        openapi: "3.0.4",
        info: {
          title: "Census API Explorer",
          description: "Auto-generated OpenAPI 3.0.4 spec from Census API metadata.",
          version: "1.0.0"
        },
        servers: [
          { url: "https://api.census.gov/data" }
        ],
        paths: {},
        components: {
          schemas: {}
        }
      };

      // Process each dataset
      for (const dataset of data.dataset) {
        const endpointUrl = `https://api.census.gov/data/${dataset.c_dataset.join('/')}`;
        let parameters = [];
        let schemaProps = {};
        let varList = [];

        try {
          const varsUrl = `${endpointUrl}/variables.json`;
          const resp = await fetch(varsUrl);
          const varsData = await resp.json();

          varList = varsData.variables ? Object.keys(varsData.variables) : [];

          for (const [varName, varData] of Object.entries(varsData.variables || {})) {
            parameters.push({
              name: varName,
              in: "query",
              description: varData.label || varData.description || "",
              required: varData.required === "true" || varData.value === "predicate-only",
              schema: {
                type: varData.type || "string"
              }
            });
            schemaProps[varName] = {
              type: varData.type || "string",
              description: varData.label || varData.description || ""
            };
          }
        } catch {
          varList = [];
        }

        // Build endpoint with all variables in get=
        const filteredVars = (varList || []).filter(v => v !== "time");
        const getVars = filteredVars.length ? `?get=${filteredVars.join(',')}` : '';
        const formattedEndpoint = `${endpointUrl}${getVars}`;

        // Split into multiple URLs (max 10 vars each)
        const splitUrls = splitCensusApiRequest(formattedEndpoint, 10);
        splitUrls.forEach((splitUrl, idx) => {
          const path = splitUrl.replace('https://api.census.gov/data', '');
          openApiSpec.paths[path] = {
            get: {
              tags: [dataset.title],
              summary: `${dataset.title} (Part ${idx + 1})`,
              description: dataset.description || "",
              operationId: dataset.c_dataset.join("_") + `_part${idx + 1}`,
              parameters,
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: schemaProps
                      }
                    }
                  }
                }
              }
            }
          };
        });
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openapi_census.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('OpenAPI specification exported successfully');
    } catch (error) {
      toast.error('Failed to export OpenAPI specification');
      console.error('Export error:', error);
    } finally {
      setExportingOpenAPI(false);
    }
  };

  const handleInsomniaExport = async () => {
    setExportingInsomnia(true);
    try {
      // Generate unique IDs for workspace and environment
      const workspaceId = "wrk_bulk_census_api";
      const envId = "env_wrk_bulk_census_api";
      
      // Initialize resources array with workspace
      const resources = [
        {
          "_id": workspaceId,
          "_type": "workspace",
          "name": "Bulk Census API",
          "description": "Generated from Census API endpoint list."
        }
      ];

      // Build environment variables
      const envData: Record<string, any> = {
        base_url: "http://api.census.gov"
      };

      // Process each dataset
      for (const dataset of data.dataset) {
        const endpointName = dataset.c_dataset[dataset.c_dataset.length - 1];
        const envKey = endpointName.replace(/[^a-zA-Z0-9]/g, '') + "_example";
        
        try {
          const varsUrl = `https://api.census.gov/data/${dataset.c_dataset.join('/')}/variables.json`;
          const resp = await fetch(varsUrl);
          const varsData = await resp.json();
          const exampleObj = {};
          for (const varName of Object.keys(varsData.variables || {})) {
            exampleObj[varName] = "";
          }
          envData[envKey] = exampleObj;
        } catch {
          envData[envKey] = {};
        }
      }

      // Add environment to resources
      resources.push({
        "_id": envId,
        "_type": "environment",
        "parentId": workspaceId,
        "name": "Base Environment",
        "data": envData
      });

      // Add requests for each endpoint type
      for (const dataset of data.dataset) {
        const endpointName = dataset.c_dataset[dataset.c_dataset.length - 1];
        const envKey = endpointName.replace(/[^a-zA-Z0-9]/g, '') + "_example";
        const reqId = "req_" + envKey;
        const endpointBase = `/data/${dataset.c_dataset.join('/')}`;
        
        let varList = [];
        let parameters = [];
        let varsData = null;
        
        try {
          const varsUrl = `https://api.census.gov/data/${dataset.c_dataset.join('/')}/variables.json`;
          const resp = await fetch(varsUrl);
          varsData = await resp.json();
          varList = Object.keys(varsData.variables || {});
          parameters = varList.map(varName => {
            const varMeta = varsData.variables[varName] || {};
            const isRequired = varMeta.required === "true" || varMeta.required === "predicate-only";
            return {
              name: varName,
              value: varName === "time" ? "2013-01" : "",
              disabled: !isRequired
            };
          });
        } catch {
          // Continue with empty lists if fetch fails
        }

        // 1. Original Endpoint
        const filteredVars = varList.filter(v => v !== "time");
        const getVars = filteredVars.length ? `?get=${filteredVars.join(',')}` : '';
        const urlPath = endpointBase + getVars;

        resources.push({
          "_id": reqId + "_original",
          "_type": "request",
          "parentId": workspaceId,
          "name": `${dataset.title} (Original)`,
          "method": "GET",
          "url": `{{ base_url }}/data/${dataset.c_dataset.join('/')}${getVars}`,
          "parameters": parameters,
          "folder": dataset.title
        });

        // 2. Split Endpoints
        const splitUrls = splitCensusApiRequest(`https://api.census.gov${urlPath}`, 10);
        splitUrls.forEach((splitUrl, idx) => {
          resources.push({
            "_id": reqId + `_split_${idx}`,
            "_type": "request",
            "parentId": workspaceId,
            "name": `${dataset.title} (Split ${idx + 1})`,
            "method": "GET",
            "url": splitUrl.replace("https://api.census.gov", "{{ base_url }}"),
            "parameters": parameters,
            "folder": `${dataset.title} - Split`
          });
        });

        // 3. Custom Endpoint (with variable selection)
        if (varsData && varsData.variables) {
          const customParameters = Object.entries(varsData.variables).map(([varName, varData]: [string, any]) => ({
            name: varName,
            value: "",
            disabled: true, // All variables start as disabled (unchecked)
            description: varData.label || varData.description || ""
          }));

          resources.push({
            "_id": reqId + "_custom",
            "_type": "request",
            "parentId": workspaceId,
            "name": `${dataset.title} (Custom)`,
            "method": "GET",
            "url": `{{ base_url }}/data/${dataset.c_dataset.join('/')}`,
            "parameters": customParameters,
            "folder": `${dataset.title} - Custom`
          });
        }
      }

      // Create final export object
      const insomniaExport = {
        "_type": "export",
        "__export_format": 4,
        "__export_date": new Date().toISOString(),
        "__export_source": "insomnia.script.generator:v1",
        "resources": resources
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(insomniaExport, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'insomnia_census_collection.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Insomnia collection exported successfully');
    } catch (error) {
      toast.error('Failed to export Insomnia collection');
      console.error('Export error:', error);
    } finally {
      setExportingInsomnia(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100 my-6 overflow-hidden">
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-60 rounded-lg shadow-sm">
          <div className="p-2 bg-blue-100 rounded-full">
            <FileJsonIcon size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Original Endpoints</div>
            <div className="font-bold text-lg text-gray-800">
              {totalOriginal} <span className="text-sm font-normal text-gray-500">with ~{totalVars} variables</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-60 rounded-lg shadow-sm">
          <div className="p-2 bg-cyan-100 rounded-full">
            <BarChart2Icon size={20} className="text-cyan-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Split Endpoints</div>
            <div className="font-bold text-lg text-gray-800">
              {totalSplit} <span className="text-sm font-normal text-gray-500">with ~{Math.round(totalVars / totalSplit)} vars/endpoint</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end items-center space-x-3 p-3 md:col-span-1">
          <button 
            onClick={handleOpenAPIExport}
            disabled={exportingOpenAPI}
            className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${
              exportingOpenAPI ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {exportingOpenAPI ? (
              <>
                <LoaderIcon size={16} className="mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileJsonIcon size={16} className="mr-1.5" />
                Export OpenAPI
              </>
            )}
          </button>
          
          <button 
            onClick={handleInsomniaExport}
            disabled={exportingInsomnia}
            className={`px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center ${
              exportingInsomnia ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {exportingInsomnia ? (
              <>
                <LoaderIcon size={16} className="mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <PackageIcon size={16} className="mr-1.5" />
                Export Insomnia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to split Census API requests
function splitCensusApiRequest(url: string, maxVars: number = 10): string[] {
  const match = url.match(/^(.*\?get=)([^&]+)(.*)$/i);
  if (!match) return [url];

  const base = match[1];
  const vars = match[2].split(',').map(v => v.trim()).filter(Boolean);
  const rest = match[3] || '';

  const result: string[] = [];
  for (let i = 0; i < vars.length; i += maxVars) {
    const chunk = vars.slice(i, i + maxVars);
    result.push(`${base}${chunk.join(',')}${rest}`);
  }
  
  return result.length > 0 ? result : [url];
}

export default Summary;