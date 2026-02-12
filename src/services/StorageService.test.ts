/**
 * Unit tests for StorageService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService, getStorageService, resetStorageService } from './StorageService';
import { ErrorCode } from '../types/enums';
import { isOk, isErr } from '../types/result';
import * as IndexedDBUtils from '../utils/indexedDB';
import * as LocalStorageUtils from '../utils/localStorage';
import * as fc from 'fast-check';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    // Limpiar estado antes de cada prueba
    resetStorageService();
    LocalStorageUtils.clear();
    
    // Limpiar stores de IndexedDB
    try {
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.ENCRYPTED_DATA);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.PATIENTS);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.MEDICATIONS);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
    } catch (error) {
      // Ignorar errores si los stores no existen aún
    }

    service = await getStorageService();
  });

  afterEach(() => {
    resetStorageService();
  });

  describe('initialize', () => {
    it('debe inicializar correctamente el servicio', async () => {
      const newService = new StorageService();
      const result = await newService.initialize();
      
      expect(isOk(result)).toBe(true);
    });

    it('debe generar y almacenar una clave de cifrado', async () => {
      const newService = new StorageService();
      await newService.initialize();
      
      const storedKey = LocalStorageUtils.getItem<string>('encryption_key_wrapped');
      expect(storedKey).not.toBeNull();
      expect(typeof storedKey).toBe('string');
    });

    it('debe reutilizar clave existente en inicializaciones subsecuentes', async () => {
      const service1 = new StorageService();
      await service1.initialize();
      const key1 = LocalStorageUtils.getItem<string>('encryption_key_wrapped');

      const service2 = new StorageService();
      await service2.initialize();
      const key2 = LocalStorageUtils.getItem<string>('encryption_key_wrapped');

      expect(key1).toBe(key2);
    });
  });

  describe('saveEncrypted y loadEncrypted', () => {
    it('debe cifrar y guardar datos correctamente', async () => {
      const testData = { name: 'Juan Pérez', age: 75, condition: 'diabetes' };
      const result = await service.saveEncrypted('test_patient', testData);
      
      expect(isOk(result)).toBe(true);
    });

    it('debe descifrar y cargar datos correctamente', async () => {
      const testData = { name: 'María García', age: 82, medications: ['aspirina', 'metformina'] };
      
      await service.saveEncrypted('test_patient_2', testData);
      const loadResult = await service.loadEncrypted<typeof testData>('test_patient_2');
      
      expect(isOk(loadResult)).toBe(true);
      if (isOk(loadResult)) {
        expect(loadResult.value).toEqual(testData);
      }
    });

    it('debe manejar datos complejos con objetos anidados', async () => {
      const complexData = {
        patient: {
          id: 'p123',
          name: 'Pedro López',
          medications: [
            { name: 'Aspirina', dosage: '100mg', schedule: { times: ['08:00', '20:00'] } },
            { name: 'Metformina', dosage: '500mg', schedule: { times: ['12:00'] } },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      await service.saveEncrypted('complex_data', complexData);
      const loadResult = await service.loadEncrypted<typeof complexData>('complex_data');
      
      expect(isOk(loadResult)).toBe(true);
      if (isOk(loadResult)) {
        expect(loadResult.value).toEqual(complexData);
      }
    });

    it('debe retornar error al cargar datos inexistentes', async () => {
      const result = await service.loadEncrypted('nonexistent_key');
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe cifrar datos de forma diferente en cada guardado', async () => {
      const testData = { secret: 'información sensible' };
      
      await service.saveEncrypted('test_1', testData);
      const encrypted1 = await IndexedDBUtils.getById<{ encrypted: string; iv: string }>(
        IndexedDBUtils.STORES.ENCRYPTED_DATA,
        'test_1'
      );

      await service.saveEncrypted('test_2', testData);
      const encrypted2 = await IndexedDBUtils.getById<{ encrypted: string; iv: string }>(
        IndexedDBUtils.STORES.ENCRYPTED_DATA,
        'test_2'
      );

      // Los datos cifrados deben ser diferentes debido a IVs aleatorios
      expect(encrypted1?.encrypted).not.toBe(encrypted2?.encrypted);
      expect(encrypted1?.iv).not.toBe(encrypted2?.iv);
    });
  });

  describe('savePreference y loadPreference', () => {
    it('debe guardar preferencias correctamente', () => {
      const result = service.savePreference('theme', 'DARK');
      
      expect(isOk(result)).toBe(true);
    });

    it('debe cargar preferencias correctamente', () => {
      service.savePreference('language', 'es');
      const result = service.loadPreference<string>('language');
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('es');
      }
    });

    it('debe manejar preferencias complejas', () => {
      const preferences = {
        theme: 'DARK',
        notifications: {
          enableSound: true,
          enableVibration: false,
        },
        autoLogoutMinutes: 15,
      };

      service.savePreference('user_preferences', preferences);
      const result = service.loadPreference<typeof preferences>('user_preferences');
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual(preferences);
      }
    });

    it('debe retornar null para preferencias inexistentes', () => {
      const result = service.loadPreference('nonexistent_pref');
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('clearPatientData', () => {
    it('debe eliminar todos los datos de un paciente', async () => {
      const patientId = 'patient_123';

      // Crear datos del paciente
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PATIENTS, {
        id: patientId,
        name: 'Test Patient',
        createdAt: new Date(),
      });

      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, {
        id: 'med_1',
        patientId: patientId,
        name: 'Aspirina',
        dosage: '100mg',
      });

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, {
        id: 'event_1',
        patientId: patientId,
        eventType: 'MEDICATION',
        timestamp: new Date(),
      });

      await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, {
        id: 'notif_1',
        patientId: patientId,
        message: 'Test notification',
      });

      await service.saveEncrypted(`patient_${patientId}`, { sensitive: 'data' });

      // Eliminar datos del paciente
      const result = await service.clearPatientData(patientId);
      
      expect(isOk(result)).toBe(true);

      // Verificar que los datos fueron eliminados
      const patient = await IndexedDBUtils.getById(IndexedDBUtils.STORES.PATIENTS, patientId);
      expect(patient).toBeUndefined();

      const medications = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.MEDICATIONS,
        'patientId',
        patientId
      );
      expect(medications).toHaveLength(0);

      const careEvents = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.CARE_EVENTS,
        'patientId',
        patientId
      );
      expect(careEvents).toHaveLength(0);

      const notifications = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.NOTIFICATIONS,
        'patientId',
        patientId
      );
      expect(notifications).toHaveLength(0);

      const encryptedData = await IndexedDBUtils.getById(
        IndexedDBUtils.STORES.ENCRYPTED_DATA,
        `patient_${patientId}`
      );
      expect(encryptedData).toBeUndefined();
    });

    it('debe manejar eliminación de paciente sin datos', async () => {
      const result = await service.clearPatientData('nonexistent_patient');
      
      // No debe fallar aunque el paciente no exista
      expect(isOk(result)).toBe(true);
    });

    it('debe eliminar solo datos del paciente especificado', async () => {
      const patient1Id = 'patient_1';
      const patient2Id = 'patient_2';

      // Crear datos para dos pacientes
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PATIENTS, {
        id: patient1Id,
        name: 'Patient 1',
      });
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PATIENTS, {
        id: patient2Id,
        name: 'Patient 2',
      });

      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, {
        id: 'med_1',
        patientId: patient1Id,
        name: 'Med 1',
      });
      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, {
        id: 'med_2',
        patientId: patient2Id,
        name: 'Med 2',
      });

      // Eliminar solo patient1
      await service.clearPatientData(patient1Id);

      // Verificar que patient1 fue eliminado
      const patient1 = await IndexedDBUtils.getById(IndexedDBUtils.STORES.PATIENTS, patient1Id);
      expect(patient1).toBeUndefined();

      const patient1Meds = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.MEDICATIONS,
        'patientId',
        patient1Id
      );
      expect(patient1Meds).toHaveLength(0);

      // Verificar que patient2 sigue existiendo
      const patient2 = await IndexedDBUtils.getById(IndexedDBUtils.STORES.PATIENTS, patient2Id);
      expect(patient2).toBeDefined();

      const patient2Meds = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.MEDICATIONS,
        'patientId',
        patient2Id
      );
      expect(patient2Meds).toHaveLength(1);
    });
  });

  describe('getStorageService singleton', () => {
    it('debe retornar la misma instancia en llamadas múltiples', async () => {
      const instance1 = await getStorageService();
      const instance2 = await getStorageService();
      
      expect(instance1).toBe(instance2);
    });

    it('debe crear nueva instancia después de reset', async () => {
      const instance1 = await getStorageService();
      resetStorageService();
      const instance2 = await getStorageService();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 32: Cifrado de datos sensibles', () => {
      it('debe cifrar cualquier dato sensible usando AES-256 antes de persistirlo', async () => {
        // Feature: cuido-a-mi-tata, Property 32: Cifrado de datos sensibles
        // Valida: Requisitos 12.3
        
        await fc.assert(
          fc.asyncProperty(
            // Generador de datos sensibles arbitrarios
            fc.record({
              patientName: fc.string({ minLength: 5, maxLength: 100 }),
              age: fc.integer({ min: 60, max: 120 }),
              medicalConditions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 10 }),
              medications: fc.array(
                fc.record({
                  name: fc.string({ minLength: 5, maxLength: 50 }),
                  dosage: fc.string({ minLength: 3, maxLength: 20 }),
                }),
                { maxLength: 15 }
              ),
              personalInfo: fc.record({
                address: fc.string({ minLength: 10, maxLength: 100 }),
                phone: fc.string({ minLength: 8, maxLength: 20 }),
                emergencyContact: fc.string({ minLength: 10, maxLength: 100 }),
              }),
            }),
            fc.string({ minLength: 5, maxLength: 50 }), // key
            async (sensitiveData, key) => {
              // Guardar datos sensibles
              const saveResult = await service.saveEncrypted(key, sensitiveData);
              expect(isOk(saveResult)).toBe(true);

              // Verificar que los datos están cifrados en IndexedDB
              const storedData = await IndexedDBUtils.getById<{
                id: string;
                encrypted: string;
                iv: string;
                timestamp: string;
              }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, key);

              // Los datos deben existir
              expect(storedData).toBeDefined();
              expect(storedData?.encrypted).toBeDefined();
              expect(storedData?.iv).toBeDefined();

              // Los datos cifrados deben ser una cadena Base64 válida
              expect(storedData?.encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
              expect(storedData?.iv).toMatch(/^[A-Za-z0-9+/]+=*$/);

              // El texto cifrado debe ser diferente del texto plano serializado
              const serializedOriginal = JSON.stringify(sensitiveData);
              expect(storedData?.encrypted).not.toBe(serializedOriginal);
              
              // Decodificar Base64 para verificar que no contiene texto plano
              const decodedEncrypted = atob(storedData?.encrypted || '');
              
              // Los datos cifrados NO deben contener cadenas largas del texto plano original
              // (cadenas cortas como "/" pueden aparecer por coincidencia en datos binarios)
              if (sensitiveData.patientName.length >= 5) {
                expect(decodedEncrypted).not.toContain(sensitiveData.patientName);
              }
              if (sensitiveData.personalInfo.address.length >= 10) {
                expect(decodedEncrypted).not.toContain(sensitiveData.personalInfo.address);
              }
              if (sensitiveData.personalInfo.emergencyContact.length >= 10) {
                expect(decodedEncrypted).not.toContain(sensitiveData.personalInfo.emergencyContact);
              }

              // Verificar que los datos pueden ser descifrados correctamente
              const loadResult = await service.loadEncrypted<typeof sensitiveData>(key);
              expect(isOk(loadResult)).toBe(true);
              
              if (isOk(loadResult)) {
                // Los datos descifrados deben ser idénticos a los originales
                expect(loadResult.value).toEqual(sensitiveData);
              }

              // Limpiar después de la prueba
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.ENCRYPTED_DATA, key);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe usar IVs únicos para cada operación de cifrado', async () => {
        // Verifica que el mismo dato cifrado múltiples veces produce diferentes textos cifrados
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              secret: fc.string({ minLength: 1, maxLength: 100 }),
              value: fc.integer(),
            }),
            async (data) => {
              const key1 = `test_iv_1_${Date.now()}_${Math.random()}`;
              const key2 = `test_iv_2_${Date.now()}_${Math.random()}`;

              // Cifrar los mismos datos dos veces
              await service.saveEncrypted(key1, data);
              await service.saveEncrypted(key2, data);

              // Obtener los datos cifrados
              const encrypted1 = await IndexedDBUtils.getById<{
                encrypted: string;
                iv: string;
              }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, key1);

              const encrypted2 = await IndexedDBUtils.getById<{
                encrypted: string;
                iv: string;
              }>(IndexedDBUtils.STORES.ENCRYPTED_DATA, key2);

              // Los IVs deben ser diferentes
              expect(encrypted1?.iv).not.toBe(encrypted2?.iv);
              
              // Los textos cifrados deben ser diferentes
              expect(encrypted1?.encrypted).not.toBe(encrypted2?.encrypted);

              // Pero ambos deben descifrar al mismo valor original
              const load1 = await service.loadEncrypted<typeof data>(key1);
              const load2 = await service.loadEncrypted<typeof data>(key2);

              expect(isOk(load1)).toBe(true);
              expect(isOk(load2)).toBe(true);

              if (isOk(load1) && isOk(load2)) {
                expect(load1.value).toEqual(data);
                expect(load2.value).toEqual(data);
              }

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.ENCRYPTED_DATA, key1);
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.ENCRYPTED_DATA, key2);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe mantener la integridad de datos complejos después del cifrado/descifrado', async () => {
        // Verifica que estructuras de datos complejas se preservan correctamente
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              patient: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                dateOfBirth: fc.date({ min: new Date('1900-01-01'), max: new Date('1970-01-01') }).map(d => d.toISOString()),
                riskFactors: fc.array(
                  fc.record({
                    type: fc.constantFrom('SEDATIVES', 'COGNITIVE_IMPAIRMENT', 'VISION_PROBLEMS', 'MOBILITY_ISSUES'),
                    severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
                    notes: fc.string({ maxLength: 200 }),
                  }),
                  { maxLength: 5 }
                ),
              }),
              medications: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                  dosage: fc.string({ minLength: 1, maxLength: 20 }),
                  schedule: fc.record({
                    times: fc.array(fc.string({ minLength: 5, maxLength: 5 }), { minLength: 1, maxLength: 4 }),
                    frequency: fc.constantFrom('DAILY', 'WEEKLY', 'AS_NEEDED'),
                  }),
                }),
                { maxLength: 10 }
              ),
              timestamp: fc.date().map(d => d.toISOString()),
            }),
            fc.string({ minLength: 1, maxLength: 50 }),
            async (complexData, key) => {
              // Guardar datos complejos cifrados
              const saveResult = await service.saveEncrypted(key, complexData);
              expect(isOk(saveResult)).toBe(true);

              // Cargar y verificar integridad completa
              const loadResult = await service.loadEncrypted<typeof complexData>(key);
              expect(isOk(loadResult)).toBe(true);

              if (isOk(loadResult)) {
                // Verificar estructura completa
                expect(loadResult.value).toEqual(complexData);
                expect(loadResult.value.patient.id).toBe(complexData.patient.id);
                expect(loadResult.value.patient.name).toBe(complexData.patient.name);
                expect(loadResult.value.patient.riskFactors).toEqual(complexData.patient.riskFactors);
                expect(loadResult.value.medications).toEqual(complexData.medications);
                expect(loadResult.value.timestamp).toBe(complexData.timestamp);
              }

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.ENCRYPTED_DATA, key);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
