import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { useQueue } from '../../contexts/QueueContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/hooks/useAuth';

interface ServiceType {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  icon: React.ReactNode;
}

interface Department {
  id: string;
  name: string;
}

const GenerateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generateTicket, isConnected } = useQueue();
  const { addNotification } = useNotification();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch departments from the server
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/departments');
        if (!response.ok) {
          throw new Error(`Failed to fetch departments: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched departments:', data); // Add logging
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        addNotification('Failed to load departments. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [addNotification]);

  // Mock data for service types
  const serviceTypes: ServiceType[] = [
    {
      id: 'claims',
      name: 'Claims Processing',
      description: 'Submit or follow up on an insurance claim',
      estimatedTime: 15,
      icon: <ClipboardList className="h-6 w-6 text-blue-700" />
    },
    {
      id: 'enrollment',
      name: 'Enrollment & Eligibility',
      description: 'Verify coverage, enroll in a plan, or update information',
      estimatedTime: 20,
      icon: <ClipboardList className="h-6 w-6 text-blue-700" />
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      description: 'Discuss bills, make payments, or set up payment plans',
      estimatedTime: 10,
      icon: <Clock className="h-6 w-6 text-blue-700" />
    },
    {
      id: 'benefits',
      name: 'Benefits Explanation',
      description: 'Get detailed information about your coverage and benefits',
      estimatedTime: 25,
      icon: <ClipboardList className="h-6 w-6 text-blue-700" />
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleDepartmentSelect = (departmentId: string) => {
    setSelectedDepartment(departmentId);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedService) {
      setStep(2);
    } else if (step === 2 && selectedDepartment) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only process submission if we're on the final step
    if (step !== 3) {
      return;
    }

    // Check connection status
    if (!isConnected) {
      addNotification('Cannot generate ticket: Not connected to server. Please try again.', 'error');
      return;
    }

    // Add validation to prevent submission without required fields
    if (!selectedService || !selectedDepartment || !priority) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Find the selected service and department names
    const service = serviceTypes.find(s => s.id === selectedService);
    const department = departments.find(d => d.id === selectedDepartment);

    if (!service || !department) {
      setIsSubmitting(false);
      addNotification('Invalid service or department selection', 'error');
      return;
    }

    try {
      // Create ticket data with all required fields
      const ticketData = {
        // Only include userId if user is logged in
        ...(user?.id ? { userId: user.id } : {}),
        customerName: user?.username || 'Guest User',
        departmentId: selectedDepartment,
        department: department.name,
        serviceId: selectedService,
        serviceName: service.name,
        priority: priority || 'normal',
        additionalInfo: additionalInfo || '',
        estimatedWaitTime: service.estimatedTime,
        status: 'waiting' as const
      };

      // Log the exact data being sent
      console.log('User:', user);
      console.log('Selected Department:', selectedDepartment);
      console.log('Department Object:', department);
      console.log('Service Object:', service);
      console.log('Full ticket data:', JSON.stringify(ticketData, null, 2));

      // Generate ticket with shorter timeout
      const newTicket = await generateTicket(ticketData);

      if (!newTicket) {
        throw new Error('No ticket data received from server');
      }

      console.log('Ticket generated successfully:', newTicket);

      // Store ticket and update UI immediately
      localStorage.setItem('activeTicket', JSON.stringify(newTicket));
      setIsSuccess(true);

      // Navigate immediately
      navigate('/customer/queue-status');
    } catch (error) {
      console.error('Error generating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification(`Failed to generate ticket: ${errorMessage}. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDepartments = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      );
    }

    if (departments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No departments available
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`border p-4 rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedDepartment === dept.id
              ? 'border-blue-700 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
              }`}
            onClick={() => handleDepartmentSelect(dept.id)}
          >
            <span className="font-medium text-gray-900">{dept.name}</span>
            <ChevronRight size={18} className="text-gray-500" />
          </div>
        ))}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Generated Successfully</h2>
        <p className="text-gray-600 mb-6">
          Your ticket has been generated and added to the queue. You will be redirected to the queue status page.
        </p>
        <div className="animate-pulse">
          <div className="h-2 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Ticket</h1>
        <p className="mt-1 text-gray-600">Create a queue ticket for your insurance needs.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 1 ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Select Service</span>
            </div>
            <div className="flex-grow mx-4 h-0.5 bg-gray-200"></div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Department</span>
            </div>
            <div className="flex-grow mx-4 h-0.5 bg-gray-200"></div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 3 ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Details</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Service Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceTypes.map((service) => (
                  <div
                    key={service.id}
                    className={`border p-4 rounded-lg cursor-pointer transition-all ${selectedService === service.id
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                      }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 p-2 bg-blue-100 rounded-md">
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Clock size={16} className="mr-1" />
                          <span>~{service.estimatedTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Department */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Department</h2>
              {renderDepartments()}
            </div>
          )}

          {/* Step 3: Additional Details */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value="low"
                      checked={priority === 'low'}
                      onChange={() => setPriority('low')}
                      className="h-4 w-4 text-blue-700"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">Low</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value="normal"
                      checked={priority === 'normal'}
                      onChange={() => setPriority('normal')}
                      className="h-4 w-4 text-blue-700"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">Normal</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value="high"
                      checked={priority === 'high'}
                      onChange={() => setPriority('high')}
                      className="h-4 w-4 text-blue-700"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">High</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide any additional details about your visit..."
                ></textarea>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextStep();
                }}
                disabled={!selectedService && step === 1 || !selectedDepartment && step === 2}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md 
                  ${(!selectedService && step === 1) || (!selectedDepartment && step === 2)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                  }
                `}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !selectedService || !selectedDepartment || !priority}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800
                  ${(isSubmitting || !selectedService || !selectedDepartment || !priority) ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {isSubmitting ? 'Generating...' : 'Generate Ticket'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateTicketPage;