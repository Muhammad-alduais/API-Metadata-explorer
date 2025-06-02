import jp from 'jsonpath';

export interface MappingRule {
  source: string;
  target: string;
  transform?: (value: any) => any;
}

export interface MappingConfig {
  name: string;
  description: string;
  rules: MappingRule[];
  examples: {
    source: any;
    expected: any;
  }[];
}

// Common mapping configurations for different metadata formats
export const mappingConfigs: Record<string, MappingConfig> = {
  // RAML to OpenAPI mapping
  raml: {
    name: 'RAML',
    description: 'Maps RAML metadata to OpenAPI format',
    rules: [
      { source: '$.title', target: 'info.title' },
      { source: '$.version', target: 'info.version' },
      { source: '$.baseUri', target: 'servers[0].url' },
      { 
        source: '$.documentation[*].content', 
        target: 'info.description',
        transform: (docs) => docs.join('\n\n')
      },
      { 
        source: '$.resources[*]', 
        target: 'paths',
        transform: (resources) => {
          return resources.reduce((acc: any, res: any) => {
            acc[res.relativeUri] = {
              [res.methods[0].method.toLowerCase()]: {
                summary: res.displayName,
                description: res.description,
                parameters: res.uriParameters
              }
            };
            return acc;
          }, {});
        }
      }
    ],
    examples: [{
      source: {
        title: 'Example API',
        version: 'v1',
        baseUri: 'https://api.example.com',
        documentation: [
          { content: 'API Documentation' }
        ],
        resources: [
          {
            relativeUri: '/users',
            methods: [{ method: 'GET' }],
            displayName: 'Get Users',
            description: 'List all users'
          }
        ]
      },
      expected: {
        openapi: '3.0.3',
        info: {
          title: 'Example API',
          version: 'v1',
          description: 'API Documentation'
        },
        servers: [
          { url: 'https://api.example.com' }
        ],
        paths: {
          '/users': {
            get: {
              summary: 'Get Users',
              description: 'List all users'
            }
          }
        }
      }
    }]
  },

  // API Blueprint to OpenAPI mapping
  apiBlueprint: {
    name: 'API Blueprint',
    description: 'Maps API Blueprint metadata to OpenAPI format',
    rules: [
      { source: '$.metadata.title', target: 'info.title' },
      { source: '$.metadata.version', target: 'info.version' },
      { source: '$.metadata.description', target: 'info.description' },
      { 
        source: '$.metadata.host', 
        target: 'servers[0].url',
        transform: (host) => `https://${host}`
      },
      { 
        source: '$.resourceGroups[*].resources[*]', 
        target: 'paths',
        transform: (resources) => {
          return resources.reduce((acc: any, res: any) => {
            acc[res.uriTemplate] = {
              [res.actions[0].method.toLowerCase()]: {
                summary: res.name,
                description: res.description,
                parameters: res.parameters
              }
            };
            return acc;
          }, {});
        }
      }
    ],
    examples: [{
      source: {
        metadata: {
          title: 'Example API',
          version: '1.0',
          description: 'API Description',
          host: 'api.example.com'
        },
        resourceGroups: [{
          resources: [{
            uriTemplate: '/users',
            name: 'Users',
            description: 'User operations',
            actions: [{ method: 'GET' }]
          }]
        }]
      },
      expected: {
        openapi: '3.0.3',
        info: {
          title: 'Example API',
          version: '1.0',
          description: 'API Description'
        },
        servers: [
          { url: 'https://api.example.com' }
        ],
        paths: {
          '/users': {
            get: {
              summary: 'Users',
              description: 'User operations'
            }
          }
        }
      }
    }]
  },

  // Custom JSON to OpenAPI mapping
  customJson: {
    name: 'Custom JSON',
    description: 'Maps custom JSON metadata to OpenAPI format',
    rules: [
      { source: '$.api.name', target: 'info.title' },
      { source: '$.api.version', target: 'info.version' },
      { source: '$.api.description', target: 'info.description' },
      { 
        source: '$.api.endpoints[*]', 
        target: 'paths',
        transform: (endpoints) => {
          return endpoints.reduce((acc: any, endpoint: any) => {
            acc[endpoint.path] = {
              [endpoint.method.toLowerCase()]: {
                summary: endpoint.summary,
                description: endpoint.description,
                parameters: endpoint.params
              }
            };
            return acc;
          }, {});
        }
      }
    ],
    examples: [{
      source: {
        api: {
          name: 'Custom API',
          version: '1.0.0',
          description: 'Custom API Description',
          endpoints: [{
            path: '/data',
            method: 'GET',
            summary: 'Get Data',
            description: 'Retrieve data'
          }]
        }
      },
      expected: {
        openapi: '3.0.3',
        info: {
          title: 'Custom API',
          version: '1.0.0',
          description: 'Custom API Description'
        },
        paths: {
          '/data': {
            get: {
              summary: 'Get Data',
              description: 'Retrieve data'
            }
          }
        }
      }
    }]
  }
};

export function mapMetadata(sourceMetadata: any, mappingConfig: MappingConfig): any {
  const result = {
    openapi: '3.0.3',
    info: {},
    servers: [],
    paths: {}
  };

  for (const rule of mappingConfig.rules) {
    try {
      // Extract value using JSONPath
      const value = jp.query(sourceMetadata, rule.source);
      
      // Transform if needed
      const transformedValue = rule.transform ? rule.transform(value) : value[0];
      
      // Set the value in the target path
      if (transformedValue !== undefined) {
        const targetPath = rule.target.split('.');
        let current = result;
        
        for (let i = 0; i < targetPath.length - 1; i++) {
          const part = targetPath[i];
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part];
        }
        
        current[targetPath[targetPath.length - 1]] = transformedValue;
      }
    } catch (error) {
      console.warn(`Error applying mapping rule ${rule.source} -> ${rule.target}:`, error);
    }
  }

  return result;
}

export function validateMapping(sourceMetadata: any, mappingConfig: MappingConfig): string[] {
  const errors: string[] = [];

  // Validate required OpenAPI fields
  const requiredFields = ['info.title', 'info.version'];
  
  for (const field of requiredFields) {
    const rules = mappingConfig.rules.filter(r => r.target === field);
    if (rules.length === 0) {
      errors.push(`Missing mapping rule for required field: ${field}`);
      continue;
    }

    for (const rule of rules) {
      try {
        const value = jp.query(sourceMetadata, rule.source);
        if (!value || value.length === 0) {
          errors.push(`Required field ${field} not found in source data (${rule.source})`);
        }
      } catch (error) {
        errors.push(`Invalid JSONPath expression: ${rule.source}`);
      }
    }
  }

  return errors;
}