
"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { formatISO } from 'date-fns';
import type {
  Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog,
  CleaningTask, CleaningChecklistItem, User, ActivityFeedItem, SystemParameters, TemperatureRange, DataContextType
} from '@/lib/types';
import {
  mockSuppliersData, mockAppliancesData, mockProductionLogsData,
  mockDeliveryLogsData, mockTemperatureLogsData, mockCleaningTasksData,
  mockCleaningChecklistItemsData, mockUsersData, STATIC_NOW
} from '@/lib/data';
import { CheckCircle2, AlertTriangle, ClipboardList, Thermometer, Sparkles, Truck, Factory } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const initialSystemParameters: SystemParameters = {
  temperatureRanges: {
    fridge: { min: 0, max: 5 },
    freezer: { min: -25, max: -18 },
    hotHold: { min: 63, max: 75 },
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
  },
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliersData);
  const [appliances, setAppliances] = useState<Appliance[]>(mockAppliancesData);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(mockProductionLogsData);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>(mockDeliveryLogsData);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>(mockTemperatureLogsData);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(mockCleaningTasksData);
  const [cleaningChecklistItems, setCleaningChecklistItems] = useState<CleaningChecklistItem[]>(mockCleaningChecklistItemsData);
  const [users, setUsers] = useState<User[]>(mockUsersData);
  const [systemParameters, setSystemParameters] = useState<SystemParameters>(initialSystemParameters);
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set a default current user (e.g., the first admin user)
    // In a real app, this would come from an authentication service
    const initialUser = mockUsersData.find(u => u.role === 'admin') || mockUsersData[0] || null;
    setCurrentUserInternal(initialUser);
  }, []);


  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
  };

  const updateSystemParameters = (newParams: SystemParameters) => {
    setSystemParameters(newParams);
    toast({ title: "System Parameters Updated", description: "Settings have been saved.", className: "bg-accent text-accent-foreground" });
  };
  
  const findUserById = useCallback((userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  }, [users]);

  const getApplianceEffectiveTempRange = useCallback((appliance: Appliance): TemperatureRange | null => {
    if (typeof appliance.minTemp === 'number' && typeof appliance.maxTemp === 'number') {
      return { min: appliance.minTemp, max: appliance.maxTemp };
    }
    const typeKey = appliance.type.toLowerCase().replace(/\s+/g, ''); 
    
    if (typeKey.includes('fridge')) {
      return systemParameters.temperatureRanges.fridge;
    } else if (typeKey.includes('freezer')) {
      return systemParameters.temperatureRanges.freezer;
    } else if (typeKey.includes('hothold') || typeKey.includes('bainmarie') || typeKey.includes('oven')) {
      return systemParameters.temperatureRanges.hotHold;
    }
    return null;
  }, [systemParameters.temperatureRanges]);

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplierData, id: `sup${Date.now()}` };
    setSuppliers(prev => [newSupplier, ...prev]);
    toast({ title: "Supplier Added", description: `${newSupplier.name} has been added.`, className: "bg-accent text-accent-foreground" });
  };
  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    toast({ title: "Supplier Updated", description: `${updatedSupplier.name} has been updated.`, className: "bg-accent text-accent-foreground" });
  };
  const deleteSupplier = (supplierId: string) => {
    const name = suppliers.find(s => s.id === supplierId)?.name || 'Supplier';
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    toast({ title: "Supplier Deleted", description: `${name} has been removed.`, variant: "destructive" });
  };

  const addAppliance = (applianceData: Omit<Appliance, 'id'>) => {
    const newAppliance = { ...applianceData, id: `app${Date.now()}` };
    setAppliances(prev => [newAppliance, ...prev]);
     toast({ title: "Appliance Added", description: `${newAppliance.name} has been added.`, className: "bg-accent text-accent-foreground" });
  };
  const updateAppliance = (updatedAppliance: Appliance) => {
    setAppliances(prev => prev.map(a => a.id === updatedAppliance.id ? updatedAppliance : a));
    toast({ title: "Appliance Updated", description: `${updatedAppliance.name} has been updated.`, className: "bg-accent text-accent-foreground" });
  };
  const deleteAppliance = (applianceId: string) => {
    const name = appliances.find(a => a.id === applianceId)?.name || 'Appliance';
    setAppliances(prev => prev.filter(a => a.id !== applianceId));
     toast({ title: "Appliance Deleted", description: `${name} has been removed.`, variant: "destructive" });
  };

  const addProductionLog = (logData: Omit<ProductionLog, 'id' | 'logTime'>) => {
    const newLog = { ...logData, id: `prod${Date.now()}`, logTime: formatISO(new Date()) };
    setProductionLogs(prev => [newLog, ...prev]);
  };
  const updateProductionLog = (updatedLog: ProductionLog) => {
    setProductionLogs(prev => prev.map(l => l.id === updatedLog.id ? {...updatedLog, logTime: formatISO(new Date())} : l));
  };
  const deleteProductionLog = (logId: string) => {
    setProductionLogs(prev => prev.filter(l => l.id !== logId));
  };
  
  const addDeliveryLog = (logData: Omit<DeliveryLog, 'id' | 'deliveryTime'>) => {
    const newLog = { ...logData, id: `del${Date.now()}`, deliveryTime: formatISO(new Date()) };
    setDeliveryLogs(prev => [newLog, ...prev]);
  };
  const updateDeliveryLog = (updatedLog: DeliveryLog) => {
    setDeliveryLogs(prev => prev.map(l => l.id === updatedLog.id ? {...updatedLog, deliveryTime: formatISO(new Date())} : l));
  };
  const deleteDeliveryLog = (logId: string) => {
    setDeliveryLogs(prev => prev.filter(l => l.id !== logId));
  };

  const addTemperatureLog = (logData: Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'>, appliance: Appliance) => {
    let isCompliant = true;
    const effectiveRange = getApplianceEffectiveTempRange(appliance);
    if (effectiveRange) {
      if (logData.temperature < effectiveRange.min) isCompliant = false;
      if (logData.temperature > effectiveRange.max) isCompliant = false;
    }
    const newLog = { ...logData, id: `temp${Date.now()}`, logTime: formatISO(new Date()), isCompliant };
    setTemperatureLogs(prev => [newLog, ...prev]);
  };
  
  const updateTemperatureLog = (updatedLogData: Omit<TemperatureLog, 'isCompliant'>, appliance: Appliance) => {
    let isCompliant = true;
    const effectiveRange = getApplianceEffectiveTempRange(appliance);
     if (effectiveRange) {
      if (updatedLogData.temperature < effectiveRange.min) isCompliant = false;
      if (updatedLogData.temperature > effectiveRange.max) isCompliant = false;
    }
    const finalLog = { ...updatedLogData, logTime: formatISO(new Date()), isCompliant };
    setTemperatureLogs(prev => prev.map(l => l.id === finalLog.id ? finalLog : l));
  };
  const deleteTemperatureLog = (logId: string) => {
    setTemperatureLogs(prev => prev.filter(l => l.id !== logId));
  };

  const addCleaningTaskDefinition = (taskData: Omit<CleaningTask, 'id'>) => {
    const newTask = { ...taskData, id: `ctDef${Date.now()}` };
    setCleaningTasks(prev => [newTask, ...prev]);
     toast({ title: "Cleaning Task Definition Added", description: `${newTask.name} has been added.`, className: "bg-accent text-accent-foreground" });
  };
  const updateCleaningTaskDefinition = (updatedTask: CleaningTask) => {
    setCleaningTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    toast({ title: "Cleaning Task Definition Updated", description: `${updatedTask.name} has been updated.`, className: "bg-accent text-accent-foreground" });
  };
  const deleteCleaningTaskDefinition = (taskId: string) => {
    const name = cleaningTasks.find(t => t.id === taskId)?.name || 'Task Definition';
    setCleaningTasks(prev => prev.filter(t => t.id !== taskId));
    setCleaningChecklistItems(prev => prev.filter(item => item.taskId !== taskId));
    toast({ title: "Cleaning Task Definition Deleted", description: `${name} definition and related checklist items removed.`, variant: "destructive" });
  };
  
  const updateCleaningChecklistItem = (updatedItem: CleaningChecklistItem) => {
    setCleaningChecklistItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (updatedItem.completed) {
        const user = users.find(u => u.id === updatedItem.completedBy);
        toast({ title: "Task Completed!", description: `${updatedItem.name} marked as complete by ${user?.name || 'Unknown'}.`, className: "bg-accent text-accent-foreground" });
    } else {
        toast({ title: "Task Incomplete", description: `${updatedItem.name} marked as pending.` });
    }
  };
  
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: `user${Date.now()}` };
    setUsers(prev => [newUser, ...prev]);
    toast({ title: "User Added", description: `${newUser.name} has been added.`, className: "bg-accent text-accent-foreground" });
  };
  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    toast({ title: "User Updated", description: `${updatedUser.name} has been updated.`, className: "bg-accent text-accent-foreground" });
  };
  const deleteUser = (userId: string) => {
    const name = users.find(u => u.id === userId)?.name || 'User';
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: "User Deleted", description: `${name} has been removed.`, variant: "destructive" });
  };

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
  }, [productionLogs, temperatureLogs, cleaningChecklistItems, deliveryLogs, appliances, users, suppliers, findUserById, getApplianceEffectiveTempRange]);


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
