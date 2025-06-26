export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Appliance {
  id: string;
  name: string;
  location: string;
  type: string; // e.g., Fridge, Freezer, Oven, Hot Hold
  minTemp?: number;
  maxTemp?: number;
}

export interface ProductionLog {
  id: string;
  productName: string;
  batchCode: string;
  logTime: string; // ISO Date string
  criticalLimitDetails: string; // e.g. "Cooked to 75°C"
  isCompliant: boolean;
  correctiveAction?: string;
  verifiedBy?: string; // User ID
}

export interface DeliveryItem {
  name: string;
  quantity: number;
  unit: string; // e.g. kg, pcs, box
  temperature?: number;
  isCompliant: boolean;
  notes?: string;
}

export interface DeliveryLog {
  id: string;
  supplierId: string;
  deliveryTime: string; // ISO Date string
  items: DeliveryItem[];
  vehicleReg?: string;
  driverName?: string;
  overallCondition?: 'good' | 'fair' | 'poor';
  isCompliant: boolean;
  correctiveAction?: string;
  receivedBy?: string; // User ID
}

export interface TemperatureLog {
  id: string;
  applianceId: string;
  temperature: number;
  logTime: string; // ISO Date string
  isCompliant: boolean;
  correctiveAction?: string;
  loggedBy?: string; // User ID
}

export type CleaningFrequency = 'daily' | 'weekly' | 'monthly' | 'as_needed';

export interface CleaningTask { // Definition
  id: string;
  name: string;
  area: string;
  frequency: CleaningFrequency;
  description?: string;
  equipment?: string[]; // list of equipment/chemicals needed
}

export interface CleaningChecklistItem { // Instance of a task for logging
  id: string; // Can be same as task.id if checklist is generated daily/weekly or unique if persistent
  taskId: string; // Link to CleaningTask definition
  name: string;
  area: string;
  frequency: CleaningFrequency;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO Date string
  completedBy?: string; // User ID
  notes?: string;
}

export interface TrainingRecord {
  name: string;
  dateCompleted: string; // ISO Date string or YYYY-MM-DD
  expiryDate?: string; // ISO Date string or YYYY-MM-DD
  certificateUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  trainingRecords?: TrainingRecord[];
}

// For Dashboard Recent Activity
export interface ActivityFeedItem {
  id: string; // Unique ID for the feed item (e.g., `logType-logId`)
  timestamp: string; // ISO string for sorting
  description: string;
  user?: string;
  statusIcon: React.ElementType; // Lucide icon component
  itemIcon: React.ElementType; // Lucide icon component for the item type
  isNonCompliant?: boolean; // Optional flag for styling
  logType: 'production' | 'delivery' | 'temperature' | 'cleaning';
}

// For System Parameters
export interface TemperatureRange {
  min: number;
  max: number;
}

export interface SystemParameters {
  temperatureRanges: {
    fridge: TemperatureRange;
    freezer: TemperatureRange;
    hotHold: TemperatureRange;
  };
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
  };
}

export interface DataContextType {
  suppliers: Supplier[];
  appliances: Appliance[];
  productionLogs: ProductionLog[];
  deliveryLogs: DeliveryLog[];
  temperatureLogs: TemperatureLog[];
  cleaningTasks: CleaningTask[]; // Definitions
  cleaningChecklistItems: CleaningChecklistItem[]; // Instances
  users: User[];
  systemParameters: SystemParameters;
  getRecentActivities: (limit?: number) => ActivityFeedItem[];

  updateSystemParameters: (newParams: SystemParameters) => void;

  addSupplier: (supplierData: Omit<Supplier, 'id'>) => void;
  updateSupplier: (updatedSupplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;

  addAppliance: (applianceData: Omit<Appliance, 'id'>) => void;
  updateAppliance: (updatedAppliance: Appliance) => void;
  deleteAppliance: (applianceId: string) => void;

  addProductionLog: (logData: Omit<ProductionLog, 'id' | 'logTime'>) => void;
  updateProductionLog: (updatedLog: ProductionLog) => void;
  deleteProductionLog: (logId: string) => void;

  addDeliveryLog: (logData: Omit<DeliveryLog, 'id' | 'deliveryTime'>) => void;
  updateDeliveryLog: (updatedLog: DeliveryLog) => void;
  deleteDeliveryLog: (logId: string) => void;

  addTemperatureLog: (logData: Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'>, appliance: Appliance) => void;
  updateTemperatureLog: (updatedLogData: Omit<TemperatureLog, 'isCompliant'>, appliance: Appliance) => void;
  deleteTemperatureLog: (logId: string) => void;

  addCleaningTaskDefinition: (taskData: Omit<CleaningTask, 'id'>) => void;
  updateCleaningTaskDefinition: (updatedTask: CleaningTask) => void;
  deleteCleaningTaskDefinition: (taskId: string) => void;

  updateCleaningChecklistItem: (updatedItem: CleaningChecklistItem) => void;
  
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;

  findUserById: (userId: string) => User | undefined;
  getApplianceEffectiveTempRange: (appliance: Appliance) => TemperatureRange | null;
}
