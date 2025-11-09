const IGV = 0.18;

/**
 * Rounds a number to 2 decimal places
 * @param {number} n - Number to round
 * @returns {number} Rounded number
 */
function toFixed2(n) {
  if (!isFinite(n)) return 0;
  // Custom rounding: if the third decimal is 5 or greater, round up
  const rounded = Math.round(n * 100) / 100;
  return parseFloat(rounded.toFixed(2));
}

/**
 * Calculates the final price of a product after applying a series of sequential discounts.
 * This logic is shared between the main catalog view and the quotation view.
 *
 * @param {object} product The product object. Must include `precioBase` and discount fields (`desc1`, `desc2`, etc.).
 * @param {number[]} hiddenDiscounts An array of hidden discount percentages to apply first.
 * @returns {object} An object containing all calculated price values.
 * @property {number} neto - The final net price after all discounts.
 * @property {number} final - The final price including IGV.
 * @property {number} priceAfterHiddenDiscounts - The intermediate price after applying only the hidden discounts.
 * @property {number} effectiveHiddenDiscount - The total effective discount percentage from the hidden discounts group.
 * @property {number} effectiveProductDiscount - The total effective discount percentage from the product-specific discounts group.
 */
export function calculatePrice(product, hiddenDiscounts = []) {
  // This comment is added to trigger a cache refresh.
  if (!product) {
    return {
      neto: 0,
      final: 0,
      priceAfterHiddenDiscounts: 0,
      effectiveHiddenDiscount: 0,
      effectiveProductDiscount: 0,
    };
  }

  const { precioBase = 0 } = product;
  let currentPrice = precioBase;

  // 1. Apply hidden discounts sequentially
  const validHiddenDiscounts = hiddenDiscounts.filter(v => parseFloat(String(v).replace(/[^\d.-]/g, '')) > 0);
  for (const discount of validHiddenDiscounts) {
    currentPrice = Math.round(currentPrice * (1 - parseFloat(discount) / 100) * 100) / 100;
  }

  const priceAfterHiddenDiscounts = currentPrice;
  const effectiveHiddenDiscount = precioBase > 0 ? toFixed2((1 - priceAfterHiddenDiscounts / precioBase) * 100) : 0;

  // 2. Apply product-specific discounts sequentially (including manual ones)
  const productDiscounts = [
    product.desc1 || 0,
    product.desc2 || 0,
    product.desc3 || 0,
    product.desc4 || 0,
  ].filter(desc => desc > 0);

  for (const discount of productDiscounts) {
    currentPrice = Math.round(currentPrice * (1 - discount / 100) * 100) / 100;
  }

  const neto = currentPrice;
  const final = toFixed2(neto * (1 + IGV));
  // Calculate effective product discount as compounded percentage (Excel-style multiplication)
  const productDiscountsForAccumulation = [
    product.desc1 || 0,
    product.desc2 || 0,
    product.desc3 || 0,
    product.desc4 || 0,
  ];

  // Start with 100% and apply each discount sequentially (Excel compound formula)
  let remainingPercentage = 100;
  for (const discount of productDiscountsForAccumulation) {
    if (discount > 0) {
      remainingPercentage = Math.round(remainingPercentage * (1 - discount / 100) * 10000) / 10000;
    }
  }
  const effectiveProductDiscount = Math.round((100 - remainingPercentage) * 100) / 100;

  return {
    neto,
    final,
    priceAfterHiddenDiscounts,
    effectiveHiddenDiscount,
    effectiveProductDiscount,
  };
}
