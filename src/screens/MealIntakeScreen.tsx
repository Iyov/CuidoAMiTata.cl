import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components';
import { getNutritionManager } from '../services/NutritionManager';
import { MealType } from '../types/enums';

export const MealIntakeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [foodItems, setFoodItems] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getMealTypeLabel = (type: MealType): string => {
    const labels: Record<MealType, string> = {
      [MealType.BREAKFAST]: 'Desayuno',
      [MealType.MID_MORNING]: 'Media Mañana',
      [MealType.LUNCH]: 'Comida',
      [MealType.SNACK]: 'Merienda',
      [MealType.DINNER]: 'Cena',
    };
    return labels[type];
  };

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, '']);
  };

  const handleRemoveFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const handleFoodItemChange = (index: number, value: string) => {
    const newItems = [...foodItems];
    newItems[index] = value;
    setFoodItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // Validar campos
      if (!mealType) {
        setError('Debe seleccionar el tipo de comida');
        setSubmitting(false);
        return;
      }

      const validFoodItems = foodItems.filter(item => item.trim() !== '');
      if (validFoodItems.length === 0) {
        setError('Debe agregar al menos un alimento');
        setSubmitting(false);
        return;
      }

      const manager = getNutritionManager();
      const result = await manager.recordMealIntake(
        'default-patient',
        mealType as MealType,
        validFoodItems
      );

      if (result.ok) {
        setSuccess(`✓ ${getMealTypeLabel(mealType as MealType)} registrada correctamente`);
        
        // Resetear formulario
        setMealType('');
        setFoodItems(['']);
        
        // Redirigir después de 2 segundos
        setTimeout(() => navigate('/nutrition'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar ingesta de comida');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Registrar Comida</h1>
          <Button variant="secondary" onClick={() => navigate('/nutrition')}>
            Volver
          </Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de comida */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de comida *
              </label>
              <div className="space-y-2">
                {Object.values(MealType).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="mealType"
                      value={type}
                      checked={mealType === type}
                      onChange={(e) => setMealType(e.target.value as MealType)}
                      className="mr-2"
                      required
                    />
                    <span>{getMealTypeLabel(type)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Alimentos */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Alimentos consumidos *
              </label>
              {foodItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => handleFoodItemChange(index, e.target.value)}
                    placeholder="Ej: Yogur natural, Pan integral, Manzana"
                    className="flex-1"
                  />
                  {foodItems.length > 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveFoodItem(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddFoodItem}
              >
                Agregar Alimento
              </Button>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Registrar Comida'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/nutrition')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        {/* Información SEGG */}
        <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
            🥗 Alimentos Recomendados SEGG
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800 dark:text-green-200">
            <div>
              <p className="font-semibold mb-1">Proteínas:</p>
              <ul className="list-disc list-inside">
                <li>Pescado (salmón, merluza)</li>
                <li>Huevos</li>
                <li>Legumbres</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Lácteos:</p>
              <ul className="list-disc list-inside">
                <li>Yogur natural</li>
                <li>Leche</li>
                <li>Queso fresco</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Grasas saludables:</p>
              <ul className="list-disc list-inside">
                <li>Aceite de oliva virgen extra</li>
                <li>Frutos secos</li>
                <li>Aguacate</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Frutas y verduras:</p>
              <ul className="list-disc list-inside">
                <li>Frutas de temporada</li>
                <li>Verduras variadas</li>
                <li>Cereales integrales</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
