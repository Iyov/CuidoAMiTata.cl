import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getPolypharmacyManager } from '../services/PolypharmacyManager';
import type { SIGREPoint, Location } from '../types/models';

export const SIGREMapScreen: React.FC = () => {
  const navigate = useNavigate();
  const [sigrePoints, setSigrePoints] = useState<SIGREPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  useEffect(() => {
    loadSIGREPoints();
  }, []);

  const loadSIGREPoints = async () => {
    try {
      setLoading(true);

      // Intentar obtener ubicación del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(location);

            // Buscar puntos SIGRE cercanos
            const manager = getPolypharmacyManager();
            const points = await manager.findNearestSIGREPoint(location, 10);
            setSigrePoints(points);
            setLoading(false);
          },
          (err) => {
            console.error('Error al obtener ubicación:', err);
            // Usar ubicación por defecto (Santiago, Chile)
            loadDefaultSIGREPoints();
          }
        );
      } else {
        // Geolocalización no disponible
        loadDefaultSIGREPoints();
      }
    } catch (err) {
      setError('Error al cargar puntos SIGRE');
      console.error(err);
      setLoading(false);
    }
  };

  const loadDefaultSIGREPoints = async () => {
    try {
      const defaultLocation: Location = {
        latitude: -33.4489,
        longitude: -70.6693,
      };
      setUserLocation(defaultLocation);

      const manager = getPolypharmacyManager();
      const points = await manager.findNearestSIGREPoint(defaultLocation, 10);
      setSigrePoints(points);
    } catch (err) {
      setError('Error al cargar puntos SIGRE');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (point: SIGREPoint) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${point.location.latitude},${point.location.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando puntos SIGRE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Puntos SIGRE Cercanos</h1>
          <Button onClick={() => navigate('/polypharmacy')}>Volver</Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <Alert
          type="info"
          message="Los puntos SIGRE son farmacias donde puede desechar medicamentos caducados o no utilizados de forma segura y responsable con el medio ambiente."
          className="mb-6"
        />

        {sigrePoints.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 dark:text-slate-400">
              No se encontraron puntos SIGRE cercanos
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sigrePoints.map((point) => (
              <Card key={point.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <h3 className="text-lg font-semibold">{point.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {point.address}
                    </p>
                    {point.distance !== undefined && (
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        📏 {point.distance} km de distancia
                      </p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openInMaps(point)}
                  >
                    Ver en Mapa
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6">
          <h3 className="font-semibold mb-2">¿Qué medicamentos puedo llevar a SIGRE?</h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Medicamentos caducados</li>
            <li>Medicamentos que ya no necesita</li>
            <li>Envases vacíos de medicamentos</li>
            <li>Medicamentos en mal estado</li>
          </ul>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            <strong>Importante:</strong> No deseche medicamentos en la basura común ni por el
            desagüe. Use siempre los puntos SIGRE para proteger el medio ambiente.
          </p>
        </Card>
      </div>
    </div>
  );
};
