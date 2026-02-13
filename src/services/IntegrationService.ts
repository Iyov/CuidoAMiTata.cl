/**
 * Integration Service
 * 
 * Central orchestrator that connects all managers and services together.
 * Ensures proper initialization, event flow, and coordination between modules.
 */

import { Result, Ok, Err, isErr } from '../types/result';
import { CareEvent, Notification } from '../types/models';
import { ConnectionStatus } from '../types/enums';
import { getNotificationService } from './NotificationService';
import { getDataSyncService } from './DataSyncService';
import { getMedicationManager } from './MedicationManager';
import { getFallPreventionManager } from './FallPreventionManager';
import { getSkinIntegrityManager } from './SkinIntegrityManager';
import { getNutritionManager } from './NutritionManager';
import { getIncontinenceManager } from './IncontinenceManager';
import { getPolypharmacyManager } from './PolypharmacyManager';
import { getEthicalCareModule } from './EthicalCareModule';
import { getPatientManager } from './PatientManager';
import { getHistoryService } from './HistoryService';

/**
 * Integration Service
 * Coordinates all managers and services
 */
export class IntegrationService {
  private initialized = false;
  private eventListeners: Map<string, Set<(event: CareEvent) => void>> = new Map();

  /**
   * Initialize all services and managers
   */
  async initialize(): Promise<Result<void>> {
    if (this.initialized) {
      return Ok(undefined);
    }

    try {
      // Initialize core services first
      const notificationService = await getNotificationService();
      await notificationService.initialize();

      const dataSyncService = await getDataSyncService();
      await dataSyncService.initialize();

      const historyService = await getHistoryService();
      // HistoryService doesn't have initialize method

      // Initialize managers
      const medicationManager = await getMedicationManager();
      // MedicationManager doesn't have initialize method

      const fallPreventionManager = await getFallPreventionManager();
      // FallPreventionManager doesn't have initialize method

      const skinIntegrityManager = await getSkinIntegrityManager();
      // SkinIntegrityManager doesn't have initialize method

      const nutritionManager = await getNutritionManager();
      // NutritionManager doesn't have initialize method

      const incontinenceManager = await getIncontinenceManager();
      // IncontinenceManager doesn't have initialize method

      const polypharmacyManager = await getPolypharmacyManager();
      // PolypharmacyManager doesn't have initialize method

      const ethicalCareModule = await getEthicalCareModule();
      // EthicalCareModule doesn't have initialize method

      const patientManager = await getPatientManager();
      // PatientManager doesn't have initialize method

      // Set up event coordination
      this.setupEventCoordination();

      this.initialized = true;
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: 'INTEGRATION_INIT_FAILED' as any,
        message: 'Error al inicializar los servicios',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Set up event coordination between services
   */
  private setupEventCoordination(): void {
    // When any care event is recorded, ensure it's:
    // 1. Saved to history (handled by HistoryService directly)
    // 2. Queued for sync
    // 3. Triggers any necessary notifications
    this.addEventListener('care_event_recorded', async (event: CareEvent) => {
      const dataSyncService = await getDataSyncService();

      // Queue for sync
      await dataSyncService.queueEventForSync(event);
    });
  }

  /**
   * Register an event listener
   */
  addEventListener(eventType: string, listener: (event: CareEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventType: string, listener: (event: CareEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit an event to all listeners
   */
  async emitEvent(eventType: string, event: CareEvent): Promise<void> {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }
  }

  /**
   * Record a care event and coordinate all related actions
   */
  async recordCareEvent(event: CareEvent): Promise<Result<void>> {
    if (!this.initialized) {
      return Err({
        code: 'INTEGRATION_NOT_INITIALIZED' as any,
        message: 'El servicio de integración no está inicializado',
      });
    }

    try {
      // Emit the event to all listeners
      await this.emitEvent('care_event_recorded', event);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: 'CARE_EVENT_RECORDING_FAILED' as any,
        message: 'Error al registrar el evento de cuidado',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Schedule a notification and ensure it's coordinated with all services
   */
  async scheduleNotification(notification: Notification): Promise<Result<string>> {
    if (!this.initialized) {
      return Err({
        code: 'INTEGRATION_NOT_INITIALIZED' as any,
        message: 'El servicio de integración no está inicializado',
      });
    }

    const notificationService = await getNotificationService();
    return notificationService.scheduleNotification(notification);
  }

  /**
   * Get sync status across all services
   */
  async getSyncStatus(): Promise<Result<{
    connectionStatus: string;
    pendingEvents: number;
    lastSync: Date | null;
  }>> {
    if (!this.initialized) {
      return Err({
        code: 'INTEGRATION_NOT_INITIALIZED' as any,
        message: 'El servicio de integración no está inicializado',
      });
    }

    try {
      const dataSyncService = await getDataSyncService();
      const connectionStatus = dataSyncService.getConnectionStatus();
      const syncMetadata = await dataSyncService.getSyncMetadata();

      if (isErr(syncMetadata)) {
        return Err(syncMetadata.error);
      }

      return Ok({
        connectionStatus: connectionStatus === ConnectionStatus.ONLINE ? 'ONLINE' : 'OFFLINE',
        pendingEvents: syncMetadata.value.pendingEvents,
        lastSync: syncMetadata.value.lastSuccessfulSync,
      });
    } catch (error) {
      return Err({
        code: 'SYNC_STATUS_FAILED' as any,
        message: 'Error al obtener el estado de sincronización',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Verify all modules are properly connected
   */
  async verifyIntegration(): Promise<Result<{
    services: Record<string, boolean>;
    managers: Record<string, boolean>;
  }>> {
    const results = {
      services: {} as Record<string, boolean>,
      managers: {} as Record<string, boolean>,
    };

    try {
      // Check services
      const notificationService = await getNotificationService();
      results.services.notification = notificationService !== null;

      const dataSyncService = await getDataSyncService();
      results.services.dataSync = dataSyncService !== null;

      const historyService = getHistoryService();
      results.services.history = historyService !== null;

      // Check managers
      const medicationManager = await getMedicationManager();
      results.managers.medication = medicationManager !== null;

      const fallPreventionManager = await getFallPreventionManager();
      results.managers.fallPrevention = fallPreventionManager !== null;

      const skinIntegrityManager = await getSkinIntegrityManager();
      results.managers.skinIntegrity = skinIntegrityManager !== null;

      const nutritionManager = await getNutritionManager();
      results.managers.nutrition = nutritionManager !== null;

      const incontinenceManager = await getIncontinenceManager();
      results.managers.incontinence = incontinenceManager !== null;

      const polypharmacyManager = await getPolypharmacyManager();
      results.managers.polypharmacy = polypharmacyManager !== null;

      const ethicalCareModule = await getEthicalCareModule();
      results.managers.ethicalCare = ethicalCareModule !== null;

      const patientManager = await getPatientManager();
      results.managers.patient = patientManager !== null;

      return Ok(results);
    } catch (error) {
      return Err({
        code: 'INTEGRATION_VERIFICATION_FAILED' as any,
        message: 'Error al verificar la integración',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup all services
   */
  cleanup(): void {
    this.eventListeners.clear();
    this.initialized = false;
  }
}

// Singleton instance
let integrationServiceInstance: IntegrationService | null = null;

/**
 * Get the singleton IntegrationService instance
 */
export async function getIntegrationService(): Promise<IntegrationService> {
  if (!integrationServiceInstance) {
    integrationServiceInstance = new IntegrationService();
    await integrationServiceInstance.initialize();
  }
  return integrationServiceInstance;
}

/**
 * Reset the IntegrationService instance (for testing)
 */
export function resetIntegrationService(): void {
  if (integrationServiceInstance) {
    integrationServiceInstance.cleanup();
  }
  integrationServiceInstance = null;
}
