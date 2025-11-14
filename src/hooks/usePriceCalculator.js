const IGV = 0.18;

/**
 * Redondea un número a 2 decimales
 * @param {number} n - Número a redondear
 * @returns {number} Número redondeado
 */
function toFixed2(n) {
  if (!isFinite(n)) return 0;
  // Redondeo personalizado: si el tercer decimal es 5 o mayor, redondear hacia arriba
  const rounded = Math.round(n * 100) / 100;
  return parseFloat(rounded.toFixed(2));
}

/**
 * Calcula el porcentaje de descuento compuesto desde un array de descuentos secuenciales
 * @param {number[]} variableDiscounts - Array de porcentajes de descuento variable
 * @returns {number} Porcentaje de descuento compuesto
 */
function calculateCompoundHiddenDiscount(hiddenDiscounts) {
  let factor = 1;
  const validDiscounts = hiddenDiscounts.filter(v => parseFloat(String(v).replace(/[^\d.-]/g, '')) > 0);
  for (const discount of validDiscounts) {
    factor *= (1 - parseFloat(discount) / 100);
  }
  return toFixed2((1 - factor) * 100);
}

/**
 * Calcula el precio final de un producto después de aplicar una serie de descuentos secuenciales.
 * Esta lógica se comparte entre la vista principal del catálogo y la vista de cotización.
 *
 * Orden de aplicación:
 * 1. Descuentos variables globales (salteados si "Sin Descuentos" está activado)
 * 2. Descuentos fijos del producto (salteados si "Sin Descuentos" está activado)
 * 3. Descuentos adicionales (SIEMPRE aplicados, incluso con "Sin Descuentos" activado)
 *
 * @param {object} product El objeto del producto. Debe incluir `precio_lista`, campos de descuento (`desc1`, `desc2`, etc.) y `descManual1-3`.
 * @param {number[]} variableDiscounts Un array de porcentajes de descuento variables a aplicar primero.
 * @returns {object} Un objeto que contiene todos los valores de precio calculados.
 * @property {number} neto - El precio neto final después de todos los descuentos.
 * @property {number} final - El precio final incluyendo IGV.
 * @property {number} priceAfterHiddenDiscounts - El precio intermedio después de aplicar solo los descuentos ocultos.
 * @property {number} effectiveHiddenDiscount - El porcentaje de descuento efectivo total del grupo de descuentos ocultos.
 * @property {number} effectiveProductDiscount - El porcentaje de descuento efectivo total del grupo de descuentos específicos del producto.
 */
export function calculatePrice(product, hiddenDiscounts = []) {
  // Este comentario se agregó para activar una actualización de caché.
  if (!product) {
    return {
      neto: 0,
      final: 0,
      priceAfterHiddenDiscounts: 0,
      effectiveHiddenDiscount: 0,
      effectiveProductDiscount: 0,
    };
  }

  const { precio_lista = 0, sinDescuentos = false } = product;

  // CÁLCULOS CON MÁXIMA PRECISIÓN - SIN REDONDEOS PREMATUROS
  let currentPrice = precio_lista;

  // 1. Aplicar descuentos variables secuencialmente SOLO si no está marcado "Sin Descuentos"
  let priceAfterHiddenDiscounts = precio_lista;
  if (!sinDescuentos) {
    const validHiddenDiscounts = hiddenDiscounts.filter(v => parseFloat(String(v).replace(/[^\d.-]/g, '')) > 0);
    for (const discount of validHiddenDiscounts) {
      currentPrice *= (1 - parseFloat(discount) / 100);
      priceAfterHiddenDiscounts = currentPrice;
    }
  }

  // 2. Aplicar descuentos fijos del producto (SOLO si no está marcado "Sin Descuentos")
  const productDiscounts = sinDescuentos ? [] : [
    product.desc1 || 0,
    product.desc2 || 0,
    product.desc3 || 0,
    product.desc4 || 0,
  ].filter(desc => desc > 0);

  for (const discount of productDiscounts) {
    currentPrice *= (1 - discount / 100);
  }

  // 3. Aplicar descuentos adicionales (SIEMPRE aplicar, incluso con "Sin Descuentos" activado)
  const manualDiscounts = [
    product.descManual1 || 0,
    product.descManual2 || 0,
    product.descManual3 || 0,
  ].filter(desc => desc > 0);

  for (const discount of manualDiscounts) {
    currentPrice *= (1 - discount / 100);
  }

  // REDONDEOS SOLO AL FINAL PARA RESULTADOS FINALES
  const neto = toFixed2(currentPrice);
  const final = toFixed2(neto * (1 + IGV));

  // CÁLCULO CONSISTENTE DE DESCUENTOS EFECTIVOS
  const effectiveHiddenDiscount = sinDescuentos ? 0 : toFixed2((1 - priceAfterHiddenDiscounts / precio_lista) * 100);

  // Cálculo compuesto consistente para descuentos del producto
  let remainingPercentage = 100;

  // Aplicar descuentos fijos del producto (si no está en modo "sin descuentos")
  if (!sinDescuentos) {
    const productDiscountsForCalc = [
      product.desc1 || 0,
      product.desc2 || 0,
      product.desc3 || 0,
      product.desc4 || 0,
    ];

    for (const discount of productDiscountsForCalc) {
      if (discount > 0) {
        remainingPercentage *= (1 - discount / 100);
      }
    }
  }

  // Aplicar descuentos adicionales al cálculo compuesto
  const manualDiscountsForCalc = [
    product.descManual1 || 0,
    product.descManual2 || 0,
    product.descManual3 || 0,
  ];

  for (const discount of manualDiscountsForCalc) {
    if (discount > 0) {
      remainingPercentage *= (1 - discount / 100);
    }
  }

  const effectiveProductDiscount = toFixed2((100 - remainingPercentage) * 100) / 100;

  return {
    neto,
    final,
    priceAfterHiddenDiscounts: toFixed2(priceAfterHiddenDiscounts),
    effectiveHiddenDiscount,
    effectiveProductDiscount,
  };
}

export { calculateCompoundHiddenDiscount };
