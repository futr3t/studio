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
  type: string; // e.g., Fridge, Freezer, Oven
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
  verifiedBy?: string;
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
  receivedBy?: string;
}

export interface TemperatureLog {
  id: string;
  applianceId: string;
  temperature: number;
  logTime: string; // ISO Date string
  isCompliant: boolean;
  correctiveAction?: string;
  loggedBy?: string;
}

export type CleaningFrequency = 'daily' | 'weekly' | 'monthly' | 'as_needed';

export interface CleaningTask {
  id: string;
  name: string;
  area: string;
  frequency: CleaningFrequency;
  description?: string;
  equipment?: string[]; // list of equipment/chemicals needed
}

export interface CleaningChecklistItem extends CleaningTask {
  completed: boolean;
  completedAt?: string; // ISO Date string
  completedBy?: string;
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
