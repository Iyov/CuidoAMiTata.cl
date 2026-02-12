/**
 * IndexedDB wrapper para almacenamiento estructurado offline
 */

const DB_NAME = 'CuidoAMiTataDB';
const DB_VERSION = 3;

// Nombres de object stores
export const STORES = {
  PATIENTS: 'patients',
  MEDICATIONS: 'medications',
  CARE_EVENTS: 'careEvents',
  NOTIFICATIONS: 'notifications',
  SYNC_QUEUE: 'syncQueue',
  ENCRYPTED_DATA: 'encrypted_data',
  FALL_INCIDENTS: 'fallIncidents',
  RISK_CHECKLISTS: 'riskChecklists',
  RISK_ALERTS: 'riskAlerts',
  POSTURAL_CHANGES: 'posturalChanges',
  PRESSURE_ULCERS: 'pressureUlcers',
} as const;

/**
 * Inicializa la base de datos IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store de pacientes
      if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
        const patientStore = db.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
        patientStore.createIndex('name', 'name', { unique: false });
      }

      // Store de medicamentos
      if (!db.objectStoreNames.contains(STORES.MEDICATIONS)) {
        const medicationStore = db.createObjectStore(STORES.MEDICATIONS, { keyPath: 'id' });
        medicationStore.createIndex('patientId', 'patientId', { unique: false });
        medicationStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // Store de eventos de cuidado
      if (!db.objectStoreNames.contains(STORES.CARE_EVENTS)) {
        const eventStore = db.createObjectStore(STORES.CARE_EVENTS, { keyPath: 'id' });
        eventStore.createIndex('patientId', 'patientId', { unique: false });
        eventStore.createIndex('eventType', 'eventType', { unique: false });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // Store de notificaciones
      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        const notificationStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
        notificationStore.createIndex('patientId', 'patientId', { unique: false });
        notificationStore.createIndex('status', 'status', { unique: false });
        notificationStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }

      // Store de cola de sincronización
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store de datos cifrados
      if (!db.objectStoreNames.contains(STORES.ENCRYPTED_DATA)) {
        const encryptedStore = db.createObjectStore(STORES.ENCRYPTED_DATA, { keyPath: 'id' });
        encryptedStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store de incidentes de caída
      if (!db.objectStoreNames.contains(STORES.FALL_INCIDENTS)) {
        const fallIncidentStore = db.createObjectStore(STORES.FALL_INCIDENTS, { keyPath: 'id' });
        fallIncidentStore.createIndex('patientId', 'patientId', { unique: false });
        fallIncidentStore.createIndex('occurredAt', 'occurredAt', { unique: false });
      }

      // Store de listas de verificación de riesgos
      if (!db.objectStoreNames.contains(STORES.RISK_CHECKLISTS)) {
        const riskChecklistStore = db.createObjectStore(STORES.RISK_CHECKLISTS, { keyPath: 'id' });
        riskChecklistStore.createIndex('patientId', 'patientId', { unique: false });
        riskChecklistStore.createIndex('checkDate', 'checkDate', { unique: false });
      }

      // Store de alertas de riesgo
      if (!db.objectStoreNames.contains(STORES.RISK_ALERTS)) {
        const riskAlertStore = db.createObjectStore(STORES.RISK_ALERTS, { keyPath: 'id' });
        riskAlertStore.createIndex('patientId', 'patientId', { unique: false });
        riskAlertStore.createIndex('riskType', 'riskType', { unique: false });
        riskAlertStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store de cambios posturales
      if (!db.objectStoreNames.contains(STORES.POSTURAL_CHANGES)) {
        const posturalChangeStore = db.createObjectStore(STORES.POSTURAL_CHANGES, { keyPath: 'id' });
        posturalChangeStore.createIndex('patientId', 'patientId', { unique: false });
        posturalChangeStore.createIndex('performedAt', 'performedAt', { unique: false });
      }

      // Store de úlceras por presión
      if (!db.objectStoreNames.contains(STORES.PRESSURE_ULCERS)) {
        const pressureUlcerStore = db.createObjectStore(STORES.PRESSURE_ULCERS, { keyPath: 'id' });
        pressureUlcerStore.createIndex('patientId', 'patientId', { unique: false });
        pressureUlcerStore.createIndex('grade', 'grade', { unique: false });
        pressureUlcerStore.createIndex('assessedAt', 'assessedAt', { unique: false });
      }
    };
  });
}

/**
 * Obtiene un registro por ID
 */
export async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene todos los registros de un store
 */
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene registros por índice
 */
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: string | number
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda o actualiza un registro
 */
export async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda múltiples registros
 */
export async function putMany<T>(storeName: string, items: T[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    let completed = 0;
    const total = items.length;

    items.forEach((item) => {
      const request = store.put(item);
      request.onsuccess = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    if (total === 0) {
      resolve();
    }
  });
}

/**
 * Elimina un registro por ID
 */
export async function deleteById(storeName: string, id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina todos los registros de un store
 */
export async function clear(storeName: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cuenta registros en un store
 */
export async function count(storeName: string): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
