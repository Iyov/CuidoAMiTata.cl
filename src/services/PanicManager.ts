/**
 * Panic Manager
 * Capa de lógica de negocio para gestión de eventos de pánico
 * Coordina el registro de eventos, recuperación de contactos y envío de notificaciones
 */

import { supabase } from '../config/supabase';
import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { PanicEvent, NotificationResult } from '../types/models';
import { getEmailService, type IEmailService } from './EmailService';
import { getFamilyService, type IFamilyService } from './FamilyService';

/**
 * Interfaz del manager de pánico
 */
export interface IPanicManager {
  triggerPanic(patientId: string, userId: string, familyId: string, location?: string, notes?: string): Promise<Result<PanicEvent>>;
  getPanicHistory(patientId: string): Promise<Result<PanicEvent[]>>;
  notifyFamilyMembers(panicEvent: PanicEvent): Promise<Result<NotificationResult[]>>;
}

/**
 * Convierte un registro de Supabase a PanicEvent
 */
function mapDBRowToPanicEvent(row: any): PanicEvent {
  return {
    id: row.id,
    patientId: row.patient_id,
    familyId: row.family_id,
    triggeredBy: row.triggered_by,
    location: row.location,
    notes: row.notes,
    triggeredAt: new Date(row.triggered_at),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Implementación del manager de pánico
 */
class PanicManager implements IPanicManager {
  private emailService: IEmailService;
  private familyService: IFamilyService;

  constructor(emailService?: IEmailService, familyService?: IFamilyService) {
    this.emailService = emailService || getEmailService();
    this.familyService = familyService || getFamilyService();
  }

  /**
   * Registra un evento de pánico y envía notificaciones
   */
  async triggerPanic(
    patientId: string,
    userId: string,
    familyId: string,
    location?: string,
    notes?: string
  ): Promise<Result<PanicEvent>> {
    try {
      // 1. Registrar evento en Supabase
      const { data: eventData, error: eventError } = await supabase
        .from('panic_events')
        .insert({
          patient_id: patientId,
          family_id: familyId,
          triggered_by: userId,
          location,
          notes,
          triggered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eventError || !eventData) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al registrar evento de pánico',
          details: eventError,
        });
      }

      const panicEvent = mapDBRowToPanicEvent(eventData);

      // 2. Enviar notificaciones a miembros de familia (en segundo plano)
      // No esperamos el resultado para dar feedback rápido al usuario
      this.notifyFamilyMembers(panicEvent).catch(error => {
        console.error('Error al enviar notificaciones de pánico:', error);
      });

      return Ok(panicEvent);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al registrar evento de pánico',
        details: error,
      });
    }
  }

  /**
   * Obtiene el historial de eventos de pánico de un paciente
   */
  async getPanicHistory(patientId: string): Promise<Result<PanicEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('panic_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('triggered_at', { ascending: false });

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener historial de pánico',
          details: error,
        });
      }

      const events = (data || []).map(mapDBRowToPanicEvent);
      return Ok(events);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener historial',
        details: error,
      });
    }
  }

  /**
   * Envía notificaciones a todos los miembros de la familia
   */
  async notifyFamilyMembers(panicEvent: PanicEvent): Promise<Result<NotificationResult[]>> {
    try {
      // 1. Obtener miembros de la familia
      const membersResult = await this.familyService.getFamilyMembers(panicEvent.familyId);
      if (!membersResult.ok) {
        return Err({
          code: ErrorCode.PANIC_NO_RECIPIENTS,
          message: 'No se pudieron obtener los contactos de la familia',
          details: membersResult.error,
        });
      }

      const members = membersResult.value;
      if (members.length === 0) {
        return Err({
          code: ErrorCode.PANIC_NO_RECIPIENTS,
          message: 'No hay contactos para enviar la alerta de emergencia',
        });
      }

      // 2. Extraer emails de los miembros
      const recipients = members.map(m => m.userEmail).filter(email => email && email.length > 0);

      if (recipients.length === 0) {
        return Err({
          code: ErrorCode.PANIC_NO_RECIPIENTS,
          message: 'No hay emails válidos para enviar la alerta',
        });
      }

      // 3. Enviar emails
      const emailResult = await this.emailService.sendPanicAlert(recipients, panicEvent);
      if (!emailResult.ok) {
        return Err(emailResult.error);
      }

      const emailResults = emailResult.value;

      // 4. Registrar estado de notificaciones en Supabase
      const notificationResults: NotificationResult[] = [];

      for (const emailResult of emailResults) {
        // Buscar el userId correspondiente al email
        const member = members.find(m => m.userEmail === emailResult.recipient);

        const { error: notifError } = await supabase
          .from('panic_notifications')
          .insert({
            panic_event_id: panicEvent.id,
            recipient_email: emailResult.recipient,
            recipient_user_id: member?.userId,
            status: emailResult.success ? 'sent' : 'failed',
            attempts: 3, // EmailService ya hizo los reintentos
            sent_at: emailResult.success ? new Date().toISOString() : null,
            error_message: emailResult.error,
          });

        if (notifError) {
          console.error('Error al registrar notificación:', notifError);
        }

        notificationResults.push({
          notificationId: '', // No necesitamos el ID aquí
          recipient: emailResult.recipient,
          status: emailResult.success ? 'sent' : 'failed',
          error: emailResult.error,
        });
      }

      return Ok(notificationResults);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al enviar notificaciones',
        details: error,
      });
    }
  }
}

// Instancia singleton del manager
let panicManagerInstance: PanicManager | null = null;

/**
 * Obtiene la instancia del manager de pánico
 */
export function getPanicManager(): IPanicManager {
  if (!panicManagerInstance) {
    panicManagerInstance = new PanicManager();
  }
  return panicManagerInstance;
}

/**
 * Resetea la instancia del manager (útil para testing)
 */
export function resetPanicManager(): void {
  panicManagerInstance = null;
}

export { PanicManager };
