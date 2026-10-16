import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export interface EmergencyAlert {
  caseNumber: string;
  triageLevel: string;
  patientName: string;
  timestamp: string;
}

export interface VitalSignUpdate {
  patientId: number;
  heartRate: number;
  spO2: number;
  bloodPressure: string;
  bodyTemp: number;
  timestamp: string;
}

export function useSignalR(hubUrl: string = '/hubs/hospital') {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestAlert, setLatestAlert] = useState<EmergencyAlert | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalSignUpdate | null>(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [hubUrl]);

  useEffect(() => {
    if (!connection) return;

    connection
      .start()
      .then(() => {
        setIsConnected(true);

        connection.on('ReceiveEmergencyAlert', (alert: EmergencyAlert) => {
          setLatestAlert(alert);
        });

        connection.on('ReceiveVitalSignUpdate', (vitals: VitalSignUpdate) => {
          setLatestVitals(vitals);
        });
      })
      .catch((err: Error) => console.error('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, [connection]);

  return { isConnected, latestAlert, latestVitals, connection };
}
