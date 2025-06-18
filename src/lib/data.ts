import type { Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog, CleaningTask, CleaningChecklistItem, User, TrainingRecord } from './types';
import { formatISO, addYears } from 'date-fns';

export const mockSuppliersData: Supplier[] = [
  { id: 'sup1', name: 'Fresh Produce Co.', contactPerson: 'John Appleseed', phone: '555-1234', email: 'john@freshproduce.com' },
  { id: 'sup2', name: 'Meat Packers Inc.', contactPerson: 'Jane Doe', phone: '555-5678', email: 'jane@meatpackers.com' },
  { id: 'sup3', name: 'Dairy Best Ltd.', contactPerson: 'Peter Pan', phone: '555-8765', email: 'peter@dairybest.com' },
];

export const mockAppliancesData: Appliance[] = [
  { id: 'app1', name: 'Walk-in Fridge 1', location: 'Main Kitchen', type: 'Fridge', minTemp: 0, maxTemp: 5 },
  { id: 'app2', name: 'Freezer A', location: 'Storage Area', type: 'Freezer', minTemp: -25, maxTemp: -18 },
  { id: 'app3', name: 'Oven 1', location: 'Bakery Section', type: 'Oven', minTemp: 180, maxTemp: 220 }, // Example, not directly logged in temp page yet
  { id: 'app4', name: 'Bain Marie', location: 'Service Counter', type: 'Hot Hold', minTemp: 63, maxTemp: 75 },  // Example
];

export const mockProductionLogsData: ProductionLog[] = [
  {
    id: 'prod1',
    productName: 'Chicken Curry',
    batchCode: 'CC20240728A',
    logTime: formatISO(new Date(Date.now() - 10 * 60 * 1000)), // 10 mins ago
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

export const mockDeliveryLogsData: DeliveryLog[] = [
  {
    id: 'del1',
    supplierId: 'sup1',
    deliveryTime: formatISO(new Date(Date.now() - 30 * 60 * 1000)), // 30 mins ago
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

export const mockTemperatureLogsData: TemperatureLog[] = [
  {
    id: 'temp1',
    applianceId: 'app1', // Walk-in Fridge 1
    temperature: 3,
    logTime: formatISO(new Date(Date.now() - 5 * 60 * 1000)), // 5 mins ago
    isCompliant: true,
    loggedBy: 'Staff Alice',
  },
  {
    id: 'temp2',
    applianceId: 'app2', // Freezer A
    temperature: -15,
    logTime: formatISO(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
    isCompliant: false,
    correctiveAction: 'Adjusted thermostat. Will re-check in 1 hour.',
    loggedBy: 'Staff Bob',
  },
  {
    id: 'temp3',
    applianceId: 'app1', // Walk-in Fridge 1
    temperature: 4,
    logTime: formatISO(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
    isCompliant: true,
    loggedBy: 'Staff Alice',
  },
];

export const mockCleaningTasksData: CleaningTask[] = [ // Definitions
  { id: 'ctDef1', name: 'Clean Work Surfaces', area: 'Main Kitchen', frequency: 'daily', description: 'Sanitize all food preparation surfaces.' },
  { id: 'ctDef2', name: 'Mop Floors', area: 'Main Kitchen', frequency: 'daily' },
  { id: 'ctDef3', name: 'Deep Clean Fryers', area: 'Fry Station', frequency: 'weekly', description: 'Boil out fryers and change oil.' },
  { id: 'ctDef4', name: 'Clean Walk-in Fridge Shelves', area: 'Main Kitchen', frequency: 'monthly' },
];

// Represents the current state of the checklist, including completion.
// IDs here should be persistent for each task instance on the checklist for a given period.
// For simplicity, we use the definition ID as the checklist item ID if it's a daily recurring task.
export const mockCleaningChecklistItemsData: CleaningChecklistItem[] = mockCleaningTasksData.map((task, index) => ({
  id: `item-${task.id}`, // Unique ID for the checklist item instance
  taskId: task.id, // Link to the definition
  name: task.name,
  area: task.area,
  frequency: task.frequency,
  description: task.description,
  completed: index % 2 === 0,
  completedAt: index % 2 === 0 ? formatISO(new Date(Date.now() - (index + 1) * 60 * 60 * 1000)) : undefined, // 1 hour ago, 3 hours ago
  completedBy: index % 2 === 0 ? 'user2' : undefined, // User ID
  notes: index % 2 === 0 ? 'All good' : undefined,
}));


const today = new Date();
export const mockUsersData: User[] = [
  {
    id: 'user1',
    name: 'Alice Wonderland',
    email: 'alice@chefcheck.com',
    role: 'admin',
    trainingRecords: [
      { name: 'Food Safety Level 3', dateCompleted: formatISO(addYears(today, -1), { representation: 'date' }), expiryDate: formatISO(addYears(today, 2), { representation: 'date' }), certificateUrl: 'https://example.com/cert/alice1.pdf' },
      { name: 'HACCP Principles', dateCompleted: formatISO(addYears(today, -1), { representation: 'date' }) },
    ],
  },
  {
    id: 'user2',
    name: 'Bob The Builder',
    email: 'bob@chefcheck.com',
    role: 'staff',
    trainingRecords: [
      { name: 'Food Safety Level 2', dateCompleted: formatISO(new Date(2023, 5, 15), { representation: 'date' }), expiryDate: formatISO(new Date(2026, 5, 14), { representation: 'date' }) },
    ],
  },
  {
    id: 'user3',
    name: 'Charlie Brown',
    email: 'charlie@chefcheck.com',
    role: 'staff',
    trainingRecords: [],
  }
];
