import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link to="/about" className="text-sm text-gray-500 hover:text-blue-700">
              About
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-blue-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-blue-700">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-blue-700">
              Contact
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} HealthQueue. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;