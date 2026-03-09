import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            // Disconnect socket when user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Connect to Socket.IO server
        const newSocket = io(window.location.origin, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected');
            newSocket.emit('join', user._id);
        });

        // Listen for real-time notifications
        newSocket.on('notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            const iconMap = {
                like: '❤️',
                comment: '💬',
                subscribe: '🔔',
                upload: '🎬',
            };

            toast(notification.message, {
                icon: iconMap[notification.type] || '🔔',
                duration: 4000,
                style: {
                    background: '#1e1e2e',
                    color: '#f1f5f9',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                },
            });
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const markNotificationsRead = () => {
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{
            socket,
            notifications,
            unreadCount,
            setUnreadCount,
            markNotificationsRead,
            setNotifications,
        }}>
            {children}
        </SocketContext.Provider>
    );
}
