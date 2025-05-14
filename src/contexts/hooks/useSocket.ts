import { useContext } from 'react';
import { QueueContext } from '../QueueTypes';
import { useQueue } from './useQueue';

export const useSocket = () => {
  const queueContext = useQueue();
  // You'll need to expose the socket in your QueueContext
  return queueContext.socket;
};