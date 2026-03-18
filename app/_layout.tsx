import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { Colors } from '../constants/theme';
import { registerServiceWorker } from '../utils/registerSW';
import { initCrossTabSync, onSyncEvent } from '../utils/crossTabSync';

export default function RootLayout() {
  const loadData = useStore((s) => s.loadData);
  const cleanupOldData = useStore((s) => s.cleanupOldData);
  const refreshData = useStore((s) => s.refreshData);
  const addNotification = useStore((s) => s.addNotification);
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    loadData().then(() => cleanupOldData());
    registerServiceWorker();

    // Connect to the SSE stream from the sync server.
    // This receives real-time events from field agents across the network.
    const closeSSE = initCrossTabSync();
    const unsubEvents = onSyncEvent((evt) => {
      console.log('Received sync event:', evt);
      
      // Always refresh data when any event arrives
      refreshData();

      // If this is the admin, also create a notification for structured events
      const role = useStore.getState().currentUser?.role;
      if (role === 'admin' && evt.type !== 'data_changed') {
        console.log('Creating admin notification for event:', evt.type);
        useStore.getState().addNotification({
          type: evt.type as any,
          message: evt.message,
          agentName: evt.agentName,
          clientName: evt.clientName,
          visitId: evt.visitId,
        });
      }
    });

    return () => {
      closeSSE();
      unsubEvents();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="visit/new" options={{ title: 'New Visit', presentation: 'modal' }} />
        <Stack.Screen name="visit/[id]" options={{ title: 'Visit Details' }} />
        <Stack.Screen name="client/new" options={{ title: 'New Client', presentation: 'modal' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Client Details' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="export" options={{ title: 'Export Data', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
