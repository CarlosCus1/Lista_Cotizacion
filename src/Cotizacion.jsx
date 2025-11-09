import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { calculatePrice } from './hooks/usePriceCalculator';
import { useDebounce } from './hooks/useDebounce';

const CURRENCY = 'PEN';
const IGV = 0.18;

function toFixed2(n) {
  return isFinite(n) ? parseFloat(n.toFixed(2)) : 0;
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: CURRENCY }).format(n || 0);
}

/**
 * Formats time ago string for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted time ago string
 */
function formatTimeAgo(date) {
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

export default function Cotizacion({ onBack, catalogData, descOcultos }) {
  // Estado del cliente
  const [clientData, setClientData] = useState({
    ruc: '',
    nombre: '',
    oc: ''
  });

  // Estado de la cotización
  const [quotedItems, setQuotedItems] = useState([]);

  // Estado de filtros para el catálogo
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState('TODAS');

  // Estado para persistencia de selección
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [selectionLastSaved, setSelectionLastSaved] = useState(null);

  // Cargar selección guardada al montar el componente
  useEffect(() => {
    const saved = localStorage.getItem('cotizacion_seleccion');
    if (saved) {
      try {
        const { items, timestamp } = JSON.parse(saved);
        // Solo cargar si tiene menos de 24 horas
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < oneDay) {
          setQuotedItems(items);
          setSelectionSaved(true);
          setSelectionLastSaved(new Date(timestamp));
        }
      } catch (e) {
        console.warn('Error loading saved selection:', e);
      }
    }
  }, []);

  // Guardar selección automáticamente cuando cambie
  useEffect(() => {
    if (quotedItems.length > 0) {
      const selectionData = {
        items: quotedItems,
        timestamp: Date.now(),
      };
      localStorage.setItem('cotizacion_seleccion', JSON.stringify(selectionData));
      setSelectionSaved(true);
      setSelectionLastSaved(new Date());
    } else {
      // Limpiar si no hay items seleccionados
      localStorage.removeItem('cotizacion_seleccion');
      setSelectionSaved(false);
      setSelectionLastSaved(null);
    }
  }, [quotedItems]);

  // Debounce search term to improve performance
  const debouncedSearch = useDebounce(search, 300);
  
  const filteredCatalog = useMemo(() => {
    let filtered = catalogData;

    if (selectedLine !== 'TODAS') {
      filtered = filtered.filter((r) => r.linea === selectedLine);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          String(r.codigo).toLowerCase().includes(q) ||
          String(r.nombre).toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [catalogData, selectedLine, debouncedSearch]);

  // Calcular productos de cotización con precios
  const quotationProducts = useMemo(() => {
    return quotedItems.map(item => {
      const productWithManualDiscounts = {
        ...item.product,
        descManual1: item.manualDiscounts[0] || 0,
        descManual2: item.manualDiscounts[1] || 0,
      };

      const {
        neto,
        priceAfterHiddenDiscounts,
        effectiveHiddenDiscount,
        effectiveProductDiscount,
      } = calculatePrice(productWithManualDiscounts, descOcultos);

      // No aplicar descuentos especiales adicionales en la cotización
      const finalUnitPrice = neto;

      const totalSinIgv = toFixed2(finalUnitPrice * item.quantity);
      const totalConIgv = toFixed2(totalSinIgv * (1 + IGV));

      return {
        ...item.product,
        quantity: item.quantity,
        manualDiscounts: item.manualDiscounts,
        descSuma01: effectiveHiddenDiscount,
        descSuma02: effectiveProductDiscount,
        precioDescSuma01: priceAfterHiddenDiscounts,
        unitPrice: finalUnitPrice,
        totalSinIgv,
        totalConIgv,
      };
    });
  }, [quotedItems, descOcultos]);

  // Calcular totales
  const totals = useMemo(() => {
    const subtotal = quotationProducts.reduce((sum, p) => sum + p.totalSinIgv, 0);
    const totalSinIgv = toFixed2(subtotal);
    const totalConIgv = toFixed2(totalSinIgv * (1 + IGV));

    return {
      subtotal: toFixed2(subtotal),
      totalSinIgv,
      totalConIgv,
    };
  }, [quotationProducts]);

  // --- Funciones de Manejo ---

  const toggleProduct = (product) => {
    setQuotedItems(prev => {
      const isSelected = prev.some(item => item.product.idx === product.idx);
      if (isSelected) {
        return prev.filter(item => item.product.idx !== product.idx);
      } else {
        return [...prev, { product, quantity: 1, manualDiscounts: [0, 0] }];
      }
    });
  };

  const updateItem = (productIdx, field, value) => {
    setQuotedItems(prev =>
      prev.map(item => {
        if (item.product.idx === productIdx) {
          const newItem = { ...item };
          if (field === 'quantity') {
            newItem.quantity = Math.max(1, parseInt(value, 10) || 1);
          } else if (field.startsWith('manualDiscount')) {
            const index = parseInt(field.replace('manualDiscount', ''), 10);
            const newDiscounts = [...newItem.manualDiscounts];
            newDiscounts[index] = Math.max(0, parseFloat(value) || 0);
            newItem.manualDiscounts = newDiscounts;
          }
          return newItem;
        }
        return item;
      })
    );
  };
  
  const updateClientData = (field, value) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (!quotationProducts.length) return;

    const wb = XLSX.utils.book_new();

    // Datos del cliente
    const clientData = [
      ['RUC', clientData.ruc],
      ['Cliente', clientData.nombre],
      ['OC', clientData.oc],
      [], // fila vacía
    ];

    // Headers de productos
    const headers = [
      'Código',
      'Cantidad',
      'Precio Base',
      'Desc01(suma)',
      'Desc02(suma)',
      'Desc Total Sumado',
      'Total s/IGV',
      'Total c/IGV'
    ];

    // Datos de productos
    const productData = quotationProducts.map(p => [
      p.codigo,
      p.quantity,
      p.precioBase,
      p.descSuma01,
      p.descSuma02,
      p.descSuma01 + p.descSuma02,
      p.totalSinIgv,
      p.totalConIgv
    ]);

    // Totales
    const totalsData = [
      [], // fila vacía
      ['TOTAL s/IGV', '', '', '', '', totals.totalSinIgv],
      ['TOTAL c/IGV', '', '', '', '', totals.totalConIgv],
    ];

    // Combinar todo
    const aoa = [
      ...clientData,
      headers,
      ...productData,
      ...totalsData
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Estilos
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };
    ws['!freeze'] = { xSplit: 0, ySplit: 5 }; // Freeze después de datos cliente

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }
    ];

    // Estilo headers
    const headerRange = XLSX.utils.decode_range('A5:G5');
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 4, c: C })];
      if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'FFE6E6FA' } } };
    }

    const safeSheetName = 'Cotizacion';
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

    // Generar nombre de archivo
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `cotizacion_${clientData.ruc || 'sin-ruc'}_${stamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Volver al Catálogo
              </button>
              <h1 className="text-2xl font-bold">Nueva Cotización</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Datos del cliente */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Datos del Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingrese RUC"
                value={clientData.ruc}
                onChange={(e) => updateClientData('ruc', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre del cliente"
                value={clientData.nombre}
                onChange={(e) => updateClientData('nombre', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="OC-001"
                value={clientData.oc}
                onChange={(e) => updateClientData('oc', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabla de Selección de Productos */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Seleccionar Productos</h2>
              {selectionSaved && selectionLastSaved && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Selección guardada {formatTimeAgo(selectionLastSaved)}</span>
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Buscar producto por código o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                >
                  <option value="TODAS">Todas las líneas</option>
                  {[...new Set(catalogData.map(p => p.linea).filter(Boolean))].sort().map(line => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all visible products
                          const allProducts = filteredCatalog.map(p => ({ product: p, quantity: 1, manualDiscounts: [0, 0] }));
                          setQuotedItems(allProducts);
                        } else {
                          // Deselect all
                          setQuotedItems([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3">Código</th>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3 text-center">Stock</th>
                  <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                  <th scope="col" className="px-4 py-3 text-right">Precio s/IGV</th>
                  <th scope="col" className="px-4 py-3 text-right">Precio c/IGV</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map((product) => {
                  const selectedItem = quotationProducts.find(p => p.idx === product.idx);
                  const isSelected = !!selectedItem;

                  return (
                    <tr key={product.idx} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 font-mono font-medium text-gray-900">{product.codigo}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-sm leading-tight break-words line-clamp-2 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help" title={product.nombre}>
                          {product.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          (product.stock || 0) > 20 ? 'bg-green-100 text-green-800' :
                          (product.stock || 0) > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isSelected ? (
                          <input
                            type="number"
                            min="1"
                            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center font-mono"
                            value={Math.round(selectedItem.quantity)}
                            onChange={(e) => updateItem(product.idx, 'quantity', e.target.value)}
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{isSelected ? formatMoney(selectedItem.unitPrice) : formatMoney(product.precioBase)}</td>
                      <td className="px-4 py-2 text-right font-mono">{isSelected ? formatMoney(selectedItem.unitPrice * (1 + IGV)) : formatMoney(product.precioBase * (1 + IGV))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Resumen de Cotización */}
        {quotationProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen de Cotización</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Código</th>
                    <th scope="col" className="px-4 py-3">Nombre</th>
                    <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                    <th scope="col" className="px-4 py-3 text-right">Precio Base</th>
                    <th scope="col" className="px-4 py-3 text-center">Desc. Suma 1 (%)</th>
                    <th scope="col" className="px-4 py-3 text-center">Desc. Suma 2 (%)</th>
                    <th scope="col" className="px-4 py-3 text-right">Precio Unit. s/IGV</th>
                    <th scope="col" className="px-4 py-3 text-right">Total s/IGV</th>
                    <th scope="col" className="px-4 py-3 text-right">Total c/IGV</th>
                    <th scope="col" className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationProducts.map((p) => (
                    <tr key={p.idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono font-medium text-gray-900">{p.codigo}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-sm leading-tight break-words line-clamp-2 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help" title={p.nombre}>
                          {p.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{Math.round(p.quantity)}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(p.precioBase)}</td>
                      <td className="px-4 py-2 text-center font-mono text-sm">{p.descSuma01 ? Math.round(p.descSuma01).toFixed(0) + '.00%' : '0.00%'}</td>
                      <td className="px-4 py-2 text-center font-mono text-sm">{p.descSuma02 ? (Math.round(p.descSuma02 * 100) / 100).toFixed(2) + '%' : '0.00%'}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(p.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-green-700">{formatMoney(p.totalSinIgv)}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-blue-700">{formatMoney(p.totalConIgv)}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => toggleProduct(p)} className="text-red-500 hover:text-red-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totales y acciones */}
        {quotationProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-lg font-bold border-b border-gray-300 pb-2">
                <span className="text-gray-800">Total s/IGV:</span>
                <span className="text-green-600">{formatMoney(totals.totalSinIgv)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-800">Total c/IGV:</span>
                <span className="text-blue-600">{formatMoney(totals.totalConIgv)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setQuotedItems([]);
                  localStorage.removeItem('cotizacion_seleccion');
                  setSelectionSaved(false);
                  setSelectionLastSaved(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Limpiar Selección
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar XLSX
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}