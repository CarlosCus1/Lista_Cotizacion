const CURRENCY = 'PEN';

/**
 * Redondea un número a 2 decimales
 * @param {number} n - Número a redondear
 * @returns {number} Número redondeado
 */
export function toFixed2(n) {
  return isFinite(n) ? parseFloat(n.toFixed(2)) : 0;
}

/**
 * Formatea un número como moneda en Soles Peruanos
 * @param {number} n - Número a formatear
 * @returns {string} Cadena de moneda formateada
 */
export function formatMoney(n) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: CURRENCY }).format(n || 0);
}

/**
 * Formatea una cadena de tiempo transcurrido para su visualización
 * @param {Date} date - Fecha a formatear
 * @returns {string} Cadena de tiempo transcurrido formateada
 */
export function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`;
  } else {
    return `hace ${diffDays} días`;
  }
}
