import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileJsonIcon, DatabaseIcon, HelpCircleIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJsonIcon size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-800">Metadata API Tool</span>
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
              to="/metadata"
              className={`flex items-center space-x-1 transition-colors ${
                location.pathname === '/metadata' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <DatabaseIcon size={18} />
              <span className="text-sm font-medium">Metadata</span>
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
};

export default Navbar;