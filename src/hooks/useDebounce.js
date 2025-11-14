import { useState, useEffect } from 'react';

/**
 * Hook personalizado para hacer debounce a un valor.
 *
 * @param {any} value El valor a hacer debounce.
 * @param {number} delay El delay del debounce en milisegundos.
 * @returns {any} El valor con debounce aplicado.
 */
export function useDebounce(value, delay) {
  // Estado para almacenar el valor con debounce aplicado
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configurar un temporizador para actualizar el valor con debounce después del delay especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el temporizador si el valor cambia antes de que pase el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo re-ejecutar el efecto si el valor o delay cambian

  return debouncedValue;
}
