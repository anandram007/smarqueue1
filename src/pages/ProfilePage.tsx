import { useState } from 'react';
import { useAuth } from '../contexts/hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';

const ProfilePage = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically make an API call to update the user profile
        // For now, we'll just show a success notification
        addNotification('Profile updated successfully!', 'success');
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>

            <div className="bg-white shadow-md rounded-lg p-6">
                {!isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Username</h2>
                            <p className="text-lg">{user?.username}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Email</h2>
                            <p className="text-lg">{user?.email}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Role</h2>
                            <p className="text-lg capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-500">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-500">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfilePage; 