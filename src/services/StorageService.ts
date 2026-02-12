/**
 * Storage Service con cifrado AES-256
 * Gestiona persistencia de datos sensibles con cifrado y preferencias de usuario
 */

import { Result, Ok, Err, AppError } from '../types/result';
import { ErrorCode } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';
import * as LocalStorageUtils from '../utils/localStorage';

/**
 * Servicio de almacenamiento con cifrado
 */
export class StorageService {
  private encryptionKey: CryptoKey | null = null;

  /**
   * Inicializa el servicio y genera/recupera la clave de cifrado
   */
  async initialize(): Promise<Result<void>> {
    try {
      // Intentar recuperar clave existente o generar una nueva
      const storedKey = LocalStorageUtils.getItem<string>('encryption_key_wrapped');
      
      if (storedKey) {
        // Recuperar clave existente (en producción, esto debería usar derivación de contraseña)
        this.encryptionKey = await this.unwrapKey(storedKey);
      } else {
        // Generar nueva clave
        this.encryptionKey = await this.generateKey();
        const wrappedKey = await this.wrapKey(this.encryptionKey);
        LocalStorageUtils.setItem('encryption_key_wrapped', wrappedKey);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_ENCRYPTION_FAILED,
        message: 'Error al inicializar el servicio de almacenamiento',
        details: error,
      });
    }
  }

  /**
   * Genera una clave de cifrado AES-256
   */
  private async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Envuelve la clave para almacenamiento
   */
  private async wrapKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Desenvuelve la clave desde almacenamiento
   */
  private async unwrapKey(wrappedKey: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(wrappedKey);
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra datos usando AES-256-GCM
   */
  private async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Generar IV aleatorio
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Cifrar datos
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      encodedData
    );

    return {
      encrypted: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Descifra datos usando AES-256-GCM
   */
  private async decrypt(encrypted: string, iv: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encryptedData = this.base64ToArrayBuffer(encrypted);
    const ivData = this.base64ToArrayBuffer(iv);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivData,
      },
      this.encryptionKey,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Convierte ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convierte Base64 a ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Guarda datos cifrados en IndexedDB
   */
  async saveEncrypted(key: string, data: unknown): Promise<Result<void>> {
    try {
      // Serializar datos
      const serialized = JSON.stringify(data);

      // Cifrar
      const { encrypted, iv } = await this.encrypt(serialized);

      // Guardar en IndexedDB
      const encryptedData = {
        id: key,
        encrypted,
        iv,
        timestamp: new Date().toISOString(),
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.ENCRYPTED_DATA, encryptedData);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_ENCRYPTION_FAILED,
        message: 'Error al guardar datos cifrados',
        details: error,
      });
    }
  }

  /**
   * Carga datos cifrados desde IndexedDB
   */
  async loadEncrypted<T>(key: string): Promise<Result<T>> {
    try {
      // Recuperar datos cifrados
      const encryptedData = await IndexedDBUtils.getById<{
        id: string;
        encrypted: string;
        iv: string;
        timestamp: string;
      }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, key);

      if (!encryptedData) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `No se encontraron datos para la clave: ${key}`,
        });
      }

      // Descifrar
      const decrypted = await this.decrypt(encryptedData.encrypted, encryptedData.iv);

      // Deserializar
      const data = JSON.parse(decrypted) as T;

      return Ok(data);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_ENCRYPTION_FAILED,
        message: 'Error al cargar datos cifrados',
        details: error,
      });
    }
  }

  /**
   * Guarda una preferencia de usuario en LocalStorage
   */
  savePreference(key: string, value: unknown): Result<void> {
    try {
      LocalStorageUtils.setItem(key, value);
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al guardar preferencia',
        details: error,
      });
    }
  }

  /**
   * Carga una preferencia de usuario desde LocalStorage
   */
  loadPreference<T>(key: string): Result<T | null> {
    try {
      const value = LocalStorageUtils.getItem<T>(key);
      return Ok(value);
    } catch (error) {
      return Err({
        code: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'Error al cargar preferencia',
        details: error,
      });
    }
  }

  /**
   * Elimina todos los datos de un paciente específico
   */
  async clearPatientData(patientId: string): Promise<Result<void>> {
    try {
      // Eliminar datos cifrados del paciente
      const encryptedDataKey = `patient_${patientId}`;
      await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.ENCRYPTED_DATA, encryptedDataKey);

      // Eliminar medicamentos del paciente
      const medications = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.MEDICATIONS,
        'patientId',
        patientId
      );
      for (const med of medications) {
        await IndexedDBUtils.deleteById(
          IndexedDBUtils.STORES.MEDICATIONS,
          (med as { id: string }).id
        );
      }

      // Eliminar eventos de cuidado del paciente
      const careEvents = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.CARE_EVENTS,
        'patientId',
        patientId
      );
      for (const event of careEvents) {
        await IndexedDBUtils.deleteById(
          IndexedDBUtils.STORES.CARE_EVENTS,
          (event as { id: string }).id
        );
      }

      // Eliminar notificaciones del paciente
      const notifications = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.NOTIFICATIONS,
        'patientId',
        patientId
      );
      for (const notification of notifications) {
        await IndexedDBUtils.deleteById(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          (notification as { id: string }).id
        );
      }

      // Eliminar el paciente
      await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.PATIENTS, patientId);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al eliminar datos del paciente',
        details: error,
      });
    }
  }
}

// Instancia singleton del servicio
let storageServiceInstance: StorageService | null = null;

/**
 * Obtiene la instancia singleton del StorageService
 */
export async function getStorageService(): Promise<StorageService> {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
    const result = await storageServiceInstance.initialize();
    if (!result.ok) {
      throw new Error('Failed to initialize StorageService');
    }
  }
  return storageServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
}
