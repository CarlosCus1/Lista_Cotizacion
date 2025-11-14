/**
 * Utilidad para manejar la lista negra de productos sin descuentos
 */

let cachedNoDiscountProducts = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Carga la lista de productos sin descuentos desde el archivo JSON
 * @returns {Promise<Set<string>>} Set con códigos de productos sin descuentos
 */
export async function loadNoDiscountProducts() {
  // Verificar caché primero
  if (cachedNoDiscountProducts && cacheTimestamp && 
      (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedNoDiscountProducts;
  }

  try {
    const response = await fetch('/productos-sin-descuentos.json');
    if (!response.ok) {
      console.warn('No se pudo cargar lista de productos sin descuentos');
      cachedNoDiscountProducts = new Set();
      cacheTimestamp = Date.now();
      return cachedNoDiscountProducts;
    }

    const data = await response.json();
    const noDiscountCodes = new Set(data.productos.map(p => p.codigo));
    
    cachedNoDiscountProducts = noDiscountCodes;
    cacheTimestamp = Date.now();
    
    console.log(`Lista negra cargada: ${noDiscountCodes.size} productos sin descuentos`);
    return noDiscountCodes;
  } catch (error) {
    console.error('Error cargando lista negra:', error);
    cachedNoDiscountProducts = new Set();
    cacheTimestamp = Date.now();
    return cachedNoDiscountProducts;
  }
}

/**
 * Verifica si un producto está en la lista negra (sin descuentos automáticos)
 * @param {string} codigo - Código del producto
 * @returns {Promise<boolean>} true si está en lista negra
 */
export async function isNoDiscountProduct(codigo) {
  const noDiscountList = await loadNoDiscountProducts();
  return noDiscountList.has(codigo);
}

/**
 * Obtiene información detallada de un producto sin descuentos
 * @param {string} codigo - Código del producto
 * @returns {Promise<Object|null>} Información del producto o null
 */
export async function getNoDiscountInfo(codigo) {
  try {
    const response = await fetch('/productos-sin-descuentos.json');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.productos.find(p => p.codigo === codigo) || null;
  } catch (error) {
    console.error('Error obteniendo info de producto sin descuentos:', error);
    return null;
  }
}

/**
 * Fuerza recarga de la lista negra (útil para desarrollo)
 */
export function clearNoDiscountCache() {
  cachedNoDiscountProducts = null;
  cacheTimestamp = null;
  console.log('Caché de lista negra limpiado');
}