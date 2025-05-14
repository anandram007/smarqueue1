import { useContext } from 'react';
import { QueueContext, QueueContextType } from '../QueueTypes';

export function useQueue(): QueueContextType {
    const context = useContext(QueueContext);
    if (context === undefined) {
        throw new Error('useQueue must be used within a QueueProvider');
    }
    return context;
}