import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, UserCheck, Clock, BarChart2 } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:w-2/3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Modern Queue Management for Health Insurance
            </h1>
            <p className="mt-4 text-xl text-blue-100">
              Streamline your experience with our smart queue system. Less waiting, more efficiency.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-800 bg-white hover:bg-blue-50 transition duration-150"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-800 hover:bg-opacity-20 transition duration-150"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Smart Features for a Better Experience
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our queue management system is designed to improve efficiency, reduce waiting times, and enhance customer satisfaction.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-blue-500 transition-all duration-300">
                <div className="h-12 w-12 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <ClipboardList size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Smart Ticket Generation</h3>
                <p className="mt-2 text-gray-600">
                  Generate digital tickets based on service type, priority, and customer needs.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-blue-500 transition-all duration-300">
                <div className="h-12 w-12 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <UserCheck size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Priority Queueing</h3>
                <p className="mt-2 text-gray-600">
                  VIP customers, emergencies, and elderly clients get prioritized service automatically.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-blue-500 transition-all duration-300">
                <div className="h-12 w-12 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Real-time Updates</h3>
                <p className="mt-2 text-gray-600">
                  Receive live notifications about your queue position and estimated waiting time.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-blue-500 transition-all duration-300">
                <div className="h-12 w-12 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <BarChart2 size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                <p className="mt-2 text-gray-600">
                  Comprehensive insights into queue performance, waiting times, and customer feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our system is designed to be simple and intuitive for both customers and staff.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-medium text-gray-900">Register & Create Ticket</h3>
                <p className="mt-2 text-gray-600">
                  Sign up, specify your insurance needs, and generate a digital queue ticket.
                </p>
              </div>

              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-medium text-gray-900">Track Your Position</h3>
                <p className="mt-2 text-gray-600">
                  Monitor your place in the queue in real-time and receive notifications as your turn approaches.
                </p>
              </div>

              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-medium text-gray-900">Get Served & Provide Feedback</h3>
                <p className="mt-2 text-gray-600">
                  Receive service from the appropriate department and share your experience afterward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:flex lg:items-center lg:justify-between">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              <span className="block">Ready to streamline your insurance experience?</span>
              <span className="block text-blue-200">Get started with HealthQueue today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-800 bg-white hover:bg-blue-50"
                >
                  Get Started
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;