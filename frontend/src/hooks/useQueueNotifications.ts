import { useEffect, useState, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "../stores/authStore";

export interface QueueUpdateEvent {
  eventType: string;
  tokenId?: number;
  doctorId?: number;
  status?: string;
  timestamp: string;
}

export interface UseQueueNotificationsOptions {
  onQueueUpdated: () => void | Promise<void>;
  enabled?: boolean;
  fallbackPollingIntervalMs?: number;
  debounceMs?: number;
  hubUrl?: string;
  doctorId?: number;
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
 * Supports clinic-wide queue channel ("JoinClinicQueueChannel") and doctor-specific queue channels
 * ("JoinDoctorQueueChannel") with server-side authorization validation.
 */
export function useQueueNotifications({
  onQueueUpdated,
  enabled = true,
  fallbackPollingIntervalMs = 20000,
  debounceMs = 300,
  hubUrl,
  doctorId,
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

  const subscribeToChannels = useCallback(async (connection: signalR.HubConnection) => {
    try {
      if (doctorId && doctorId > 0) {
        await connection.invoke("JoinDoctorQueueChannel", doctorId);
      } else {
        await connection.invoke("JoinClinicQueueChannel");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join authorized queue channel";
      setConnectionError(errorMsg);
    }
  }, [doctorId]);

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
      // Re-subscribe to channel and trigger immediate authoritative refresh
      subscribeToChannels(connection).catch(() => {});
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
      .then(async () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setConnectionError(null);
        await subscribeToChannels(connection);
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
  }, [enabled, hubUrl, subscribeToChannels, triggerDebouncedRefresh]);

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
