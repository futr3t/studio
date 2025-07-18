"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { formatISO } from 'date-fns';
import type {
  Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog,
  CleaningTask, CleaningChecklistItem, User, ActivityFeedItem, SystemParameters, TemperatureRange, DataContextType
} from '@/lib/types';
import { CheckCircle2, AlertTriangle, ClipboardList, Thermometer, Sparkles, Truck, Factory } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';

const initialSystemParameters: SystemParameters = { // Default fallback
  temperatureRanges: {
    fridge: { min: 0, max: 5 },
    freezer: { min: -25, max: -18 },
    hotHold: { min: 63, max: 75 },
  },
  notifications: { emailAlerts: true, smsAlerts: false },
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser, session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [cleaningChecklistItems, setCleaningChecklistItems] = useState<CleaningChecklistItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [systemParameters, setSystemParameters] = useState<SystemParameters>(initialSystemParameters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    // Only fetch data if user is authenticated
    if (!authUser) {
      setLoading(false);
      return;
    }
    
    // Additional safety check for session
    if (!session) {
      console.warn('No session available, skipping data fetch');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const endpoints = [
        'suppliers', 'appliances', 'production-logs', 'delivery-logs',
        'temperature-logs', 'cleaning-tasks', 'cleaning-checklist-items'
      ];
      if (authUser && authUser.user_metadata?.role === 'admin') {
        endpoints.push('users');
      }
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const responses = await Promise.all(endpoints.map(e => fetch(`/api/${e}`, { headers })));
      const data = await Promise.all(responses.map(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ${res.url}`);
        }
        return res.json();
      }
      ));
      
      // Create a mapping of endpoint to data to avoid index issues
      const dataMap = endpoints.reduce((acc, endpoint, index) => {
        acc[endpoint] = data[index];
        return acc;
      }, {} as Record<string, any>);
      
      setSuppliers(dataMap['suppliers'] || []);
      setAppliances(dataMap['appliances'] || []);
      setProductionLogs(dataMap['production-logs'] || []);
      setDeliveryLogs(dataMap['delivery-logs'] || []);
      setTemperatureLogs(dataMap['temperature-logs'] || []);
      setCleaningTasks(dataMap['cleaning-tasks'] || []);
      setCleaningChecklistItems(dataMap['cleaning-checklist-items'] || []);
      
      // Handle users data - only set if we fetched it
      if (authUser && authUser.user_metadata?.role === 'admin' && dataMap['users']) {
        setUsers(dataMap['users']);
      } else {
        setUsers([]);
      }

      // Fetch system parameters separately with error handling
      try {
        const systemParamsResponse = await fetch('/api/system-parameters', { headers });
        if (systemParamsResponse.ok) {
          const systemParamsData = await systemParamsResponse.json();
          setSystemParameters(systemParamsData);
        } else {
          console.warn('System parameters not available, using defaults');
        }
      } catch (error) {
        console.warn('Failed to fetch system parameters, using defaults:', error);
      }
    } catch (error: any) {
      setError(error.message);
      toast({ title: "Error", description: "Could not load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authUser, session, toast]);

  useEffect(() => {
    // Only fetch data when user is authenticated (not null or undefined)
    if (authUser) {
      fetchData();
    }
  }, [authUser, fetchData]);

  const updateSystemParameters = useCallback(async (newParams: SystemParameters) => {
     try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/system-parameters', {
        method: 'PUT',
        headers,
        body: JSON.stringify(newParams),
      });
      if (!response.ok) throw new Error('Failed to update system parameters');
      const updatedParams = await response.json();
      setSystemParameters(updatedParams);
      toast({ title: "System Parameters Updated", description: "Settings have been saved.", className: "bg-accent text-accent-foreground" });
    } catch (error) {
      console.error("Error updating system parameters:", error);
      toast({ title: "Error", description: "Could not update system parameters.", variant: "destructive" });
    }
  }, [session, toast]);

  const findUserById = useCallback((userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  }, [users]);

  const getApplianceEffectiveTempRange = useCallback((appliance: Appliance): TemperatureRange | null => {
    if (typeof appliance.minTemp === 'number' && typeof appliance.maxTemp === 'number') {
      return { min: appliance.minTemp, max: appliance.maxTemp };
    }
    const typeKey = (appliance.type || '').toLowerCase().replace(/\s+/g, '');
    if (typeKey.includes('fridge')) return systemParameters.temperatureRanges.fridge;
    if (typeKey.includes('freezer')) return systemParameters.temperatureRanges.freezer;
    if (typeKey.includes('hothold') || typeKey.includes('bainmarie') || typeKey.includes('oven')) return systemParameters.temperatureRanges.hotHold;
    return null;
  }, [systemParameters.temperatureRanges]);

  // Generic CRUD operations
  const makeApiRequest = useCallback(async <T, U>(
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: U,
    entityName?: string,
    successMessage?: string,
    id?: string,
  ): Promise<T | null> => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(id ? `/api/${endpoint}/${id}` : `/api/${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        let errorMessage = `Failed to ${method.toLowerCase()} ${entityName || 'item'}`;
        let errorData: any = null;
        const contentType = response.headers.get('Content-Type');
        const contentLength = response.headers.get('Content-Length');
        // Only try to parse JSON if content-type is JSON and there is content
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonErr) {
            // JSON parsing failed, keep fallback error message
          }
        } else if (contentLength && parseInt(contentLength) > 0) {
          // Try to get text if not JSON but has content
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textErr) {
            // fallback
          }
        }
        throw new Error(errorMessage);
      }
      const result = method !== 'DELETE' ? await response.json() : null;
      if (successMessage && entityName) {
        toast({ title: `${entityName} ${successMessage}`, className: "bg-accent text-accent-foreground" });
      } else if (method === 'DELETE' && entityName) {
         toast({ title: `${entityName} Deleted`, variant: "destructive" });
      }
      // Re-fetch relevant data
      fetchData();
      
      return result;
    } catch (error) {
      console.error(`Error ${method.toLowerCase()}ing ${entityName || 'item'}:`, error);
      toast({ title: "Error", description: (error as Error).message || `Could not perform operation on ${entityName || 'item'}.`, variant: "destructive" });
      return null;
    }
  }, [session, toast, fetchData]);


  // Supplier functions
  const addSupplier = useCallback((data: Omit<Supplier, 'id'>) => makeApiRequest<Supplier, Omit<Supplier, 'id'>>('POST', 'suppliers', data, 'Supplier', 'Added'), [makeApiRequest]);
  const updateSupplier = useCallback((data: Supplier) => makeApiRequest<Supplier, Supplier>('PUT', 'suppliers', data, 'Supplier', 'Updated', data.id), [makeApiRequest]);
  const deleteSupplier = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'suppliers', undefined, 'Supplier', '', id), [makeApiRequest]);

  // Appliance functions
  const addAppliance = useCallback((data: Omit<Appliance, 'id'>) => makeApiRequest<Appliance, Omit<Appliance, 'id'>>('POST', 'appliances', data, 'Appliance', 'Added'), [makeApiRequest]);
  const updateAppliance = useCallback((data: Appliance) => makeApiRequest<Appliance, Appliance>('PUT', 'appliances', data, 'Appliance', 'Updated', data.id), [makeApiRequest]);
  const deleteAppliance = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'appliances', undefined, 'Appliance', '', id), [makeApiRequest]);

  // Production Log functions
  const addProductionLog = useCallback((data: Omit<ProductionLog, 'id' | 'logTime'>) => makeApiRequest<ProductionLog, Omit<ProductionLog, 'id' | 'logTime'>>('POST', 'production-logs', data, 'Production Log', 'Added'), [makeApiRequest]);
  const updateProductionLog = useCallback((data: ProductionLog) => makeApiRequest<ProductionLog, ProductionLog>('PUT', 'production-logs', data, 'Production Log', 'Updated', data.id), [makeApiRequest]);
  const deleteProductionLog = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'production-logs', undefined, 'Production Log', '', id), [makeApiRequest]);

  // Delivery Log functions
  const addDeliveryLog = useCallback((data: Omit<DeliveryLog, 'id' | 'deliveryTime'>) => makeApiRequest<DeliveryLog, Omit<DeliveryLog, 'id' | 'deliveryTime'>>('POST', 'delivery-logs', data, 'Delivery Log', 'Added'), [makeApiRequest]);
  const updateDeliveryLog = useCallback((data: DeliveryLog) => makeApiRequest<DeliveryLog, DeliveryLog>('PUT', 'delivery-logs', data, 'Delivery Log', 'Updated', data.id), [makeApiRequest]);
  const deleteDeliveryLog = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'delivery-logs', undefined, 'Delivery Log', '', id), [makeApiRequest]);
  
  // Temperature Log functions (add/update need appliance for compliance check on API side for now)
  const addTemperatureLog = useCallback((data: Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'>, appliance: Appliance) => makeApiRequest<TemperatureLog, Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'> & {applianceId: string}>('POST', 'temperature-logs', {...data, applianceId: appliance.id}, 'Temperature Log', 'Added'), [makeApiRequest]);
  const updateTemperatureLog = useCallback((data: Omit<TemperatureLog, 'isCompliant'>, appliance: Appliance) => makeApiRequest<TemperatureLog, Omit<TemperatureLog, 'isCompliant'> & {applianceId: string}>('PUT', 'temperature-logs', {...data, applianceId: appliance.id}, 'Temperature Log', 'Updated', data.id), [makeApiRequest]);
  const deleteTemperatureLog = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'temperature-logs', undefined, 'Temperature Log', '', id), [makeApiRequest]);

  // Cleaning Task Definition functions
  const addCleaningTaskDefinition = useCallback((data: Omit<CleaningTask, 'id'>) => makeApiRequest<CleaningTask, Omit<CleaningTask, 'id'>>('POST', 'cleaning-tasks', data, 'Cleaning Task Definition', 'Added'), [makeApiRequest]);
  const updateCleaningTaskDefinition = useCallback((data: CleaningTask) => makeApiRequest<CleaningTask, CleaningTask>('PUT', 'cleaning-tasks', data, 'Cleaning Task Definition', 'Updated', data.id), [makeApiRequest]);
  const deleteCleaningTaskDefinition = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'cleaning-tasks', undefined, 'Cleaning Task Definition', '', id).then(() => {
    // Also remove related checklist items on the client if not handled by backend cascade (which it isn't for mock)
    setCleaningChecklistItems(prev => (prev || []).filter(item => item.taskId !== id));
    fetchData();
  }), [makeApiRequest, fetchData]);
  
  // Cleaning Checklist Item functions
  const updateCleaningChecklistItem = useCallback((data: CleaningChecklistItem) => makeApiRequest<CleaningChecklistItem, CleaningChecklistItem>('PUT', 'cleaning-checklist-items', data, 'Cleaning Checklist Item', 'Updated', data.id), [makeApiRequest]);
  
  // User functions
  const addUser = useCallback((data: Omit<User, 'id'>) => makeApiRequest<User, Omit<User, 'id'>>('POST', 'users', data, 'User', 'Added'), [makeApiRequest]);
  const updateUser = useCallback((data: User) => makeApiRequest<User, User>('PUT', 'users', data, 'User', 'Updated', data.id), [makeApiRequest]);
  const deleteUser = useCallback((id: string) => makeApiRequest<null, void>('DELETE', 'users', undefined, 'User', '', id), [makeApiRequest]);

  const getRecentActivities = useCallback((limit: number = 5): ActivityFeedItem[] => {
    const activities: ActivityFeedItem[] = [];

    // Ensure arrays exist before using forEach
    if (!productionLogs || !temperatureLogs || !deliveryLogs || !cleaningChecklistItems || !appliances) {
      return [];
    }

    productionLogs.forEach(log => {
      const verifier = log.verifiedBy ? findUserById(log.verifiedBy) : null;
      activities.push({
        id: `prod-${log.id}`,
        logType: 'production',
        timestamp: log.logTime,
        description: `Production: ${log.productName} (Batch #${log.batchCode})`,
        user: verifier?.name,
        statusIcon: log.isCompliant ? CheckCircle2 : AlertTriangle,
        itemIcon: Factory,
        isNonCompliant: !log.isCompliant
      });
    });

    temperatureLogs.forEach(log => {
      const appliance = appliances.find(a => a.id === log.applianceId);
      const logger = log.loggedBy ? findUserById(log.loggedBy) : null;
      activities.push({
        id: `temp-${log.id}`,
        logType: 'temperature',
        timestamp: log.logTime,
        description: `Temperature: ${appliance?.name || 'Unknown'} (${log.temperature}°C)`,
        user: logger?.name,
        statusIcon: log.isCompliant ? CheckCircle2 : AlertTriangle,
        itemIcon: Thermometer,
        isNonCompliant: !log.isCompliant
      });
    });

    cleaningChecklistItems.filter(task => task.completed && task.completedAt).forEach(task => {
      const completingUser = task.completedBy ? findUserById(task.completedBy) : null;
      activities.push({
        id: `clean-${task.id}`,
        logType: 'cleaning',
        timestamp: task.completedAt!,
        description: `Cleaning: ${task.name} completed`,
        user: completingUser?.name,
        statusIcon: CheckCircle2,
        itemIcon: Sparkles,
      });
    });
    
    deliveryLogs.forEach(log => {
        const supplier = suppliers.find(s => s.id === log.supplierId);
        const receiverUser = log.receivedBy ? findUserById(log.receivedBy) : null; 
        activities.push({
            id: `del-${log.id}`,
            logType: 'delivery',
            timestamp: log.deliveryTime,
            description: `Delivery: From ${supplier?.name || 'Unknown'} (${log.items?.length || 0} items)`,
            user: receiverUser?.name,
            statusIcon: log.isCompliant ? CheckCircle2 : AlertTriangle,
            itemIcon: Truck,
            isNonCompliant: !log.isCompliant
        });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [productionLogs, temperatureLogs, cleaningChecklistItems, deliveryLogs, appliances, suppliers, findUserById]);


  const value: DataContextType = useMemo(() => ({
    suppliers, appliances, productionLogs, deliveryLogs, temperatureLogs,
    cleaningTasks, cleaningChecklistItems, users, systemParameters,
    loading, error,
    getRecentActivities, updateSystemParameters,
    addSupplier, updateSupplier, deleteSupplier,
    addAppliance, updateAppliance, deleteAppliance,
    addProductionLog, updateProductionLog, deleteProductionLog,
    addDeliveryLog, updateDeliveryLog, deleteDeliveryLog,
    addTemperatureLog, updateTemperatureLog, deleteTemperatureLog,
    addCleaningTaskDefinition, updateCleaningTaskDefinition, deleteCleaningTaskDefinition,
    updateCleaningChecklistItem,
    addUser, updateUser, deleteUser,
    findUserById, getApplianceEffectiveTempRange
  }), [
    suppliers, appliances, productionLogs, deliveryLogs, temperatureLogs, 
    cleaningTasks, cleaningChecklistItems, users, systemParameters, loading, error, 
    getRecentActivities, updateSystemParameters,
    addSupplier, updateSupplier, deleteSupplier,
    addAppliance, updateAppliance, deleteAppliance,
    addProductionLog, updateProductionLog, deleteProductionLog,
    addDeliveryLog, updateDeliveryLog, deleteDeliveryLog,
    addTemperatureLog, updateTemperatureLog, deleteTemperatureLog,
    addCleaningTaskDefinition, updateCleaningTaskDefinition, deleteCleaningTaskDefinition,
    updateCleaningChecklistItem,
    addUser, updateUser, deleteUser,
    findUserById, getApplianceEffectiveTempRange
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
