import yaml from 'js-yaml';
import SwaggerParser from 'swagger-parser';
import { RAMLParser } from 'raml-1-parser';
import { OAS } from 'oas';

export interface ParsedEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: {
    query?: Parameter[];
    path?: Parameter[];
    header?: Parameter[];
    body?: any;
  };
  responses?: {
    [key: string]: {
      description?: string;
      schema?: any;
    };
  };
  authentication?: {
    type: string;
    required: boolean;
    location?: string;
  };
}

interface Parameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  type: string;
  format?: string;
  enum?: string[];
  default?: any;
}

export interface ParsedMetadata {
  title: string;
  version: string;
  baseUrl: string;
  description?: string;
  endpoints: ParsedEndpoint[];
  authentication?: {
    type: string;
    required: boolean;
    location?: string;
  };
}

export async function parseMetadata(input: string, format?: string): Promise<ParsedMetadata> {
  let data: any;

  try {
    // Try to determine format if not provided
    if (!format) {
      format = detectFormat(input);
    }

    // Parse based on format
    switch (format.toLowerCase()) {
      case 'json':
        data = JSON.parse(input);
        return parseJSON(data);
      
      case 'yaml':
      case 'yml':
        data = yaml.load(input);
        return parseYAML(data);
      
      case 'openapi':
      case 'swagger':
        const api = await SwaggerParser.parse(input);
        return parseOpenAPI(api);
      
      case 'raml':
        const ramlApi = await RAMLParser.load(input);
        return parseRAML(ramlApi);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Error parsing metadata:', error);
    throw error;
  }
}

function detectFormat(input: string): string {
  // Remove whitespace from the start
  const trimmed = input.trim();

  // Check for JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for YAML
  if (trimmed.startsWith('---') || trimmed.startsWith('swagger:') || trimmed.startsWith('openapi:')) {
    try {
      yaml.load(trimmed);
      return 'yaml';
    } catch {
      // Not valid YAML, continue checking
    }
  }

  // Check for RAML
  if (trimmed.startsWith('#%RAML')) {
    return 'raml';
  }

  // Check for OpenAPI/Swagger
  if (trimmed.includes('"swagger":') || trimmed.includes('"openapi":')) {
    return 'openapi';
  }

  throw new Error('Unable to detect metadata format');
}

async function parseJSON(data: any): Promise<ParsedMetadata> {
  // Check if it might be OpenAPI/Swagger in JSON format
  if (data.swagger || data.openapi) {
    return parseOpenAPI(data);
  }

  // Handle generic JSON structure
  return {
    title: data.title || data.name || 'API',
    version: data.version || '1.0.0',
    baseUrl: data.baseUrl || data.basePath || '',
    description: data.description,
    endpoints: extractEndpointsFromJSON(data),
    authentication: detectAuthentication(data)
  };
}

async function parseYAML(data: any): Promise<ParsedMetadata> {
  // Check if it might be OpenAPI/Swagger in YAML format
  if (data.swagger || data.openapi) {
    return parseOpenAPI(data);
  }

  // Handle generic YAML structure similar to JSON
  return await parseJSON(data);
}

async function parseOpenAPI(api: any): Promise<ParsedMetadata> {
  const oas = new OAS(api);
  
  const endpoints: ParsedEndpoint[] = [];
  
  // Process each path and method
  for (const [path, methods] of Object.entries(api.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (method === 'parameters' || method === '$ref') continue;

      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: operation.summary,
        description: operation.description,
        parameters: {
          query: operation.parameters?.filter(p => p.in === 'query'),
          path: operation.parameters?.filter(p => p.in === 'path'),
          header: operation.parameters?.filter(p => p.in === 'header'),
          body: operation.requestBody
        },
        responses: operation.responses,
        authentication: detectAuthenticationFromOperation(operation)
      });
    }
  }

  return {
    title: api.info?.title || 'API',
    version: api.info?.version || '1.0.0',
    baseUrl: api.servers?.[0]?.url || api.basePath || '',
    description: api.info?.description,
    endpoints,
    authentication: detectAuthentication(api)
  };
}

async function parseRAML(api: any): Promise<ParsedMetadata> {
  const endpoints: ParsedEndpoint[] = [];

  // Process RAML resources and methods
  function processResource(resource: any, parentPath: string = '') {
    const path = parentPath + (resource.relativeUri || '');

    // Process methods
    if (resource.methods) {
      for (const method of resource.methods) {
        endpoints.push({
          path,
          method: method.method.toUpperCase(),
          summary: method.displayName,
          description: method.description,
          parameters: {
            query: method.queryParameters,
            path: resource.uriParameters,
            header: method.headers,
            body: method.body
          },
          responses: method.responses,
          authentication: detectAuthenticationFromOperation(method)
        });
      }
    }

    // Process nested resources
    if (resource.resources) {
      for (const childResource of resource.resources) {
        processResource(childResource, path);
      }
    }
  }

  processResource(api);

  return {
    title: api.title || 'API',
    version: api.version || '1.0.0',
    baseUrl: api.baseUri || '',
    description: api.description,
    endpoints,
    authentication: detectAuthentication(api)
  };
}

function extractEndpointsFromJSON(data: any): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  // Handle common API description patterns
  if (data.paths) {
    // OpenAPI-like structure
    for (const [path, methods] of Object.entries(data.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (method === 'parameters' || method === '$ref') continue;
        
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
          description: operation.description,
          parameters: {
            query: operation.parameters?.filter(p => p.in === 'query'),
            path: operation.parameters?.filter(p => p.in === 'path'),
            header: operation.parameters?.filter(p => p.in === 'header'),
            body: operation.requestBody
          },
          responses: operation.responses
        });
      }
    }
  } else if (data.endpoints || data.resources) {
    // Generic endpoint list
    const endpointList = data.endpoints || data.resources;
    for (const endpoint of endpointList) {
      endpoints.push({
        path: endpoint.path || endpoint.url || '',
        method: endpoint.method || 'GET',
        summary: endpoint.summary || endpoint.name,
        description: endpoint.description,
        parameters: {
          query: endpoint.queryParameters,
          path: endpoint.pathParameters,
          header: endpoint.headers,
          body: endpoint.body
        },
        responses: endpoint.responses
      });
    }
  }

  return endpoints;
}

function detectAuthentication(api: any): { type: string; required: boolean; location?: string } {
  // Check security schemes in OpenAPI
  if (api.components?.securitySchemes || api.securityDefinitions) {
    const schemes = api.components?.securitySchemes || api.securityDefinitions;
    const firstScheme = Object.values(schemes)[0] as any;
    
    if (firstScheme) {
      return {
        type: firstScheme.type,
        required: Boolean(api.security?.length),
        location: firstScheme.in || 'header'
      };
    }
  }

  // Check RAML securitySchemes
  if (api.securitySchemes) {
    const firstScheme = Object.values(api.securitySchemes)[0] as any;
    return {
      type: firstScheme.type,
      required: true,
      location: firstScheme.describedBy?.headers ? 'header' : 'query'
    };
  }

  // Check for common auth-related properties
  if (api.auth || api.authentication) {
    const auth = api.auth || api.authentication;
    return {
      type: auth.type || 'apiKey',
      required: auth.required !== false,
      location: auth.location || 'header'
    };
  }

  return {
    type: 'none',
    required: false
  };
}

function detectAuthenticationFromOperation(operation: any): { type: string; required: boolean; location?: string } {
  if (operation.security || operation.securedBy) {
    const security = operation.security || operation.securedBy;
    return {
      type: Array.isArray(security) ? 'multiple' : security.type || 'apiKey',
      required: true,
      location: 'header'
    };
  }

  return {
    type: 'none',
    required: false
  };
}