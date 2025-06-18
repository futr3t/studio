
import type { Supplier, Appliance, ProductionLog, DeliveryLog, TemperatureLog, CleaningTask, CleaningChecklistItem, User, TrainingRecord } from './types';
import { formatISO, addYears, subHours, subMinutes, subDays } from 'date-fns';

// Define some static base dates for consistency
const STATIC_NOW = new Date(2024, 5, 18, 14, 30, 0); // June 18, 2024, 14:30:00

export const mockSuppliersData: Supplier[] = [
  { id: 'sup1', name: 'Fresh Produce Co.', contactPerson: 'John Appleseed', phone: '555-1234', email: 'john@freshproduce.com' },
  { id: 'sup2', name: 'Meat Packers Inc.', contactPerson: 'Jane Doe', phone: '555-5678', email: 'jane@meatpackers.com' },
  { id: 'sup3', name: 'Dairy Best Ltd.', contactPerson: 'Peter Pan', phone: '555-8765', email: 'peter@dairybest.com' },
];

export const mockAppliancesData: Appliance[] = [
  { id: 'app1', name: 'Walk-in Fridge 1', location: 'Main Kitchen', type: 'Fridge', minTemp: 0, maxTemp: 5 },
  { id: 'app2', name: 'Freezer A', location: 'Storage Area', type: 'Freezer', minTemp: -25, maxTemp: -18 },
  { id: 'app3', name: 'Oven 1', location: 'Bakery Section', type: 'Oven', minTemp: 180, maxTemp: 220 },
  { id: 'app4', name: 'Bain Marie', location: 'Service Counter', type: 'Hot Hold', minTemp: 63, maxTemp: 75 },
];

export const mockUsersData: User[] = [
  {
    id: 'user1',
    name: 'Alice Wonderland',
    email: 'alice@chefcheck.com',
    role: 'admin',
    trainingRecords: [
      { name: 'Food Safety Level 3', dateCompleted: formatISO(addYears(STATIC_NOW, -1), { representation: 'date' }), expiryDate: formatISO(addYears(STATIC_NOW, 2), { representation: 'date' }), certificateUrl: 'https://example.com/cert/alice1.pdf' },
      { name: 'HACCP Principles', dateCompleted: formatISO(addYears(STATIC_NOW, -1), { representation: 'date' }) },
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


export const mockProductionLogsData: ProductionLog[] = [
  {
    id: 'prod1',
    productName: 'Chicken Curry',
    batchCode: 'CC20240728A',
    logTime: formatISO(subMinutes(STATIC_NOW, 10)), // 10 mins ago from STATIC_NOW
    criticalLimitDetails: 'Cooked to 75°C core temperature',
    isCompliant: true,
    verifiedBy: 'user1',
  },
  {
    id: 'prod2',
    productName: 'Beef Stew',
    batchCode: 'BS20240728B',
    logTime: formatISO(subHours(STATIC_NOW, 2)), // 2 hours ago from STATIC_NOW
    criticalLimitDetails: 'Cooled from 60°C to 20°C within 2 hours',
    isCompliant: false,
    correctiveAction: 'Discarded batch. Reviewed cooling process.',
    verifiedBy: 'user2',
  },
];

export const mockDeliveryLogsData: DeliveryLog[] = [
  {
    id: 'del1',
    supplierId: 'sup1',
    deliveryTime: formatISO(subMinutes(STATIC_NOW, 30)), // 30 mins ago from STATIC_NOW
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
    deliveryTime: formatISO(subDays(STATIC_NOW, 1)), // Yesterday from STATIC_NOW
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
    applianceId: 'app1',
    temperature: 3,
    logTime: formatISO(subMinutes(STATIC_NOW, 5)), // 5 mins ago from STATIC_NOW
    isCompliant: true,
    loggedBy: 'user1',
  },
  {
    id: 'temp2',
    applianceId: 'app2',
    temperature: -15,
    logTime: formatISO(subHours(STATIC_NOW, 4)), // 4 hours ago from STATIC_NOW
    isCompliant: false,
    correctiveAction: 'Adjusted thermostat. Will re-check in 1 hour.',
    loggedBy: 'user2',
  },
  {
    id: 'temp3',
    applianceId: 'app1',
    temperature: 4,
    logTime: formatISO(subHours(STATIC_NOW, 8)), // 8 hours ago from STATIC_NOW
    isCompliant: true,
    loggedBy: 'user1',
  },
];

export const mockCleaningTasksData: CleaningTask[] = [
  { id: 'ctDef1', name: 'Clean Work Surfaces', area: 'Main Kitchen', frequency: 'daily', description: 'Sanitize all food preparation surfaces.' },
  { id: 'ctDef2', name: 'Mop Floors', area: 'Main Kitchen', frequency: 'daily' },
  { id: 'ctDef3', name: 'Deep Clean Fryers', area: 'Fry Station', frequency: 'weekly', description: 'Boil out fryers and change oil.' },
  { id: 'ctDef4', name: 'Clean Walk-in Fridge Shelves', area: 'Main Kitchen', frequency: 'monthly' },
];

export const mockCleaningChecklistItemsData: CleaningChecklistItem[] = mockCleaningTasksData.map((task, index) => ({
  id: `item-${task.id}`, 
  taskId: task.id, 
  name: task.name,
  area: task.area,
  frequency: task.frequency,
  description: task.description,
  completed: index % 2 === 0,
  completedAt: index % 2 === 0 ? formatISO(subHours(STATIC_NOW, (index + 1) * 2)) : undefined, // Staggered times from STATIC_NOW
  completedBy: index % 2 === 0 ? 'user2' : undefined, 
  notes: index % 2 === 0 ? 'All good' : undefined,
}));
