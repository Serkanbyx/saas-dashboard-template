import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';

export const SocketContext = createContext(null);

const getSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;

  if (socketUrl) {
    return socketUrl;
  }

  if (apiUrl?.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }

  return apiUrl || undefined;
};

const getOrgId = (org) => org?._id || org?.id;

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const { activeOrg, refreshOrgs } = useOrg();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const previousOrgIdRef = useRef(null);
  const activeOrgId = getOrgId(activeOrg);
  const hasActiveOrg = Boolean(activeOrgId);

  useEffect(() => {
    if (!token || !hasActiveOrg) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const socketClient = io(getSocketUrl(), {
      auth: { token },
    });

    setSocket(socketClient);

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socketClient.on('connect', handleConnect);
    socketClient.on('disconnect', handleDisconnect);

    return () => {
      if (previousOrgIdRef.current) {
        socketClient.emit('leave:org', previousOrgIdRef.current);
      }

      previousOrgIdRef.current = null;
      socketClient.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [hasActiveOrg, token]);

  useEffect(() => {
    if (!socket || !activeOrgId) {
      return;
    }

    const nextOrgId = activeOrgId;
    const previousOrgId = previousOrgIdRef.current;

    if (previousOrgId && previousOrgId !== nextOrgId) {
      socket.emit('leave:org', previousOrgId);
    }

    if (nextOrgId && previousOrgId !== nextOrgId) {
      socket.emit('join:org', nextOrgId);
    }

    previousOrgIdRef.current = nextOrgId;
  }, [activeOrgId, socket]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleMembershipUpdated = () => {
      refreshOrgs?.().catch(() => undefined);
    };

    socket.on('membership:updated', handleMembershipUpdated);

    return () => {
      socket.off('membership:updated', handleMembershipUpdated);
    };
  }, [refreshOrgs, socket]);

  const value = useMemo(
    () => ({
      socket,
      connected,
    }),
    [connected, socket],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
