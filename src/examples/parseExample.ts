import { parseMetadata } from '../utils/metadataParser';
import { generateInsomniaCollection } from '../utils/insomniaGenerator';
import fs from 'node:fs/promises';

// Example OpenAPI/Swagger metadata
const apiMetadata = {
  "openapi": "3.0.0",
  "info": {
    "title": "Pet Store API",
    "version": "1.0.0",
    "description": "A sample API for managing pets"
  },
  "servers": [
    {
      "url": "https://api.petstore.example.com/v1"
    }
  ],
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "description": "Maximum number of pets to return",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32",
              "default": 10
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A list of pets",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Pet"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a pet",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Pet"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Pet created successfully"
          }
        }
      }
    },
    "/pets/{petId}": {
      "get": {
        "summary": "Get pet by ID",
        "parameters": [
          {
            "name": "petId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Pet found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pet"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Pet": {
        "type": "object",
        "required": ["name", "type"],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["dog", "cat", "bird"]
          },
          "age": {
            "type": "integer",
            "minimum": 0
          }
        }
      }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ]
};

async function main() {
  try {
    // Parse the API metadata
    const metadata = await parseMetadata(JSON.stringify(apiMetadata));
    console.log('Parsed Metadata:', JSON.stringify(metadata, null, 2));

    // Generate Insomnia collection
    const collection = generateInsomniaCollection(metadata);
    console.log('Generated Collection:', JSON.stringify(collection, null, 2));

    // Save the collection to a file
    await fs.writeFile(
      'petstore_collection.json',
      JSON.stringify(collection, null, 2)
    );
    console.log('Collection saved to petstore_collection.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();