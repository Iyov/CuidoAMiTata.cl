import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { useFamily } from '../contexts/FamilyContext';
import { getFamilyManager } from '../services/FamilyManager';
import { supabase } from '../config/supabase';
import type { FamilyMember, FamilyRole } from '../types/models';

/**
 * FamilyScreen
 * Pantalla de gestión familiar
 * Permite a los administradores invitar miembros, gestionar roles y ver todos los miembros de la familia
 */
export const FamilyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentFamily, members, refreshMembers } = useFamily();
  const manager = getFamilyManager();
  
  // Estado del formulario de invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyRole>('familiar');
  
  // Estado de la UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<FamilyRole | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentFamily && currentUserId) {
      loadCurrentUserRole();
    }
  }, [currentFamily, currentUserId, members]);

  /**
   * Carga el usuario actual de Supabase
   */
  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('No se pudo obtener información del usuario');
        return;
      }
      
      setCurrentUserId(user.id);
    } catch (err) {
      console.error('Error al cargar usuario:', err);
      setError('Error al cargar información del usuario');
    }
  };

  /**
   * Carga el rol del usuario actual en la familia
   */
  const loadCurrentUserRole = () => {
    if (!currentUserId || !members) {
      return;
    }
    
    const currentMember = members.find(m => m.userId === currentUserId);
    if (currentMember) {
      setCurrentUserRole(currentMember.role);
    }
  };

  /**
   * Verifica si el usuario actual es administrador
   */
  const isAdmin = currentUserRole === 'admin';

  /**
   * Maneja el envío del formulario de invitación
   */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFamily || !currentUserId) {
      setError('No hay familia seleccionada');
      return;
    }
    
    if (!isAdmin) {
      setError('Solo los administradores pueden invitar miembros');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await manager.inviteMember(
        currentFamily.id,
        inviteEmail.trim(),
        inviteRole,
        currentUserId
      );
      
      if (result.ok) {
        setSuccess(`Invitación enviada a ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('familiar');
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al enviar invitación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio de rol de un miembro
   */
  const handleChangeRole = async (member: FamilyMember, newRole: FamilyRole) => {
    if (!currentFamily || !currentUserId) {
      setError('No hay familia seleccionada');
      return;
    }
    
    if (!isAdmin) {
      setError('Solo los administradores pueden cambiar roles');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await manager.updateMemberRole(
        currentFamily.id,
        member.userId,
        newRole,
        currentUserId
      );
      
      if (result.ok) {
        setSuccess(`Rol de ${member.userName} actualizado a ${getRoleLabel(newRole)}`);
        await refreshMembers();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al cambiar rol');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la remoción de un miembro
   */
  const handleRemoveMember = async (member: FamilyMember) => {
    if (!currentFamily || !currentUserId) {
      setError('No hay familia seleccionada');
      return;
    }
    
    if (!isAdmin) {
      setError('Solo los administradores pueden remover miembros');
      return;
    }
    
    // Confirmar acción
    const confirmed = window.confirm(
      `¿Está seguro de remover a ${member.userName} de la familia?`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await manager.removeMember(
        currentFamily.id,
        member.userId,
        currentUserId
      );
      
      if (result.ok) {
        setSuccess(`${member.userName} ha sido removido de la familia`);
        await refreshMembers();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al remover miembro');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la etiqueta en español para un rol
   */
  const getRoleLabel = (role: FamilyRole): string => {
    const labels: Record<FamilyRole, string> = {
      admin: 'Administrador',
      cuidador: 'Cuidador',
      familiar: 'Familiar',
    };
    return labels[role];
  };

  /**
   * Obtiene el ícono para un rol
   */
  const getRoleIcon = (role: FamilyRole): string => {
    const icons: Record<FamilyRole, string> = {
      admin: '👑',
      cuidador: '🩺',
      familiar: '👤',
    };
    return icons[role];
  };

  /**
   * Formatea la fecha en formato chileno (DD/MM/YYYY)
   */
  const formatDateChilean = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!currentFamily) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestión Familiar</h1>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Volver
            </Button>
          </div>
          <Alert 
            type="warning" 
            message="No hay familia seleccionada. Por favor, seleccione una familia o cree una nueva." 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestión Familiar</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Familia: {currentFamily.name}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Volver
          </Button>
        </div>

        {/* Alertas */}
        {error && (
          <Alert type="error" message={error} className="mb-4" onClose={() => setError(null)} />
        )}
        {success && (
          <Alert type="success" message={success} className="mb-4" onClose={() => setSuccess(null)} />
        )}

        {/* Formulario de invitación (solo para admins) */}
        {isAdmin && (
          <Card title="Invitar Nuevo Miembro" className="mb-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                type="email"
                label="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="correo@ejemplo.cl"
                fullWidth
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as FamilyRole)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[44px]"
                  required
                >
                  <option value="familiar">👤 Familiar</option>
                  <option value="cuidador">🩺 Cuidador</option>
                  <option value="admin">👑 Administrador</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Los administradores pueden gestionar miembros y configuraciones. Los cuidadores pueden registrar actividades. Los familiares tienen acceso de solo lectura.
                </p>
              </div>

              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </form>
          </Card>
        )}

        {/* Lista de miembros */}
        <Card title={`Miembros de la Familia (${members.length})`}>
          {members.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400">
              No hay miembros en esta familia
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canManage = isAdmin && !isCurrentUser;
                
                return (
                  <div
                    key={member.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{getRoleIcon(member.role)}</span>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {member.userName}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                                (Tú)
                              </span>
                            )}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {member.userEmail}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Rol: {getRoleLabel(member.role)} • Unido: {formatDateChilean(member.joinedAt)}
                        </p>
                      </div>

                      {/* Botones de gestión (solo para admins) */}
                      {canManage && (
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleChangeRole(member, e.target.value as FamilyRole)}
                              disabled={loading}
                              className="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              aria-label={`Cambiar rol de ${member.userName}`}
                            >
                              <option value="familiar">Familiar</option>
                              <option value="cuidador">Cuidador</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            disabled={loading}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Información adicional */}
        <Card title="Información" className="mt-6">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                Roles y Permisos
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Administrador:</strong> Puede invitar y remover miembros, cambiar roles, y gestionar toda la información de la familia.
                </li>
                <li>
                  <strong>Cuidador:</strong> Puede registrar actividades diarias, medicación, y eventos de cuidado.
                </li>
                <li>
                  <strong>Familiar:</strong> Puede ver toda la información pero no puede modificarla.
                </li>
              </ul>
            </div>
            
            {isAdmin && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Invitaciones
                </h4>
                <p>
                  Cuando invitas a un nuevo miembro, se le enviará un email con un enlace para unirse a la familia. 
                  La invitación expira en 7 días.
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                Seguridad
              </h4>
              <p>
                Todos los datos de la familia están protegidos y solo son accesibles por los miembros autorizados. 
                No se puede remover al último administrador de la familia.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
