import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
  fileUrl: string;  // Add URL to access the file
}

const DocumentUploadPage: React.FC = () => {
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([]);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);

  // Simulate fetching uploaded documents from backend
  useEffect(() => {
    // In a real application, you would fetch documents from your backend
    // This is just a simulation for demonstration purposes
    const fetchDocuments = async () => {
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'insurance_policy.pdf',
          type: 'application/pdf',
          size: '1.2 MB',
          uploadDate: new Date().toISOString(),
          status: 'verified',
          fileUrl: ''
        },
        {
          id: '2',
          name: 'medical_report.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '0.8 MB',
          uploadDate: new Date().toISOString(),
          status: 'pending',
          fileUrl: ''
        }
      ];

      setUploadedDocuments(mockDocuments);
    };

    fetchDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addNotification('Please select files to upload', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Create URLs for the uploaded files
      const newDocuments: Document[] = selectedFiles.map((file, index) => ({
        id: Date.now() + index.toString(),
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString(),
        status: 'pending',
        fileUrl: URL.createObjectURL(file)  // Create a URL for the file
      }));

      setUploadedDocuments(prev => [...prev, ...newDocuments]);
      addNotification('Documents uploaded successfully!', 'success');
      setSelectedFiles([]);
    } catch {
      addNotification('Failed to upload documents. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = (documentId: string) => {
    setViewingDocument(documentId);

    // Find the document to view
    const docToView = uploadedDocuments.find(doc => doc.id === documentId);

    if (!docToView) {
      addNotification('Document not found', 'error');
      return;
    }

    // For image files, display them in a modal
    if (docToView.type.startsWith('image/') ||
      docToView.name.endsWith('.jpg') ||
      docToView.name.endsWith('.jpeg') ||
      docToView.name.endsWith('.png')) {

      // Create a modal or dialog to display the image
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '20px';
      closeBtn.style.right = '20px';
      closeBtn.style.fontSize = '30px';
      closeBtn.style.color = 'white';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => document.body.removeChild(modal);

      // Create image element
      const img = document.createElement('img');
      img.style.maxWidth = '90%';
      img.style.maxHeight = '90%';
      img.style.objectFit = 'contain';
      img.src = docToView.fileUrl;  // Use the stored file URL

      modal.appendChild(closeBtn);
      modal.appendChild(img);
      document.body.appendChild(modal);
    }
    // For PDF files
    else if (docToView.type === 'application/pdf' || docToView.name.endsWith('.pdf')) {
      // Open PDF in a new tab
      window.open(docToView.fileUrl, '_blank');
    }
    // For other document types
    else {
      // For other document types, try to open them in a new tab
      window.open(docToView.fileUrl, '_blank');
    }
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      uploadedDocuments.forEach(doc => {
        if (doc.fileUrl) {
          URL.revokeObjectURL(doc.fileUrl);
        }
      });
    };
  }, [uploadedDocuments]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Document Upload</h1>

        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              Select Files
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Selected Files</h2>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isUploading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className={`px-6 py-2 rounded-md text-white ${isUploading || selectedFiles.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </div>

      {/* Uploaded Documents Section */}
      {uploadedDocuments.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Your Documents</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadPage;