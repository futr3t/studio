"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { formatISO } from 'date-fns';
import type {
  Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog,
  CleaningTask, CleaningChecklistItem, User, ActivityFeedItem, SystemParameters, TemperatureRange, DataContextType
} from '@/lib/types';
// Mock data imports are removed as data will be fetched from API
import { CheckCircle2, AlertTriangle, ClipboardList, Thermometer, Sparkles, Truck, Factory } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [cleaningChecklistItems, setCleaningChecklistItems] = useState<CleaningChecklistItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [systemParameters, setSystemParameters] = useState<SystemParameters>(initialSystemParameters);
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async <T,>(endpoint: string, setter: React.Dispatch<React.SetStateAction<T[]>>, entityName: string) => {
    try {
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${entityName}`);
      const data: T[] = await response.json();
      setter(data);
    } catch (error) {
      console.error(`Error loading ${entityName}:`, error);
      toast({ title: "Error", description: `Could not load ${entityName}.`, variant: "destructive" });
    }
  }, [toast]);

  const fetchSingleData = useCallback(async <T,>(endpoint: string, setter: React.Dispatch<React.SetStateAction<T>>, entityName: string, defaultValue: T) => {
    try {
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${entityName}`);
      const data: T = await response.json();
      setter(data);
    } catch (error) {
      console.error(`Error loading ${entityName}:`, error);
      toast({ title: "Error", description: `Could not load ${entityName}.`, variant: "destructive" });
      setter(defaultValue); // Set to default if fetch fails
    }
  }, [toast]);

  useEffect(() => {
    fetchData<Supplier>('suppliers', setSuppliers, 'suppliers');
    fetchData<Appliance>('appliances', setAppliances, 'appliances');
    fetchData<ProductionLog>('production-logs', setProductionLogs, 'production logs');
    fetchData<DeliveryLog>('delivery-logs', setDeliveryLogs, 'delivery logs');
    fetchData<TemperatureLog>('temperature-logs', setTemperatureLogs, 'temperature logs');
    fetchData<CleaningTask>('cleaning-tasks', setCleaningTasks, 'cleaning task definitions');
    fetchData<CleaningChecklistItem>('cleaning-checklist-items', setCleaningChecklistItems, 'cleaning checklist items');
    fetchData<User>('users', setUsers, 'users').then(() => {
        // Set initial user after users are fetched
        // This is a simplified way; a real app would have auth determining the user.
        fetch('/api/users')
          .then(res => res.json())
          .then((allUsers: User[]) => {
            const adminUser = allUsers.find(u => u.role === 'admin') || allUsers[0] || null;
            setCurrentUserInternal(adminUser);
          }).catch(() => setCurrentUserInternal(null));
    });
    fetchSingleData<SystemParameters>('system-parameters', setSystemParameters, 'system parameters', initialSystemParameters);
  }, [fetchData, fetchSingleData]);


  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
  };

  const updateSystemParameters = async (newParams: SystemParameters) => {
     try {
      const response = await fetch('/api/system-parameters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
  };

  const findUserById = useCallback((userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  }, [users]);

  const getApplianceEffectiveTempRange = useCallback((appliance: Appliance): TemperatureRange | null => {
    if (typeof appliance.minTemp === 'number' && typeof appliance.maxTemp === 'number') {
      return { min: appliance.minTemp, max: appliance.maxTemp };
    }
    const typeKey = appliance.type.toLowerCase().replace(/\s+/g, '');
    if (typeKey.includes('fridge')) return systemParameters.temperatureRanges.fridge;
    if (typeKey.includes('freezer')) return systemParameters.temperatureRanges.freezer;
    if (typeKey.includes('hothold') || typeKey.includes('bainmarie') || typeKey.includes('oven')) return systemParameters.temperatureRanges.hotHold;
    return null;
  }, [systemParameters.temperatureRanges]);

  // Generic CRUD operations
  const makeApiRequest = async <T, U>(
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: U,
    entityName?: string,
    successMessage?: string,
    id?: string,
  ): Promise<T | null> => {
    try {
      const response = await fetch(id ? `/api/${endpoint}/${id}` : `/api/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      if (endpoint.startsWith('suppliers')) fetchData<Supplier>('suppliers', setSuppliers, 'suppliers');
      else if (endpoint.startsWith('appliances')) fetchData<Appliance>('appliances', setAppliances, 'appliances');
      else if (endpoint.startsWith('production-logs')) fetchData<ProductionLog>('production-logs', setProductionLogs, 'production logs');
      else if (endpoint.startsWith('delivery-logs')) fetchData<DeliveryLog>('delivery-logs', setDeliveryLogs, 'delivery logs');
      else if (endpoint.startsWith('temperature-logs')) fetchData<TemperatureLog>('temperature-logs', setTemperatureLogs, 'temperature logs');
      else if (endpoint.startsWith('cleaning-tasks')) fetchData<CleaningTask>('cleaning-tasks', setCleaningTasks, 'cleaning task definitions');
      else if (endpoint.startsWith('cleaning-checklist-items')) fetchData<CleaningChecklistItem>('cleaning-checklist-items', setCleaningChecklistItems, 'cleaning checklist items');
      else if (endpoint.startsWith('users')) fetchData<User>('users', setUsers, 'users');
      
      return result;
    } catch (error) {
      console.error(`Error ${method.toLowerCase()}ing ${entityName || 'item'}:`, error);
      toast({ title: "Error", description: (error as Error).message || `Could not perform operation on ${entityName || 'item'}.`, variant: "destructive" });
      return null;
    }
  };


  // Supplier functions
  const addSupplier = (data: Omit<Supplier, 'id'>) => makeApiRequest<Supplier, Omit<Supplier, 'id'>>('POST', 'suppliers', data, 'Supplier', 'Added');
  const updateSupplier = (data: Supplier) => makeApiRequest<Supplier, Supplier>('PUT', 'suppliers', data, 'Supplier', 'Updated', data.id);
  const deleteSupplier = (id: string) => makeApiRequest<null, void>('DELETE', 'suppliers', undefined, 'Supplier', '', id);

  // Appliance functions
  const addAppliance = (data: Omit<Appliance, 'id'>) => makeApiRequest<Appliance, Omit<Appliance, 'id'>>('POST', 'appliances', data, 'Appliance', 'Added');
  const updateAppliance = (data: Appliance) => makeApiRequest<Appliance, Appliance>('PUT', 'appliances', data, 'Appliance', 'Updated', data.id);
  const deleteAppliance = (id: string) => makeApiRequest<null, void>('DELETE', 'appliances', undefined, 'Appliance', '', id);

  // Production Log functions
  const addProductionLog = (data: Omit<ProductionLog, 'id' | 'logTime'>) => makeApiRequest<ProductionLog, Omit<ProductionLog, 'id' | 'logTime'>>('POST', 'production-logs', data, 'Production Log', 'Added');
  const updateProductionLog = (data: ProductionLog) => makeApiRequest<ProductionLog, ProductionLog>('PUT', 'production-logs', data, 'Production Log', 'Updated', data.id);
  const deleteProductionLog = (id: string) => makeApiRequest<null, void>('DELETE', 'production-logs', undefined, 'Production Log', '', id);

  // Delivery Log functions
  const addDeliveryLog = (data: Omit<DeliveryLog, 'id' | 'deliveryTime'>) => makeApiRequest<DeliveryLog, Omit<DeliveryLog, 'id' | 'deliveryTime'>>('POST', 'delivery-logs', data, 'Delivery Log', 'Added');
  const updateDeliveryLog = (data: DeliveryLog) => makeApiRequest<DeliveryLog, DeliveryLog>('PUT', 'delivery-logs', data, 'Delivery Log', 'Updated', data.id);
  const deleteDeliveryLog = (id: string) => makeApiRequest<null, void>('DELETE', 'delivery-logs', undefined, 'Delivery Log', '', id);
  
  // Temperature Log functions (add/update need appliance for compliance check on API side for now)
  const addTemperatureLog = (data: Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'>, appliance: Appliance) => makeApiRequest<TemperatureLog, Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'> & {applianceId: string}>('POST', 'temperature-logs', {...data, applianceId: appliance.id}, 'Temperature Log', 'Added');
  const updateTemperatureLog = (data: Omit<TemperatureLog, 'isCompliant'>, appliance: Appliance) => makeApiRequest<TemperatureLog, Omit<TemperatureLog, 'isCompliant'> & {applianceId: string}>('PUT', 'temperature-logs', {...data, applianceId: appliance.id}, 'Temperature Log', 'Updated', data.id);
  const deleteTemperatureLog = (id: string) => makeApiRequest<null, void>('DELETE', 'temperature-logs', undefined, 'Temperature Log', '', id);

  // Cleaning Task Definition functions
  const addCleaningTaskDefinition = (data: Omit<CleaningTask, 'id'>) => makeApiRequest<CleaningTask, Omit<CleaningTask, 'id'>>('POST', 'cleaning-tasks', data, 'Cleaning Task Definition', 'Added');
  const updateCleaningTaskDefinition = (data: CleaningTask) => makeApiRequest<CleaningTask, CleaningTask>('PUT', 'cleaning-tasks', data, 'Cleaning Task Definition', 'Updated', data.id);
  const deleteCleaningTaskDefinition = (id: string) => makeApiRequest<null, void>('DELETE', 'cleaning-tasks', undefined, 'Cleaning Task Definition', '', id).then(() => {
    // Also remove related checklist items on the client if not handled by backend cascade (which it isn't for mock)
    setCleaningChecklistItems(prev => prev.filter(item => item.taskId !== id));
  });
  
  // Cleaning Checklist Item functions
  const updateCleaningChecklistItem = (data: CleaningChecklistItem) => makeApiRequest<CleaningChecklistItem, CleaningChecklistItem>('PUT', 'cleaning-checklist-items', data, 'Cleaning Checklist Item', 'Updated', data.id);
  
  // User functions
  const addUser = (data: Omit<User, 'id'>) => makeApiRequest<User, Omit<User, 'id'>>('POST', 'users', data, 'User', 'Added');
  const updateUser = (data: User) => makeApiRequest<User, User>('PUT', 'users', data, 'User', 'Updated', data.id);
  const deleteUser = (id: string) => makeApiRequest<null, void>('DELETE', 'users', undefined, 'User', '', id);

  const getRecentActivities = useCallback((limit: number = 5): ActivityFeedItem[] => {
    const activities: ActivityFeedItem[] = [];

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
            description: `Delivery: From ${supplier?.name || 'Unknown'} (${log.items.length} items)`,
            user: receiverUser?.name,
            statusIcon: log.isCompliant ? CheckCircle2 : AlertTriangle,
            itemIcon: Truck,
            isNonCompliant: !log.isCompliant
        });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [productionLogs, temperatureLogs, cleaningChecklistItems, deliveryLogs, appliances, users, suppliers, findUserById]);


  const value: DataContextType = {
    suppliers, appliances, productionLogs, deliveryLogs, temperatureLogs,
    cleaningTasks, cleaningChecklistItems, users, systemParameters,
    currentUser, setCurrentUser,
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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
