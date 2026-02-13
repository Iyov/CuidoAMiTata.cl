import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from './ErrorMessage';
import { Toast } from './Toast';
import { ConfirmationModal } from './ConfirmationModal';

describe('ErrorBoundary', () => {
  it('debe renderizar children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <div>Contenido normal</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('debe mostrar mensaje de error cuando hay un error', () => {
    const ThrowError = () => {
      throw new Error('Error de prueba');
    };

    // Suprimir console.error para esta prueba
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error inesperado')).toBeInTheDocument();
    expect(screen.getByText(/Ha ocurrido un error inesperado/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('ErrorMessage', () => {
  it('debe renderizar mensaje de error básico', () => {
    render(
      <ErrorMessage
        title="Error de prueba"
        message="Este es un mensaje de error"
      />
    );

    expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    expect(screen.getByText('Este es un mensaje de error')).toBeInTheDocument();
  });

  it('debe mostrar mensaje de error predefinido para código de error', () => {
    render(
      <ErrorMessage errorCode="VALIDATION_REQUIRED_FIELD" />
    );

    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument();
    expect(screen.getByText(/complete todos los campos obligatorios/)).toBeInTheDocument();
  });

  it('debe mostrar botón de reintentar cuando se proporciona onRetry', () => {
    const onRetry = vi.fn();
    render(
      <ErrorMessage
        message="Error de prueba"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar todos los mensajes de error en español', () => {
    const errorCodes: Array<'VALIDATION_ADHERENCE_WINDOW' | 'VALIDATION_BED_ELEVATION' | 'BUSINESS_CHEMICAL_RESTRAINT_BLOCKED'> = [
      'VALIDATION_ADHERENCE_WINDOW',
      'VALIDATION_BED_ELEVATION',
      'BUSINESS_CHEMICAL_RESTRAINT_BLOCKED',
    ];

    errorCodes.forEach((errorCode) => {
      const { unmount } = render(<ErrorMessage errorCode={errorCode} />);
      
      // Verificar que el contenido está en español
      const container = screen.getByRole('alert');
      expect(container.textContent).toMatch(/[áéíóúñ]/i); // Contiene caracteres españoles
      
      unmount();
    });
  });
});

describe('Toast', () => {
  it('debe renderizar notificación toast', () => {
    render(
      <Toast
        id="test-toast"
        message="Notificación de prueba"
        type="success"
      />
    );

    expect(screen.getByText('Notificación de prueba')).toBeInTheDocument();
  });

  it('debe cerrar cuando se hace clic en el botón de cerrar', () => {
    const onClose = vi.fn();
    render(
      <Toast
        id="test-toast"
        message="Notificación de prueba"
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Cerrar notificación');
    fireEvent.click(closeButton);

    waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    });
  });

  it('debe cerrarse automáticamente después del duration', async () => {
    const onClose = vi.fn();
    render(
      <Toast
        id="test-toast"
        message="Notificación de prueba"
        duration={100}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 500 });
  });
});

describe('ConfirmationModal', () => {
  it('debe renderizar modal cuando isOpen es true', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar acción"
        message="¿Está seguro de que desea continuar?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Confirmar acción')).toBeInTheDocument();
    expect(screen.getByText('¿Está seguro de que desea continuar?')).toBeInTheDocument();
  });

  it('no debe renderizar cuando isOpen es false', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Confirmar acción"
        message="¿Está seguro de que desea continuar?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument();
  });

  it('debe llamar onConfirm cuando se hace clic en confirmar', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar acción"
        message="¿Está seguro?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('debe llamar onCancel cuando se hace clic en cancelar', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar acción"
        message="¿Está seguro?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar icono de advertencia para acciones peligrosas', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Eliminar paciente"
        message="Esta acción no se puede deshacer"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDangerous={true}
      />
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('debe usar textos personalizados para botones', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Exportar datos"
        message="¿Desea exportar los datos?"
        confirmText="Exportar"
        cancelText="No exportar"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
    expect(screen.getByText('No exportar')).toBeInTheDocument();
  });
});
