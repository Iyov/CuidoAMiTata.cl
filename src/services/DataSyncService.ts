/**
 * Data Sync Service
 * Gestiona sincronización entre almacenamiento local y nube con soporte offline
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, ConnectionStatus, SyncStatus } from '../types/enums';
import type { CareEvent, SyncReport, SyncMetadata, Conflict } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

/**
 * Servicio de sincronización de datos con soporte offline
 */
export class DataSyncService {
  private connectionStatus: ConnectionStatus = ConnectionStatus.ONLINE;
  private syncInProgress: boolean = false;
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Inicializa el servicio de sincronización
   */
  async initialize(): Promise<Result<void>> {
    try {
      // Detectar estado de conexión inicial
      this.updateConnectionStatus();

      // Configurar listeners para cambios de conexión
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
      }

      // Iniciar verificación periódica de conexión
      this.startConnectionCheck();

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al inicializar el servicio de sincronización',
        details: error,
      });
    }
  }

  /**
   * Actualiza el estado de conexión
   */
  private updateConnectionStatus(): void {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.connectionStatus = navigator.onLine
        ? ConnectionStatus.ONLINE
        : ConnectionStatus.OFFLINE;
    }
  }

  /**
   * Maneja evento de conexión restaurada
   */
  private async handleOnline(): Promise<void> {
    this.connectionStatus = ConnectionStatus.ONLINE;
    console.log('Conexión restaurada - iniciando sincronización automática');

    // Sincronizar eventos pendientes automáticamente
    await this.syncPendingEvents();
  }

  /**
   * Maneja evento de pérdida de conexión
   */
  private handleOffline(): void {
    this.connectionStatus = ConnectionStatus.OFFLINE;
    console.log('Conexión perdida - modo offline activado');
  }

  /**
   * Inicia verificación periódica de conexión
   */
  private startConnectionCheck(): void {
    // Verificar conexión cada 30 segundos
    this.connectionCheckInterval = setInterval(() => {
      this.updateConnectionStatus();
    }, 30000);
  }

  /**
   * Obtiene el estado de conexión actual
   * 
   * @returns Estado de conexión (ONLINE o OFFLINE)
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Habilita modo offline explícitamente
   * 
   * @returns Result indicando éxito o error
   */
  enableOfflineMode(): Result<void> {
    try {
      this.connectionStatus = ConnectionStatus.OFFLINE;
      console.log('Modo offline habilitado manualmente');
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al habilitar modo offline',
        details: error,
      });
    }
  }

  /**
   * Encola un evento para sincronización
   * 
   * @param event - Evento de cuidado a encolar
   * @returns Result indicando éxito o error
   */
  async queueEventForSync(event: CareEvent): Promise<Result<void>> {
    try {
      // Marcar evento como pendiente de sincronización
      event.syncStatus = SyncStatus.PENDING;

      // Guardar evento en la cola de sincronización
      const queueItem = {
        id: undefined, // autoIncrement
        eventId: event.id,
        event: event,
        timestamp: new Date(),
        retryCount: 0,
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.SYNC_QUEUE, queueItem);

      // También actualizar el evento en su store correspondiente
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

      console.log(`Evento ${event.id} encolado para sincronización`);

      // Si estamos online, intentar sincronizar inmediatamente
      if (this.connectionStatus === ConnectionStatus.ONLINE && !this.syncInProgress) {
        // No esperar - sincronizar en background
        this.syncPendingEvents().catch((error) => {
          console.error('Error en sincronización automática:', error);
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al encolar evento para sincronización',
        details: error,
      });
    }
  }

  /**
   * Sincroniza eventos pendientes con el backend
   * 
   * @returns Result con reporte de sincronización
   */
  async syncPendingEvents(): Promise<Result<SyncReport>> {
    // Verificar si ya hay una sincronización en progreso
    if (this.syncInProgress) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Ya hay una sincronización en progreso',
      });
    }

    // Verificar conexión
    if (this.connectionStatus === ConnectionStatus.OFFLINE) {
      return Err({
        code: ErrorCode.NETWORK_OFFLINE,
        message: 'No hay conexión disponible para sincronizar',
      });
    }

    this.syncInProgress = true;

    try {
      // Obtener eventos pendientes de la cola
      const queueItems = await IndexedDBUtils.getAll<{
        id: number;
        eventId: string;
        event: CareEvent;
        timestamp: Date;
        retryCount: number;
      }>(IndexedDBUtils.STORES.SYNC_QUEUE);

      let syncedCount = 0;
      let failedCount = 0;
      let conflictCount = 0;

      // OPTIMIZACIÓN: Procesar eventos en lotes de 10 para mejor rendimiento
      const BATCH_SIZE = 10;
      for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
        const batch = queueItems.slice(i, i + BATCH_SIZE);
        
        // Procesar lote en paralelo
        const results = await Promise.allSettled(
          batch.map(async (item) => {
            try {
              // Simular llamada al backend
              const syncResult = await this.syncEventToBackend(item.event);

              if (syncResult.ok) {
                // Evento sincronizado exitosamente
                item.event.syncStatus = SyncStatus.SYNCED;
                await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, item.event);

                // Eliminar de la cola
                await IndexedDBUtils.deleteById(
                  IndexedDBUtils.STORES.SYNC_QUEUE,
                  item.id!.toString()
                );

                return { status: 'synced' as const };
              } else if (syncResult.error.code === ErrorCode.SYNC_CONFLICT) {
                // Conflicto detectado - resolver
                const conflict = syncResult.error.details as Conflict;
                const resolveResult = await this.resolveConflicts([conflict]);

                if (resolveResult.ok) {
                  // Conflicto resuelto
                  item.event.syncStatus = SyncStatus.SYNCED;
                  await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, item.event);
                  await IndexedDBUtils.deleteById(
                    IndexedDBUtils.STORES.SYNC_QUEUE,
                    item.id!.toString()
                  );
                  return { status: 'conflict' as const };
                } else {
                  return { status: 'failed' as const };
                }
              } else {
                // Error en sincronización
                item.retryCount++;

                // Si ha fallado muchas veces, marcar como conflicto
                if (item.retryCount >= 3) {
                  item.event.syncStatus = SyncStatus.CONFLICT;
                  await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, item.event);
                }

                // Actualizar item en la cola
                await IndexedDBUtils.put(IndexedDBUtils.STORES.SYNC_QUEUE, item);
                return { status: 'failed' as const };
              }
            } catch (error) {
              console.error(`Error sincronizando evento ${item.eventId}:`, error);
              return { status: 'failed' as const };
            }
          })
        );

        // Contar resultados del lote
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value.status === 'synced') syncedCount++;
            else if (result.value.status === 'conflict') conflictCount++;
            else failedCount++;
          } else {
            failedCount++;
          }
        });
      }

      // Actualizar metadatos de sincronización
      await this.updateSyncMetadata(syncedCount, failedCount, conflictCount);

      const report: SyncReport = {
        syncedEvents: syncedCount,
        failedEvents: failedCount,
        conflicts: conflictCount,
        timestamp: new Date(),
      };

      return Ok(report);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al sincronizar eventos pendientes',
        details: error,
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincroniza un evento individual con el backend
   * (Simulado - en producción sería una llamada HTTP real)
   */
  private async syncEventToBackend(event: CareEvent): Promise<Result<void>> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simular respuesta del backend
    // En producción, esto sería una llamada fetch/axios real
    try {
      // Simular verificación de conflictos
      const remoteEvent = await this.fetchRemoteEvent(event.id);

      if (remoteEvent) {
        // Verificar si hay conflicto
        const localTimestamp = new Date(event.timestamp).getTime();
        const remoteTimestamp = new Date(remoteEvent.timestamp).getTime();

        if (remoteTimestamp !== localTimestamp) {
          // Conflicto detectado
          const conflict: Conflict = {
            id: `conflict_${event.id}_${Date.now()}`,
            eventId: event.id,
            localVersion: event,
            remoteVersion: remoteEvent,
            resolution: 'PENDING',
          };

          return Err({
            code: ErrorCode.SYNC_CONFLICT,
            message: 'Conflicto de sincronización detectado',
            details: conflict,
          });
        }
      }

      // Simular éxito
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al sincronizar con el backend',
        details: error,
      });
    }
  }

  /**
   * Obtiene un evento del backend (simulado)
   */
  private async fetchRemoteEvent(eventId: string): Promise<CareEvent | null> {
    // En producción, esto sería una llamada HTTP real
    // Por ahora, retornamos null (no hay evento remoto)
    return null;
  }

  /**
   * Resuelve conflictos de sincronización
   * Estrategia: priorizar timestamp más reciente
   * 
   * @param conflicts - Array de conflictos a resolver
   * @returns Result indicando éxito o error
   */
  async resolveConflicts(conflicts: Conflict[]): Promise<Result<void>> {
    try {
      for (const conflict of conflicts) {
        // Aplicar estrategia de resolución: timestamp más reciente gana
        const localTimestamp = new Date(conflict.localVersion.timestamp).getTime();
        const remoteTimestamp = new Date(conflict.remoteVersion.timestamp).getTime();

        let resolvedVersion: CareEvent;
        let resolution: 'LOCAL_WINS' | 'REMOTE_WINS';

        if (localTimestamp > remoteTimestamp) {
          // Versión local es más reciente
          resolvedVersion = conflict.localVersion;
          resolution = 'LOCAL_WINS';
        } else if (remoteTimestamp > localTimestamp) {
          // Versión remota es más reciente
          resolvedVersion = conflict.remoteVersion;
          resolution = 'REMOTE_WINS';
        } else {
          // Timestamps idénticos - usar versión local por defecto
          resolvedVersion = conflict.localVersion;
          resolution = 'LOCAL_WINS';
        }

        // Actualizar conflicto con resolución
        conflict.resolvedVersion = resolvedVersion;
        conflict.resolution = resolution;
        conflict.resolvedAt = new Date();

        // Guardar versión resuelta
        resolvedVersion.syncStatus = SyncStatus.SYNCED;
        await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, resolvedVersion);

        console.log(
          `Conflicto resuelto para evento ${conflict.eventId}: ${resolution} (local: ${new Date(localTimestamp).toISOString()}, remote: ${new Date(remoteTimestamp).toISOString()})`
        );
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_CONFLICT,
        message: 'Error al resolver conflictos',
        details: error,
      });
    }
  }

  /**
   * Actualiza metadatos de sincronización
   */
  private async updateSyncMetadata(
    syncedCount: number,
    failedCount: number,
    conflictCount: number
  ): Promise<void> {
    try {
      const pendingCount = await IndexedDBUtils.count(IndexedDBUtils.STORES.SYNC_QUEUE);

      const metadata: SyncMetadata = {
        lastSyncTime: new Date(),
        pendingEvents: pendingCount,
        conflictCount: conflictCount,
        connectionStatus: this.connectionStatus,
        lastSuccessfulSync: syncedCount > 0 ? new Date() : await this.getLastSuccessfulSync(),
      };

      // Guardar metadatos
      await IndexedDBUtils.put(IndexedDBUtils.STORES.ENCRYPTED_DATA, {
        id: 'sync_metadata',
        encrypted: JSON.stringify(metadata),
        iv: '',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al actualizar metadatos de sincronización:', error);
    }
  }

  /**
   * Obtiene la fecha de la última sincronización exitosa
   */
  private async getLastSuccessfulSync(): Promise<Date> {
    try {
      const metadataRecord = await IndexedDBUtils.getById<{
        id: string;
        encrypted: string;
        iv: string;
        timestamp: string;
      }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, 'sync_metadata');

      if (metadataRecord) {
        const metadata = JSON.parse(metadataRecord.encrypted) as SyncMetadata;
        return new Date(metadata.lastSuccessfulSync);
      }
    } catch (error) {
      console.error('Error al obtener última sincronización:', error);
    }

    // Si no hay registro, retornar fecha actual
    return new Date();
  }

  /**
   * Obtiene metadatos de sincronización
   */
  async getSyncMetadata(): Promise<Result<SyncMetadata>> {
    try {
      const metadataRecord = await IndexedDBUtils.getById<{
        id: string;
        encrypted: string;
        iv: string;
        timestamp: string;
      }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, 'sync_metadata');

      if (metadataRecord) {
        const metadata = JSON.parse(metadataRecord.encrypted) as SyncMetadata;
        return Ok(metadata);
      }

      // Si no hay metadatos, crear unos por defecto
      const defaultMetadata: SyncMetadata = {
        lastSyncTime: new Date(),
        pendingEvents: await IndexedDBUtils.count(IndexedDBUtils.STORES.SYNC_QUEUE),
        conflictCount: 0,
        connectionStatus: this.connectionStatus,
        lastSuccessfulSync: new Date(),
      };

      return Ok(defaultMetadata);
    } catch (error) {
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al obtener metadatos de sincronización',
        details: error,
      });
    }
  }

  /**
   * Limpia recursos del servicio
   */
  cleanup(): void {
    // Limpiar interval de verificación de conexión
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    // Remover event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnline());
      window.removeEventListener('offline', () => this.handleOffline());
    }
  }
}

// Instancia singleton del servicio
let dataSyncServiceInstance: DataSyncService | null = null;

/**
 * Obtiene la instancia singleton del DataSyncService
 */
export async function getDataSyncService(): Promise<DataSyncService> {
  if (!dataSyncServiceInstance) {
    dataSyncServiceInstance = new DataSyncService();
    const result = await dataSyncServiceInstance.initialize();
    if (!result.ok) {
      throw new Error('Failed to initialize DataSyncService');
    }
  }
  return dataSyncServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetDataSyncService(): void {
  if (dataSyncServiceInstance) {
    dataSyncServiceInstance.cleanup();
  }
  dataSyncServiceInstance = null;
}
