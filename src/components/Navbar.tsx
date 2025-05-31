import React from 'react';
import { BarChartIcon, FileJsonIcon, HelpCircleIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJsonIcon size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-800">Metadata API Tool</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <BarChartIcon size={18} />
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
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