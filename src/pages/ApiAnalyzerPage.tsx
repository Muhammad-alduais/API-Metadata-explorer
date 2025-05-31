import React from 'react';
import { 
  ActivityIcon, 
  DatabaseIcon,
  FileJsonIcon,
  NetworkIcon,
  LayersIcon,
  ShieldIcon,
  ClockIcon,
  TagIcon,
  LinkIcon
} from 'lucide-react';
import ApiEndpointAnalyzer from '../components/ApiEndpointAnalyzer';

const ApiAnalyzerPage: React.FC = () => {
  const supportedApis = [
    {
      type: 'Statistical APIs',
      items: [
        { 
          name: 'Census Bureau API', 
          description: 'US Census Bureau data endpoints',
          example: 'https://api.census.gov/data/timeseries/intltrade/exports/hs'
        },
        { 
          name: 'BLS API', 
          description: 'Bureau of Labor Statistics data',
          example: 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
        },
        { 
          name: 'Eurostat API', 
          description: 'European statistical data',
          example: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp'
        },
        { 
          name: 'OECD.Stat API', 
          description: 'OECD statistical databases',
          example: 'https://stats.oecd.org/SDMX-JSON/data/SNA_TABLE1/AUS+AUT.B1_GE.VOBARSA.Q/all'
        }
      ]
    },
    {
      type: 'API Protocols',
      items: [
        { 
          name: 'REST APIs', 
          description: 'RESTful web services',
          example: 'https://api.github.com/users/octocat'
        },
        { 
          name: 'GraphQL', 
          description: 'Graph query language APIs',
          example: 'https://api.github.com/graphql'
        },
        { 
          name: 'SOAP', 
          description: 'Simple Object Access Protocol',
          example: 'http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso'
        },
        { 
          name: 'OData', 
          description: 'Open Data Protocol',
          example: 'https://services.odata.org/V4/Northwind/Northwind.svc/Categories'
        }
      ]
    },
    {
      type: 'Metadata Types',
      items: [
        { 
          name: 'Structural', 
          description: 'Data organization and schema',
          example: 'https://api.census.gov/data/2020/dec/pl/variables.json'
        },
        { 
          name: 'Descriptive', 
          description: 'Content description and context',
          example: 'https://api.census.gov/data/2020/dec/pl/groups.json'
        },
        { 
          name: 'Administrative', 
          description: 'Resource management data',
          example: 'https://api.census.gov/data/2020/dec/pl/geography.json'
        },
        { 
          name: 'Technical', 
          description: 'System and process details',
          example: 'https://api.census.gov/data/2020/dec/pl/examples.json'
        },
        { 
          name: 'Quality', 
          description: 'Data quality metrics',
          example: 'https://api.census.gov/data/2020/dec/pl/stats.json'
        },
        { 
          name: 'Spatial', 
          description: 'Geographic and spatial context',
          example: 'https://api.census.gov/data/2020/dec/pl/geo.json'
        },
        { 
          name: 'Process', 
          description: 'Data processing information',
          example: 'https://api.census.gov/data/2020/dec/pl/process.json'
        },
        { 
          name: 'Semantic', 
          description: 'Meaning and relationships',
          example: 'https://api.census.gov/data/2020/dec/pl/concepts.json'
        }
      ]
    }
  ];

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ActivityIcon size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">API Endpoint Analyzer</h1>
        </div>

        {/* Supported APIs and Features */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportedApis.map((category, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                {idx === 0 && <DatabaseIcon size={18} className="mr-2 text-blue-600" />}
                {idx === 1 && <NetworkIcon size={18} className="mr-2 text-blue-600" />}
                {idx === 2 && <LayersIcon size={18} className="mr-2 text-blue-600" />}
                {category.type}
              </h2>
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                    <div className="flex items-center space-x-2 text-sm">
                      <LinkIcon size={14} className="text-blue-600" />
                      <code 
                        className="text-blue-600 font-mono text-xs break-all cursor-pointer hover:text-blue-800"
                        onClick={() => navigator.clipboard.writeText(item.example)}
                        title="Click to copy"
                      >
                        {item.example}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Features */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Analysis Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <FileJsonIcon size={18} className="text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Schema Detection</div>
                <div className="text-sm text-gray-600">Automatic API structure analysis</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ShieldIcon size={18} className="text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Auth Detection</div>
                <div className="text-sm text-gray-600">Authentication method analysis</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ClockIcon size={18} className="text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Rate Limiting</div>
                <div className="text-sm text-gray-600">API usage limits detection</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TagIcon size={18} className="text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Metadata Extraction</div>
                <div className="text-sm text-gray-600">Comprehensive metadata analysis</div>
              </div>
            </div>
          </div>
        </div>

        {/* API Analyzer Component */}
        <ApiEndpointAnalyzer />
      </div>
    </main>
  );
};

export default ApiAnalyzerPage;