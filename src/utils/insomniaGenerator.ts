import { ParsedMetadata, ParsedEndpoint } from './metadataParser';

interface InsomniaResource {
  _id: string;
  _type: string;
  parentId?: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface InsomniaCollection {
  _type: string;
  __export_format: number;
  __export_date: string;
  __export_source: string;
  resources: InsomniaResource[];
}

export function generateInsomniaCollection(metadata: ParsedMetadata): InsomniaCollection {
  const workspaceId = `wrk_${Date.now()}`;
  const resources: InsomniaResource[] = [];

  // Add workspace
  resources.push({
    _id: workspaceId,
    _type: "workspace",
    name: metadata.title,
    description: metadata.description || `Generated from ${metadata.title} API metadata`,
    scope: "collection"
  });

  // Add environment
  const envId = `env_${workspaceId}`;
  resources.push({
    _id: envId,
    _type: "environment",
    parentId: workspaceId,
    name: "Base Environment",
    data: {
      base_url: metadata.baseUrl
    }
  });

  // Group endpoints by their first path segment
  const groups = groupEndpoints(metadata.endpoints);

  // Create folders and requests
  for (const [groupName, endpoints] of Object.entries(groups)) {
    const folderId = `fld_${Date.now()}_${groupName}`;
    
    // Add folder
    resources.push({
      _id: folderId,
      _type: "request_group",
      parentId: workspaceId,
      name: groupName
    });

    // Add requests for the group
    endpoints.forEach((endpoint, index) => {
      const requestId = `req_${Date.now()}_${index}`;
      resources.push(createRequest(requestId, folderId, endpoint, metadata));
    });
  }

  return {
    _type: "export",
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: "insomnia.metadata.generator:v1.0.0",
    resources
  };
}

function groupEndpoints(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  const groups: Record<string, ParsedEndpoint[]> = {};

  endpoints.forEach(endpoint => {
    const segments = endpoint.path.split('/').filter(Boolean);
    const groupName = segments[0] || 'root';
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(endpoint);
  });

  return groups;
}

function createRequest(
  id: string,
  parentId: string,
  endpoint: ParsedEndpoint,
  metadata: ParsedMetadata
): InsomniaResource {
  const request: InsomniaResource = {
    _id: id,
    _type: "request",
    parentId: parentId,
    name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
    description: endpoint.description || "",
    method: endpoint.method,
    url: `{{ base_url }}${endpoint.path}`,
    parameters: [],
    headers: [],
    authentication: {}
  };

  // Add query parameters
  if (endpoint.parameters?.query) {
    request.parameters = endpoint.parameters.query.map(param => ({
      name: param.name,
      value: param.default || "",
      description: param.description || "",
      disabled: !param.required
    }));
  }

  // Add headers
  if (endpoint.parameters?.header) {
    request.headers = endpoint.parameters.header.map(header => ({
      name: header.name,
      value: header.default || "",
      description: header.description || "",
      disabled: !header.required
    }));
  }

  // Add body if present
  if (endpoint.parameters?.body) {
    request.body = {
      mimeType: "application/json",
      text: JSON.stringify(endpoint.parameters.body, null, 2)
    };
  }

  // Configure authentication
  const auth = endpoint.authentication || metadata.authentication;
  if (auth && auth.type !== 'none') {
    request.authentication = {
      type: auth.type.toLowerCase(),
      disabled: false,
      prefix: auth.type === 'bearer' ? 'Bearer' : undefined,
      token: "{{ auth_token }}"
    };
  }

  return request;
}