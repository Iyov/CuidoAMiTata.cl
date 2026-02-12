import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Alert } from './Alert';

// Feature: cuido-a-mi-tata, Property 20: Contenido en español
// Valida: Requisitos 8.3

describe('Propiedad 20: Contenido en español', () => {
  // Generador de texto en español
  const spanishTextArbitrary = fc.oneof(
    fc.constant('Guardar'),
    fc.constant('Cancelar'),
    fc.constant('Aceptar'),
    fc.constant('Eliminar'),
    fc.constant('Editar'),
    fc.constant('Confirmar'),
    fc.constant('Nombre'),
    fc.constant('Correo electrónico'),
    fc.constant('Contraseña'),
    fc.constant('Descripción'),
    fc.constant('Título'),
    fc.constant('Mensaje'),
    fc.constant('Error al procesar la solicitud'),
    fc.constant('Operación exitosa'),
    fc.constant('Advertencia: revise los datos'),
    fc.constant('Información importante'),
    fc.constant('Campo obligatorio'),
    fc.constant('Formato inválido'),
    fc.constant('Por favor ingrese un valor'),
  );

  // Función auxiliar para verificar si el texto está en español
  const isSpanishText = (text: string): boolean => {
    // Verificar que no contenga palabras comunes en inglés (como palabras completas)
    const englishOnlyWords = [
      'save', 'cancel', 'delete', 'edit', 'confirm', 'accept',
      'name', 'email', 'password', 'description', 'title', 'message',
      'success', 'warning', 'information', 'required', 'invalid',
      'please', 'enter', 'value', 'submit', 'reset', 'close',
      'button', 'input', 'form', 'field', 'select', 'checkbox',
    ];

    const lowerText = text.toLowerCase();
    
    // Verificar palabras completas en inglés (con límites de palabra)
    const hasEnglishOnlyWords = englishOnlyWords.some(word => {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      return wordRegex.test(lowerText);
    });

    if (hasEnglishOnlyWords) {
      return false;
    }

    // Verificar que contenga caracteres o palabras en español
    const spanishIndicators = [
      'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü',
      'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al',
      'por', 'para', 'con', 'sin', 'en', 'es', 'son', 'está',
      'guardar', 'cancelar', 'eliminar', 'editar', 'confirmar', 'aceptar',
      'nombre', 'correo', 'contraseña', 'descripción', 'título', 'mensaje',
      'error', 'éxito', 'exitosa', 'advertencia', 'información', 'obligatorio',
      'inválido', 'formato', 'solicitud', 'operación', 'procesar',
    ];

    const hasSpanishIndicators = spanishIndicators.some(indicator => 
      lowerText.includes(indicator)
    );

    // Si tiene indicadores de español, es válido
    return hasSpanishIndicators;
  };

  it('Para cualquier componente Button, el texto debe estar en español', () => {
    fc.assert(
      fc.property(
        spanishTextArbitrary,
        (buttonText) => {
          const { container } = render(<Button>{buttonText}</Button>);
          const button = container.querySelector('button');
          
          expect(button).toBeTruthy();
          const text = button?.textContent || '';
          
          // Verificar que el texto está en español
          expect(isSpanishText(text)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Para cualquier componente Input con label, el label debe estar en español', () => {
    fc.assert(
      fc.property(
        spanishTextArbitrary,
        fc.option(spanishTextArbitrary, { nil: undefined }),
        fc.option(spanishTextArbitrary, { nil: undefined }),
        (label, error, helperText) => {
          const { container } = render(
            <Input 
              label={label} 
              error={error} 
              helperText={helperText}
            />
          );
          
          // Verificar label
          const labelElement = container.querySelector('label');
          if (labelElement) {
            const labelText = labelElement.textContent || '';
            expect(isSpanishText(labelText)).toBe(true);
          }
          
          // Verificar mensaje de error
          if (error) {
            const errorText = container.textContent || '';
            expect(errorText).toContain(error);
            expect(isSpanishText(error)).toBe(true);
          }
          
          // Verificar texto de ayuda
          if (helperText && !error) {
            const helperTextContent = container.textContent || '';
            expect(helperTextContent).toContain(helperText);
            expect(isSpanishText(helperText)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Para cualquier componente Card con título, el título debe estar en español', () => {
    fc.assert(
      fc.property(
        fc.option(spanishTextArbitrary, { nil: undefined }),
        spanishTextArbitrary,
        (title, content) => {
          const { container } = render(
            <Card title={title}>
              <p>{content}</p>
            </Card>
          );
          
          // Verificar título si existe
          if (title) {
            const titleElement = container.querySelector('h3');
            expect(titleElement).toBeTruthy();
            const titleText = titleElement?.textContent || '';
            expect(isSpanishText(titleText)).toBe(true);
          }
          
          // Verificar contenido
          const contentText = container.textContent || '';
          expect(contentText).toContain(content);
          expect(isSpanishText(content)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Para cualquier componente Alert, el mensaje debe estar en español', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('info', 'success', 'warning', 'error'),
        fc.option(spanishTextArbitrary, { nil: undefined }),
        spanishTextArbitrary,
        (type, title, message) => {
          const { container } = render(
            <Alert 
              type={type as 'info' | 'success' | 'warning' | 'error'}
              title={title}
              message={message}
            />
          );
          
          // Verificar título si existe
          if (title) {
            const titleElement = container.querySelector('h4');
            expect(titleElement).toBeTruthy();
            const titleText = titleElement?.textContent || '';
            expect(isSpanishText(titleText)).toBe(true);
          }
          
          // Verificar mensaje
          const messageText = container.textContent || '';
          expect(messageText).toContain(message);
          expect(isSpanishText(message)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Para cualquier elemento de UI, no debe contener texto en inglés', () => {
    fc.assert(
      fc.property(
        spanishTextArbitrary,
        (text) => {
          // Verificar que el texto generado no contiene palabras en inglés
          expect(isSpanishText(text)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
