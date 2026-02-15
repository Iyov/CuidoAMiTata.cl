/**
 * Polypharmacy Manager
 * Gestiona hoja de medicamentos, stock, caducidad y disposición segura
 * 
 * TODO: Implementar filtrado por familia cuando se migre a Supabase
 * Actualmente usa IndexedDB local. Para soporte multi-familiar completo,
 * se necesita migrar a Supabase con políticas RLS.
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type {
  Medication,
  MedicationDetails,
  MedicationUpdate,
  StockAlert,
  ExpirationAlert,
  SIGREPoint,
  Location,
} from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getValidationService } from './ValidationService';

/**
 * Gestor de polifarmacia con gestión de medicamentos
 */
export class PolypharmacyManager {
  // Umbral de stock bajo (días de suministro)
  private readonly LOW_STOCK_THRESHOLD = 7;
  
  // Días antes de caducidad para alertar
  private readonly EXPIRATION_WARNING_DAYS = 30;

  /**
   * Agrega un nuevo medicamento
   * 
   * @param patientId - ID del paciente
   * @param details - Detalles del medicamento
   * @returns Result con el medicamento creado o error
   */
  async addMedication(
    patientId: string,
    details: MedicationDetails
  ): Promise<Result<Medication>> {
    try {
      const validationService = getValidationService();

      // Validar campos requeridos
      const nameValidation = validationService.validateRequiredField(details.name, 'nombre');
      if (!nameValidation.isValid) {
        return Err({
          code: nameValidation.errorCode!,
          message: nameValidation.message!,
        });
      }

      const dosageValidation = validationService.validateRequiredField(details.dosage, 'dosis');
      if (!dosageValidation.isValid) {
        return Err({
          code: dosageValidation.errorCode!,
          message: dosageValidation.message!,
        });
      }

      const purposeValidation = validationService.validateRequiredField(
        details.purpose,
        'propósito'
      );
      if (!purposeValidation.isValid) {
        return Err({
          code: purposeValidation.errorCode!,
          message: purposeValidation.message!,
        });
      }

      // Crear medicamento
      const medication: Medication = {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        name: details.name,
        dosage: details.dosage,
        purpose: details.purpose,
        schedule: details.schedule,
        stockLevel: details.stockLevel,
        expirationDate: details.expirationDate,
        isActive: true,
        createdAt: new Date(),
      };

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, medication);

      return Ok(medication);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al agregar medicamento',
        details: error,
      });
    }
  }

  /**
   * Actualiza la hoja de medicamentos
   * 
   * @param updates - Array de actualizaciones a aplicar
   * @returns Result indicando éxito o error
   */
  async updateMedicationSheet(updates: MedicationUpdate[]): Promise<Result<void>> {
    try {
      for (const update of updates) {
        // Obtener medicamento actual
        const medication = await IndexedDBUtils.getById<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          update.medicationId
        );

        if (!medication) {
          return Err({
            code: ErrorCode.VALIDATION_REQUIRED_FIELD,
            message: `Medicamento con ID ${update.medicationId} no encontrado`,
          });
        }

        // Aplicar actualización
        (medication as any)[update.field] = update.value;

        // Guardar cambios
        await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, medication);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al actualizar hoja de medicamentos',
        details: error,
      });
    }
  }

  /**
   * Exporta la hoja de medicamentos a formato PDF
   * Requisito 6.2: Exportar hoja con nombre, dosis y propósito
   * 
   * @param patientId - ID del paciente
   * @returns Result con el documento PDF o error
   */
  async exportToPDF(patientId: string): Promise<Result<Blob>> {
    try {
      // Obtener medicamentos del paciente
      const medications = await IndexedDBUtils.getByIndex<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS,
        'patientId',
        patientId
      );

      // Filtrar solo medicamentos activos
      const activeMedications = medications.filter((m) => m.isActive);

      // Crear contenido HTML para el PDF
      const htmlContent = this.generatePDFContent(activeMedications, patientId);

      // Convertir HTML a PDF usando una biblioteca simple
      // En producción, usar jsPDF o similar
      const pdfBlob = this.htmlToPDF(htmlContent);

      return Ok(pdfBlob);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_EXPORT_FAILED,
        message: 'Error al exportar hoja de medicamentos a PDF',
        details: error,
      });
    }
  }

  /**
   * Genera el contenido HTML para el PDF
   */
  private generatePDFContent(medications: Medication[], patientId: string): string {
    const now = new Date().toLocaleString('es-ES');
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hoja de Medicamentos</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Hoja de Medicamentos</h1>
  <p><strong>Paciente:</strong> ${patientId}</p>
  <p><strong>Generado:</strong> ${now}</p>
  
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Dosis</th>
        <th>Propósito</th>
        <th>Stock</th>
        <th>Caducidad</th>
      </tr>
    </thead>
    <tbody>
`;

    if (medications.length === 0) {
      html += `
      <tr>
        <td colspan="5" style="text-align: center;">No hay medicamentos registrados</td>
      </tr>
`;
    } else {
      for (const med of medications) {
        const expirationDate = new Date(med.expirationDate).toLocaleDateString('es-ES');
        html += `
      <tr>
        <td>${med.name}</td>
        <td>${med.dosage}</td>
        <td>${med.purpose}</td>
        <td>${med.stockLevel}</td>
        <td>${expirationDate}</td>
      </tr>
`;
      }
    }

    html += `
    </tbody>
  </table>
  
  <div class="footer">
    <p>Este documento fue generado por CuidoAMiTata para uso en servicios de emergencia.</p>
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Convierte HTML a PDF (implementación simplificada)
   * En producción, usar jsPDF o similar
   */
  private htmlToPDF(html: string): Blob {
    // Por ahora, devolver el HTML como blob
    // En producción, usar una biblioteca de PDF real
    return new Blob([html], { type: 'application/pdf' });
  }

  /**
   * Verifica niveles de stock y genera alertas
   * Requisito 6.3: Alertas de stock bajo
   * 
   * @param patientId - ID del paciente (opcional)
   * @returns Array de alertas de stock bajo
   */
  async checkStockLevels(patientId?: string): Promise<StockAlert[]> {
    try {
      let medications: Medication[];

      if (patientId) {
        medications = await IndexedDBUtils.getByIndex<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          'patientId',
          patientId
        );
      } else {
        medications = await IndexedDBUtils.getAll<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS
        );
      }

      // Filtrar medicamentos activos con stock bajo
      const alerts: StockAlert[] = [];

      for (const med of medications) {
        if (med.isActive && med.stockLevel <= this.LOW_STOCK_THRESHOLD) {
          alerts.push({
            medicationId: med.id,
            medicationName: med.name,
            currentStock: med.stockLevel,
            threshold: this.LOW_STOCK_THRESHOLD,
            message: `Stock bajo de ${med.name}: ${med.stockLevel} dosis restantes. Reabastecer pronto.`,
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error al verificar niveles de stock:', error);
      return [];
    }
  }

  /**
   * Verifica fechas de caducidad y genera alertas
   * Requisito 6.4: Alertas de caducidad próxima
   * 
   * @param patientId - ID del paciente (opcional)
   * @returns Array de alertas de caducidad
   */
  async checkExpirationDates(patientId?: string): Promise<ExpirationAlert[]> {
    try {
      let medications: Medication[];

      if (patientId) {
        medications = await IndexedDBUtils.getByIndex<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          'patientId',
          patientId
        );
      } else {
        medications = await IndexedDBUtils.getAll<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS
        );
      }

      // Filtrar medicamentos activos con caducidad próxima
      const alerts: ExpirationAlert[] = [];
      const now = new Date();

      for (const med of medications) {
        if (med.isActive) {
          const expirationDate = new Date(med.expirationDate);
          const daysUntilExpiration = Math.floor(
            (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiration <= this.EXPIRATION_WARNING_DAYS && daysUntilExpiration >= 0) {
            alerts.push({
              medicationId: med.id,
              medicationName: med.name,
              expirationDate: expirationDate,
              daysUntilExpiration,
              message: `${med.name} caduca en ${daysUntilExpiration} días (${expirationDate.toLocaleDateString('es-ES')})`,
            });
          } else if (daysUntilExpiration < 0) {
            alerts.push({
              medicationId: med.id,
              medicationName: med.name,
              expirationDate: expirationDate,
              daysUntilExpiration,
              message: `¡ATENCIÓN! ${med.name} caducó hace ${Math.abs(daysUntilExpiration)} días`,
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error al verificar fechas de caducidad:', error);
      return [];
    }
  }

  /**
   * Encuentra los puntos SIGRE más cercanos
   * Requisito 6.5: Mapa de puntos SIGRE para disposición
   * 
   * @param location - Ubicación del usuario
   * @param maxResults - Número máximo de resultados (default: 5)
   * @returns Array de puntos SIGRE ordenados por distancia
   */
  async findNearestSIGREPoint(
    location: Location,
    maxResults: number = 5
  ): Promise<SIGREPoint[]> {
    try {
      // En producción, esto haría una llamada a una API real de SIGRE
      // Por ahora, devolver datos de ejemplo
      const mockSIGREPoints: SIGREPoint[] = [
        {
          id: 'sigre-1',
          name: 'Farmacia Cruz Verde - Centro',
          address: 'Av. Libertador Bernardo O\'Higgins 1234, Santiago',
          location: {
            latitude: -33.4489,
            longitude: -70.6693,
          },
        },
        {
          id: 'sigre-2',
          name: 'Farmacia Salcobrand - Providencia',
          address: 'Av. Providencia 2345, Providencia',
          location: {
            latitude: -33.4250,
            longitude: -70.6100,
          },
        },
        {
          id: 'sigre-3',
          name: 'Farmacia Ahumada - Las Condes',
          address: 'Av. Apoquindo 3456, Las Condes',
          location: {
            latitude: -33.4100,
            longitude: -70.5800,
          },
        },
        {
          id: 'sigre-4',
          name: 'Farmacia Cruz Verde - Ñuñoa',
          address: 'Av. Irarrázaval 4567, Ñuñoa',
          location: {
            latitude: -33.4550,
            longitude: -70.6000,
          },
        },
        {
          id: 'sigre-5',
          name: 'Farmacia Salcobrand - Maipú',
          address: 'Av. Pajaritos 5678, Maipú',
          location: {
            latitude: -33.5100,
            longitude: -70.7600,
          },
        },
      ];

      // Calcular distancias
      const pointsWithDistance = mockSIGREPoints.map((point) => ({
        ...point,
        distance: this.calculateDistance(location, point.location),
      }));

      // Ordenar por distancia y limitar resultados
      pointsWithDistance.sort((a, b) => a.distance! - b.distance!);

      return pointsWithDistance.slice(0, maxResults);
    } catch (error) {
      console.error('Error al buscar puntos SIGRE:', error);
      return [];
    }
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * 
   * @param point1 - Primera ubicación
   * @param point2 - Segunda ubicación
   * @returns Distancia en kilómetros
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Instancia singleton del servicio
let polypharmacyManagerInstance: PolypharmacyManager | null = null;

/**
 * Obtiene la instancia singleton del PolypharmacyManager
 */
export function getPolypharmacyManager(): PolypharmacyManager {
  if (!polypharmacyManagerInstance) {
    polypharmacyManagerInstance = new PolypharmacyManager();
  }
  return polypharmacyManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetPolypharmacyManager(): void {
  polypharmacyManagerInstance = null;
}
