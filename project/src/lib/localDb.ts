export interface AnalysisResult {
  id: string;
  image_url?: string;
  license_plate: string | null;
  plate_confidence: number;
  occupant_count: number;
  occupant_confidence: number;
  violations: string[];
  analysis_metadata?: Record<string, any>;
  camera_id: string;
  analyzed_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  read: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  owner_name: string;
  owner_phone: string;
  vehicle_type: string;
  vehicle_capacity: number;
  license_expiry_date: string;
  inspection_expiry_date: string;
  created_at: string;
}

export interface Violation {
  id: string;
  license_plate: string;
  violation_type: string;
  severity: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  location?: string;
  confidence_score?: number;
  occupant_count?: number;
  notes?: string;
  image_url?: string;
  timestamp: string;
  created_at: string;
}

export interface Alert {
  id: string;
  recipient_phone: string;
  recipient_email?: string;
  message: string;
  alert_type: 'sms' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  created_at: string;
  sent_at?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  licensePlate: string | null;
  occupantCount: number;
  violations: string[];
  plateConfidence: number;
  occupantConfidence: number;
  description: string;
}

const DB_NAME = 'RoadComplianceDB';
const DB_VERSION = 1;

const STORES = {
  analysisResults: 'analysisResults',
  notifications: 'notifications',
  vehicles: 'vehicles',
  violations: 'violations',
  alerts: 'alerts',
  demoScenarios: 'demoScenarios',
};

let db: IDBDatabase | null = null;

export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORES.analysisResults)) {
        const store = database.createObjectStore(STORES.analysisResults, {
          keyPath: 'id',
        });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('license_plate', 'license_plate', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.notifications)) {
        const store = database.createObjectStore(STORES.notifications, {
          keyPath: 'id',
        });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('read', 'read', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.vehicles)) {
        const store = database.createObjectStore(STORES.vehicles, {
          keyPath: 'id',
        });
        store.createIndex('license_plate', 'license_plate', { unique: true });
      }

      if (!database.objectStoreNames.contains(STORES.violations)) {
        const store = database.createObjectStore(STORES.violations, {
          keyPath: 'id',
        });
        store.createIndex('license_plate', 'license_plate', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.alerts)) {
        const store = database.createObjectStore(STORES.alerts, {
          keyPath: 'id',
        });
        store.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.demoScenarios)) {
        database.createObjectStore(STORES.demoScenarios, {
          keyPath: 'id',
        });
      }
    };
  });
}

function getDB(): IDBDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function addAnalysisResult(
  data: Omit<AnalysisResult, 'id' | 'created_at'>
): Promise<AnalysisResult> {
  const database = getDB();
  const result: AnalysisResult = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.analysisResults], 'readwrite');
    const store = transaction.objectStore(STORES.analysisResults);
    const request = store.add(result);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(result);
  });
}

export async function getAnalysisResults(limit = 50): Promise<AnalysisResult[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.analysisResults], 'readonly');
    const store = transaction.objectStore(STORES.analysisResults);
    const index = store.index('created_at');
    const range = IDBKeyRange.lowerBound(0);
    const request = index.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as AnalysisResult[]).reverse().slice(0, limit);
      resolve(results);
    };
  });
}

export async function addNotification(
  data: Omit<Notification, 'id' | 'created_at'>
): Promise<Notification> {
  const database = getDB();
  const notification: Notification = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.notifications], 'readwrite');
    const store = transaction.objectStore(STORES.notifications);
    const request = store.add(notification);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(notification);
  });
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.notifications], 'readonly');
    const store = transaction.objectStore(STORES.notifications);
    const index = store.index('created_at');
    const request = index.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as Notification[]).reverse().slice(0, limit);
      resolve(results);
    };
  });
}

export async function updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.notifications], 'readwrite');
    const store = transaction.objectStore(STORES.notifications);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const notification = getRequest.result as Notification;
      const updated = { ...notification, ...updates };
      const updateRequest = store.put(updated);

      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteNotification(id: string): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.notifications], 'readwrite');
    const store = transaction.objectStore(STORES.notifications);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function addVehicle(
  data: Omit<Vehicle, 'id' | 'created_at'>
): Promise<Vehicle> {
  const database = getDB();
  const vehicle: Vehicle = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.vehicles], 'readwrite');
    const store = transaction.objectStore(STORES.vehicles);
    const request = store.add(vehicle);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(vehicle);
  });
}

export async function getVehicles(): Promise<Vehicle[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.vehicles], 'readonly');
    const store = transaction.objectStore(STORES.vehicles);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as Vehicle[]) || []);
  });
}

export async function getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.vehicles], 'readonly');
    const store = transaction.objectStore(STORES.vehicles);
    const index = store.index('license_plate');
    const request = index.get(plate);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as Vehicle | undefined);
  });
}

export async function updateVehicle(id: string, updates: Partial<Omit<Vehicle, 'id' | 'created_at'>>): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.vehicles], 'readwrite');
    const store = transaction.objectStore(STORES.vehicles);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const vehicle = getRequest.result as Vehicle;
      if (!vehicle) { reject(new Error('Vehicle not found')); return; }
      const updated = { ...vehicle, ...updates };
      const updateRequest = store.put(updated);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.vehicles], 'readwrite');
    const store = transaction.objectStore(STORES.vehicles);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function addViolation(
  data: Omit<Violation, 'id' | 'created_at'>
): Promise<Violation> {
  const database = getDB();
  const violation: Violation = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.violations], 'readwrite');
    const store = transaction.objectStore(STORES.violations);
    const request = store.add(violation);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(violation);
  });
}

export async function getViolations(limit = 50): Promise<Violation[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.violations], 'readonly');
    const store = transaction.objectStore(STORES.violations);
    const index = store.index('created_at');
    const request = index.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as Violation[]).reverse().slice(0, limit);
      resolve(results);
    };
  });
}

export async function updateViolation(id: string, updates: Partial<Violation>): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.violations], 'readwrite');
    const store = transaction.objectStore(STORES.violations);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const violation = getRequest.result as Violation;
      if (!violation) { reject(new Error('Violation not found')); return; }
      const updated = { ...violation, ...updates };
      const updateRequest = store.put(updated);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteViolation(id: string): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.violations], 'readwrite');
    const store = transaction.objectStore(STORES.violations);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function addAlert(
  data: Omit<Alert, 'id' | 'created_at'>
): Promise<Alert> {
  const database = getDB();
  const alert: Alert = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.alerts], 'readwrite');
    const store = transaction.objectStore(STORES.alerts);
    const request = store.add(alert);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(alert);
  });
}

export async function getAlerts(limit = 50): Promise<Alert[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.alerts], 'readonly');
    const store = transaction.objectStore(STORES.alerts);
    const index = store.index('created_at');
    const request = index.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as Alert[]).reverse().slice(0, limit);
      resolve(results);
    };
  });
}

export async function saveDemoScenario(scenario: DemoScenario): Promise<void> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.demoScenarios], 'readwrite');
    const store = transaction.objectStore(STORES.demoScenarios);
    const request = store.put(scenario);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getDemoScenarios(): Promise<DemoScenario[]> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.demoScenarios], 'readonly');
    const store = transaction.objectStore(STORES.demoScenarios);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as DemoScenario[]) || []);
  });
}

export async function getDemoScenarioById(id: string): Promise<DemoScenario | undefined> {
  const database = getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.demoScenarios], 'readonly');
    const store = transaction.objectStore(STORES.demoScenarios);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as DemoScenario | undefined);
  });
}
