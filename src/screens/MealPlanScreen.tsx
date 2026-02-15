import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getNutritionManager } from '../services/NutritionManager';
import type { MealPlan } from '../types/models';
import { MealType } from '../types/enums';

export const MealPlanScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      // Intentar cargar plan existente desde IndexedDB
      const { getAll } = await import('../utils/indexedDB');
      const plans = await getAll<MealPlan>('meal_plans');
      
      if (plans.length > 0) {
        // Usar el plan más reciente
        const latestPlan = plans.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setMealPlan(latestPlan);
      }
    } catch (err) {
      console.error('Error al cargar plan de comidas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const manager = getNutritionManager();
      const result = await manager.generateSEGGMealPlan('default-patient');
      
      if (result.ok) {
        setMealPlan(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al generar plan de comidas');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

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

  const getMealTypeIcon = (type: MealType): string => {
    const icons: Record<MealType, string> = {
      [MealType.BREAKFAST]: '🌅',
      [MealType.MID_MORNING]: '☕',
      [MealType.LUNCH]: '🍽️',
      [MealType.SNACK]: '🍎',
      [MealType.DINNER]: '🌙',
    };
    return icons[type];
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando plan de comidas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Plan de Comidas</h1>
          <Button variant="secondary" onClick={() => navigate('/nutrition')}>
            Volver
          </Button>
        </div>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {!mealPlan ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-lg mb-4 text-slate-600 dark:text-slate-400">
                No hay un plan de comidas generado
              </p>
              <p className="text-sm mb-6 text-slate-600 dark:text-slate-400">
                Genera un plan de comidas balanceado para adultos mayores
              </p>
              <Button onClick={handleGeneratePlan} disabled={generating}>
                {generating ? 'Generando...' : 'Generar Plan de Comidas'}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ✓ Plan nutricional balanceado
                </span>
              </div>
              <Button size="sm" onClick={handleGeneratePlan} disabled={generating}>
                {generating ? 'Generando...' : 'Regenerar Plan'}
              </Button>
            </div>

            <div className="space-y-4">
              {mealPlan.meals.map((meal, index) => (
                <Card key={index}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getMealTypeIcon(meal.mealType)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">
                          {getMealTypeLabel(meal.mealType)}
                        </h3>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatTime(meal.time)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Alimentos recomendados:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {meal.recommendedFoods.map((food, foodIndex) => (
                            <li key={foodIndex} className="text-sm text-slate-600 dark:text-slate-400">
                              {food}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {meal.notes && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 italic">
                          {meal.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                ℹ️ Sobre el Plan Nutricional
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• 5 comidas diarias para mantener energía constante</li>
                <li>• Pescado rico en omega-3 para salud cardiovascular</li>
                <li>• Aceite de oliva como grasa principal</li>
                <li>• Yogur para salud digestiva y aporte de calcio</li>
                <li>• Frutas, verduras y cereales integrales</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
