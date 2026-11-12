import { useEffect, useState, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "../stores/authStore";

export interface QueueUpdateEvent {
  eventType: string;
  tokenId?: number;
  status?: string;
  timestamp: string;
}

export interface UseQueueNotificationsOptions {
  onQueueUpdated: () => void | Promise<void>;
  enabled?: boolean;
  fallbackPollingIntervalMs?: number;
  debounceMs?: number;
  hubUrl?: string;
}

export interface UseQueueNotificationsResult {
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  refreshNow: () => void;
}

const resolveNotificationsHubUrl = (customUrl?: string): string => {
  if (customUrl) return customUrl;
  const configuredApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) as string | undefined;
  if (!configuredApiUrl) {
    return "/hubs/notifications";
  }
  const cleanBase = configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  return `${cleanBase}/hubs/notifications`;
};

/**
 * useQueueNotifications
 *
 * Subscribes to real-time Clinic Edition outpatient queue and token updates via SignalR.
 * Implements authoritative refetch notifications, automatic reconnection, debounced request
 * storm protection, and automatic fallback polling when disconnected.
 */
export function useQueueNotifications({
  onQueueUpdated,
  enabled = true,
  fallbackPollingIntervalMs = 20000,
  debounceMs = 300,
  hubUrl,
}: UseQueueNotificationsOptions): UseQueueNotificationsResult {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onQueueUpdatedRef = useRef(onQueueUpdated);

  useEffect(() => {
    onQueueUpdatedRef.current = onQueueUpdated;
  }, [onQueueUpdated]);

  const triggerDebouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onQueueUpdatedRef.current();
    }, debounceMs);
  }, [debounceMs]);

  const refreshNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onQueueUpdatedRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    const targetUrl = resolveNotificationsHubUrl(hubUrl);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(targetUrl, {
        accessTokenFactory: () => useAuthStore.getState().token || "",
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connectionRef.current = connection;

    connection.on("QueueUpdated", (_event: QueueUpdateEvent) => {
      triggerDebouncedRefresh();
    });

    connection.onreconnecting((err) => {
      setIsConnected(false);
      setIsReconnecting(true);
      if (err) {
        setConnectionError(err.message || "Reconnecting to queue notifications...");
      }
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      // Re-join channel and trigger immediate authoritative refresh
      connection
        .invoke("JoinQueueChannel", "ClinicQueue")
        .catch(() => {});
      triggerDebouncedRefresh();
    });

    connection.onclose((err) => {
      setIsConnected(false);
      setIsReconnecting(false);
      if (err) {
        setConnectionError(err.message || "Disconnected from queue notification hub");
      }
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        setIsReconnecting(false);
        setConnectionError(null);
        return connection.invoke("JoinQueueChannel", "ClinicQueue");
      })
      .catch((err) => {
        setIsConnected(false);
        setIsReconnecting(false);
        setConnectionError(err?.message || "Failed to connect to SignalR hub");
      });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      connection.off("QueueUpdated");
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [enabled, hubUrl, triggerDebouncedRefresh]);

  // Fallback polling: runs when not connected or when connection is severed
  useEffect(() => {
    if (!enabled) return;

    if (!isConnected) {
      pollingTimerRef.current = setInterval(() => {
        onQueueUpdatedRef.current();
      }, fallbackPollingIntervalMs);
    } else if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [enabled, isConnected, fallbackPollingIntervalMs]);

  return {
    isConnected,
    isReconnecting,
    connectionError,
    refreshNow,
  };
}

