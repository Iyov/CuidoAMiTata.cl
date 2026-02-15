/**
 * Email Service
 * Servicio para envío de notificaciones por email usando Supabase Edge Functions
 */

import { supabase } from '../config/supabase';
import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { EmailResult, PanicEvent, Invitation } from '../types/models';

/**
 * Interfaz del servicio de email
 */
export interface IEmailService {
  sendPanicAlert(recipients: string[], panicEvent: PanicEvent): Promise<Result<EmailResult[]>>;
  sendInvitation(email: string, invitation: Invitation): Promise<Result<EmailResult>>;
}

/**
 * Implementación del servicio de email usando Supabase Edge Functions
 */
class EmailService implements IEmailService {
  private readonly MAX_RETRIES = 3;

  /**
   * Envía alertas de pánico a múltiples destinatarios
   * Implementa lógica de reintentos (máximo 3 intentos)
   */
  async sendPanicAlert(recipients: string[], panicEvent: PanicEvent): Promise<Result<EmailResult[]>> {
    if (recipients.length === 0) {
      return Err({
        code: ErrorCode.PANIC_NO_RECIPIENTS,
        message: 'No hay contactos para enviar la alerta de emergencia',
      });
    }

    const results: EmailResult[] = [];

    for (const recipient of recipients) {
      let success = false;
      let lastError: string | undefined;

      // Intentar enviar hasta MAX_RETRIES veces
      for (let attempt = 1; attempt <= this.MAX_RETRIES && !success; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke('send-panic-alert', {
            body: {
              recipient,
              panicEvent: {
                id: panicEvent.id,
                patientId: panicEvent.patientId,
                triggeredBy: panicEvent.triggeredBy,
                triggeredAt: panicEvent.triggeredAt.toISOString(),
                location: panicEvent.location,
                notes: panicEvent.notes,
              },
            },
          });

          if (error) {
            lastError = error.message || 'Error desconocido al enviar email';
            console.error(`Intento ${attempt} falló para ${recipient}:`, error);
          } else if (data?.success) {
            success = true;
          } else {
            lastError = data?.error || 'Error desconocido';
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Error inesperado';
          console.error(`Intento ${attempt} falló para ${recipient}:`, error);
        }

        // Esperar antes del siguiente intento (excepto en el último)
        if (!success && attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      results.push({
        recipient,
        success,
        error: success ? undefined : lastError,
      });
    }

    // Si todos fallaron, retornar error
    const allFailed = results.every(r => !r.success);
    if (allFailed) {
      return Err({
        code: ErrorCode.PANIC_EMAIL_FAILED,
        message: 'Error al enviar notificaciones de emergencia',
        details: results,
      });
    }

    return Ok(results);
  }

  /**
   * Envía una invitación por email
   */
  async sendInvitation(email: string, invitation: Invitation): Promise<Result<EmailResult>> {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          invitation: {
            id: invitation.id,
            familyId: invitation.familyId,
            role: invitation.role,
            token: invitation.token,
            expiresAt: invitation.expiresAt.toISOString(),
          },
        },
      });

      if (error) {
        return Ok({
          recipient: email,
          success: false,
          error: error.message || 'Error al enviar invitación',
        });
      }

      if (data?.success) {
        return Ok({
          recipient: email,
          success: true,
        });
      }

      return Ok({
        recipient: email,
        success: false,
        error: data?.error || 'Error desconocido',
      });
    } catch (error) {
      return Ok({
        recipient: email,
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado',
      });
    }
  }
}

// Instancia singleton del servicio
let emailServiceInstance: EmailService | null = null;

/**
 * Obtiene la instancia del servicio de email
 */
export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para testing)
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}

export { EmailService };
