import type { Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog, CleaningTask, CleaningChecklistItem } from './types';
import { formatISO } from 'date-fns';

export const mockSuppliers: Supplier[] = [
  { id: 'sup1', name: 'Fresh Produce Co.', contactPerson: 'John Appleseed', phone: '555-1234', email: 'john@freshproduce.com' },
  { id: 'sup2', name: 'Meat Packers Inc.', contactPerson: 'Jane Doe', phone: '555-5678', email: 'jane@meatpackers.com' },
  { id: 'sup3', name: 'Dairy Best Ltd.', contactPerson: 'Peter Pan', phone: '555-8765', email: 'peter@dairybest.com' },
];

export const mockAppliances: Appliance[] = [
  { id: 'app1', name: 'Walk-in Fridge 1', location: 'Main Kitchen', type: 'Fridge', minTemp: 0, maxTemp: 5 },
  { id: 'app2', name: 'Freezer A', location: 'Storage Area', type: 'Freezer', minTemp: -25, maxTemp: -18 },
  { id: 'app3', name: 'Oven 1', location: 'Bakery Section', type: 'Oven', minTemp: 180, maxTemp: 220 },
  { id: 'app4', name: 'Bain Marie', location: 'Service Counter', type: 'Hot Hold', minTemp: 63, maxTemp: 75 },
];

export const mockProductionLogs: ProductionLog[] = [
  {
    id: 'prod1',
    productName: 'Chicken Curry',
    batchCode: 'CC20240728A',
    logTime: formatISO(new Date()),
    criticalLimitDetails: 'Cooked to 75°C core temperature',
    isCompliant: true,
    verifiedBy: 'Chef Ramsay',
  },
  {
    id: 'prod2',
    productName: 'Beef Stew',
    batchCode: 'BS20240728B',
    logTime: formatISO(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
    criticalLimitDetails: 'Cooled from 60°C to 20°C within 2 hours',
    isCompliant: false,
    correctiveAction: 'Discarded batch. Reviewed cooling process.',
    verifiedBy: 'Sous Chef Julia',
  },
];

export const mockDeliveryLogs: DeliveryLog[] = [
  {
    id: 'del1',
    supplierId: 'sup1',
    deliveryTime: formatISO(new Date()),
    items: [
      { name: 'Tomatoes', quantity: 10, unit: 'kg', temperature: 4, isCompliant: true },
      { name: 'Lettuce', quantity: 5, unit: 'box', temperature: 3, isCompliant: true },
    ],
    vehicleReg: 'FR35HPR0',
    driverName: 'Mike R.',
    overallCondition: 'good',
    isCompliant: true,
    receivedBy: 'Store Manager Bob',
  },
  {
    id: 'del2',
    supplierId: 'sup2',
    deliveryTime: formatISO(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Yesterday
    items: [
      { name: 'Minced Beef', quantity: 20, unit: 'kg', temperature: 6, isCompliant: false, notes: 'Temp slightly high' },
      { name: 'Chicken Breasts', quantity: 15, unit: 'kg', temperature: 2, isCompliant: true },
    ],
    vehicleReg: 'M34TP4CK',
    driverName: 'Sarah K.',
    overallCondition: 'fair',
    isCompliant: false,
    correctiveAction: 'Rejected minced beef. Informed supplier.',
    receivedBy: 'Store Manager Bob',
  },
];

export const mockTemperatureLogs: TemperatureLog[] = [
  {
    id: 'temp1',
    applianceId: 'app1',
    temperature: 3,
    logTime: formatISO(new Date()),
    isCompliant: true,
    loggedBy: 'Staff Alice',
  },
  {
    id: 'temp2',
    applianceId: 'app2',
    temperature: -15,
    logTime: formatISO(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
    isCompliant: false,
    correctiveAction: 'Adjusted thermostat. Will re-check in 1 hour.',
    loggedBy: 'Staff Bob',
  },
  {
    id: 'temp3',
    applianceId: 'app1',
    temperature: 4,
    logTime: formatISO(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
    isCompliant: true,
    loggedBy: 'Staff Alice',
  },
];

export const mockCleaningTasks: CleaningTask[] = [
  { id: 'ct1', name: 'Clean Work Surfaces', area: 'Main Kitchen', frequency: 'daily', description: 'Sanitize all food preparation surfaces.' },
  { id: 'ct2', name: 'Mop Floors', area: 'Main Kitchen', frequency: 'daily' },
  { id: 'ct3', name: 'Deep Clean Fryers', area: 'Fry Station', frequency: 'weekly', description: 'Boil out fryers and change oil.' },
  { id: 'ct4', name: 'Clean Walk-in Fridge Shelves', area: 'Main Kitchen', frequency: 'monthly' },
];

export const mockCleaningChecklist: CleaningChecklistItem[] = mockCleaningTasks.map((task, index) => ({
  ...task,
  completed: index % 2 === 0, // Alternate completed status
  completedAt: index % 2 === 0 ? formatISO(new Date(Date.now() - (index + 1) * 60 * 60 * 1000)) : undefined,
  completedBy: index % 2 === 0 ? 'Cleaner Carol' : undefined,
}));
