import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const useNotification = () => useContext(NotificationContext);
