import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationPanel: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-4 right-4 z-50">
            {notifications.map((notification, index) => (
                <div
                    key={`${notification.id}-${index}`}
                    className={`mb-2 p-4 rounded-lg shadow-lg max-w-sm ${notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                        } text-white`}
                >
                    <div className="flex justify-between items-center">
                        <p>{notification.message}</p>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="ml-4 text-white hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationPanel;