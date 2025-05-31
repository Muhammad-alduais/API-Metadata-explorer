import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileJsonIcon, ActivityIcon, HelpCircleIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJsonIcon size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-800">API Explorer</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 transition-colors ${
                location.pathname === '/' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FileJsonIcon size={18} />
              <span className="text-sm font-medium">Explorer</span>
            </Link>

            <Link
              to="/api-analyzer"
              className={`flex items-center space-x-1 transition-colors ${
                location.pathname === '/api-analyzer' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <ActivityIcon size={18} />
              <span className="text-sm font-medium">API Analyzer</span>
            </Link>
            
            <a
              href="#"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <HelpCircleIcon size={18} />
              <span className="text-sm font-medium">Help</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}