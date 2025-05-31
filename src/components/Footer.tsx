import React from 'react';
import { GithubIcon, HeartIcon } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 mt-12 rounded-t-xl">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-3 md:mb-0">
            <p className="text-sm md:text-base">
              &copy; {currentYear} MetaData API Explorer
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="text-white hover:text-blue-100 transition-colors flex items-center gap-1"
            >
              <HeartIcon size={16} className="text-red-300" />
              <span className="text-sm">Support</span>
            </a>
            
            <a 
              href="#" 
              className="text-white hover:text-blue-100 transition-colors flex items-center gap-1"
            >
              <GithubIcon size={16} />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;