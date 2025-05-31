import React from 'react';
import { DatabaseIcon } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-400 text-white py-8 shadow-lg transition-all duration-300 ease-in-out">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <DatabaseIcon size={28} className="animate-pulse" />
          <h1 className="text-3xl font-bold tracking-wide">
            API Metadata Explorer
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;