import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { calculatePrice } from './hooks/usePriceCalculator';
import { useDebounce } from './hooks/useDebounce';
import { formatMoney, formatTimeAgo, toFixed2 } from './utils/formatters.js';

const IGV = 0.18;

export default function Cotizacion({ onBack, catalogData = [], descOcultos = [] }) {
  // Procesar catálogo para usar campo orden (número original del catálogo)
  const processedCatalogData = useMemo(() => {
    return catalogData;
  }, [catalogData]);

  // Estado del cliente
  const [clientData, setClientData] = useState({
    ruc: '',
    nombre: '',
    oc: ''
  });

  // Validaciones de campos
  const validateRUC = (value) => {
    const cleanValue = value.replace(/\D/g, ''); // Solo números
    return cleanValue.length === 11 || cleanValue.length === 8; // RUC (11) o DNI (8)
  };

  const validateOC = (value) => {
    return /^\d*$/.test(value); // Solo números
  };

  const isRUCValid = clientData.ruc === '' || validateRUC(clientData.ruc);
  const isOCValid = clientData.oc === '' || validateOC(clientData.oc);

  // Estado de la cotización
  const [quotedItems, setQuotedItems] = useState([]);

  // Estado de filtros para el catálogo
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState('TODAS');

  // Estado para persistencia de selección
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [selectionLastSaved, setSelectionLastSaved] = useState(null);

  // Estado para ordenamiento y paginación de la tabla de resumen
  const [sortKey, setSortKey] = useState('codigo');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Estado para ordenamiento y paginación de la tabla de selección
  const [selectionSortKey, setSelectionSortKey] = useState('orden');
  const [selectionSortDir, setSelectionSortDir] = useState('asc');
  const [selectionCurrentPage, setSelectionCurrentPage] = useState(1);
  const [selectionPageSize, setSelectionPageSize] = useState(50);

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

  // Término de búsqueda debounced para mejorar rendimiento
  const debouncedSearch = useDebounce(search, 300);

  const filteredCatalog = useMemo(() => {
    let filtered = processedCatalogData;

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

    // Agregar información de selección y descuentos manuales a cada producto
    const catalogWithSelection = filtered.map(product => {
      const selectedItem = quotedItems.find(item => item.product.idx === product.idx);

      // Calcular precio unitario consistente (con descuentos aplicados)
      let productForPriceCalc = product;
      if (selectedItem) {
        // Si el producto ya tiene descuentos manuales, incluirlos en el cálculo
        productForPriceCalc = {
          ...product,
          descManual1: selectedItem.manualDiscounts[0] || 0,
          descManual2: selectedItem.manualDiscounts[1] || 0,
        };
      }
      const { neto: unitPrice } = calculatePrice(productForPriceCalc, descOcultos);

      return {
        ...product,
        isSelected: !!selectedItem,
        selectedItem: selectedItem || null,
        unitPrice, // Precio unitario consistente con descuentos aplicados
      };
    });

    // Ordenar
    const sorted = [...catalogWithSelection].sort((a, b) => {
      let res = 0;
      if (selectionSortKey === 'orden') {
        res = (a.orden || 999999) - (b.orden || 999999);
      } else if (selectionSortKey === 'codigo') {
        res = String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true, sensitivity: 'base' });
      } else if (selectionSortKey === 'nombre') {
        res = String(a.nombre).localeCompare(String(b.nombre), undefined, { sensitivity: 'base' });
      } else if (selectionSortKey === 'stock') {
        res = (a.stock || 0) - (b.stock || 0);
      } else if (selectionSortKey === 'precio_lista') {
        res = a.precio_lista - b.precio_lista;
      } else if (selectionSortKey === 'precio_igv') {
        res = (a.precio_lista * (1 + IGV)) - (b.precio_lista * (1 + IGV));
      } else if (selectionSortKey === 'descManual1') {
        res = (a.selectedItem?.manualDiscounts[0] || 0) - (b.selectedItem?.manualDiscounts[0] || 0);
      } else if (selectionSortKey === 'descManual2') {
        res = (a.selectedItem?.manualDiscounts[1] || 0) - (b.selectedItem?.manualDiscounts[1] || 0);
      }
      return selectionSortDir === 'asc' ? res : -res;
    });

    return sorted;
  }, [processedCatalogData, selectedLine, debouncedSearch, selectionSortKey, selectionSortDir, quotedItems]);

  // Paginación para selección
  const selectionTotalItems = filteredCatalog.length;
  const selectionTotalPages = Math.ceil(selectionTotalItems / selectionPageSize);
  const selectionStartIndex = (selectionCurrentPage - 1) * selectionPageSize;
  const selectionEndIndex = selectionStartIndex + selectionPageSize;
  const paginatedCatalog = filteredCatalog.slice(selectionStartIndex, selectionEndIndex);

  // Calcular productos de cotización con precios
  const quotationProducts = useMemo(() => {
    let products = quotedItems.map(item => {
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

      // Cálculo de totales: cantidad * precio_final_ya_con_descuentos_aplicados
      const finalUnitPrice = neto;
      const totalSinIgv = toFixed2(item.quantity * neto);
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

    // Ordenar productos
    products.sort((a, b) => {
      let res = 0;
      if (sortKey === 'orden') {
        res = (a.orden || 999999) - (b.orden || 999999);
      } else if (sortKey === 'codigo') {
        res = String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortKey === 'nombre') {
        res = String(a.nombre).localeCompare(String(b.nombre), undefined, { sensitivity: 'base' });
      } else if (sortKey === 'cantidad') {
        res = a.quantity - b.quantity;
      } else if (sortKey === 'precio_base') {
        res = a.precio_lista - b.precio_lista;
      } else if (sortKey === 'precio_unitario') {
        res = a.unitPrice - b.unitPrice;
      } else if (sortKey === 'subtotal') {
        res = parseFloat(a.totalSinIgv) - parseFloat(b.totalSinIgv);
      } else if (sortKey === 'total') {
        res = parseFloat(a.totalConIgv) - parseFloat(b.totalConIgv);
      }
      return sortDir === 'asc' ? res : -res;
    });

    return products;
  }, [quotedItems, descOcultos, sortKey, sortDir]);

  // Paginación para cotización
  const totalItems = quotationProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = quotationProducts.slice(startIndex, endIndex);

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
    let cleanValue = value;

    // Aplicar validaciones y limpieza según el campo
    if (field === 'ruc') {
      cleanValue = value.replace(/\D/g, ''); // Solo números
      // Limitar a 11 dígitos máximo
      if (cleanValue.length > 11) {
        cleanValue = cleanValue.slice(0, 11);
      }
    } else if (field === 'oc') {
      cleanValue = value.replace(/\D/g, ''); // Solo números
    }
    // Cliente (nombre) permite texto libre, sin restricciones

    setClientData(prev => ({
      ...prev,
      [field]: cleanValue
    }));
  };

  // Función de ordenamiento para tabla de resumen
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1); // Resetear página al cambiar orden
  };

  // Función de ordenamiento para tabla de selección
  const handleSelectionSort = (key) => {
    if (selectionSortKey === key) {
      setSelectionSortDir(selectionSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSelectionSortKey(key);
      setSelectionSortDir('asc');
    }
    setSelectionCurrentPage(1); // Resetear página al cambiar orden
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (!quotationProducts.length) return;

    const wb = XLSX.utils.book_new();

    // Título del documento
    const titleData = [
      ['COTIZACIÓN'],
      [`Cliente: ${clientData.nombre || 'No especificado'}`],
      [`RUC: ${clientData.ruc || 'No especificado'}`, `OC: ${clientData.oc || 'No especificado'}`],
      [`Fecha: ${new Date().toLocaleDateString('es-PE')}`],
      [], // fila vacía
    ];

    // Headers base de productos
    const baseHeaders = [
      '#',
      'Código',
      'Nombre',
      'Cantidad',
      'Precio Lista'
    ];

    // Datos base de productos
    const baseProductData = quotationProducts.map((p, index) => [
      p.orden || index + 1,           // índice original
      p.codigo,                       // codigo
      p.nombre,                       // nombre
      p.quantity,                     // cantidad
      p.precio_lista                  // precio_lista
    ]);

    // Verificar qué descuentos están disponibles y tienen valores > 0
    const availableDiscounts = [];

    // Descuentos fijos del producto (desc1, desc2, desc3, desc4)
    for (let i = 1; i <= 4; i++) {
      const hasValue = quotationProducts.some(p => (p[`desc${i}`] || 0) > 0);
      if (hasValue) {
        availableDiscounts.push({
          key: `desc${i}`,
          header: `Desc. Fijo ${i} (%)`,
          dataIndex: baseHeaders.length + availableDiscounts.length
        });
      }
    }

    // Descuentos manuales (descManual1, descManual2, descManual3)
    for (let i = 1; i <= 3; i++) {
      const hasValue = quotationProducts.some(p => (p[`descManual${i}`] || 0) > 0);
      if (hasValue) {
        availableDiscounts.push({
          key: `descManual${i}`,
          header: `Desc. Adic. ${i} (%)`,
          dataIndex: baseHeaders.length + availableDiscounts.length
        });
      }
    }

    // Agregar headers de descuentos disponibles
    availableDiscounts.forEach(discount => {
      baseHeaders.push(discount.header);
    });

    // Agregar datos de descuentos disponibles
    baseProductData.forEach((row, index) => {
      availableDiscounts.forEach(discount => {
        const value = quotationProducts[index][discount.key] || 0;
        row.push(Math.round(value * 100) / 100);
      });
    });

    // Agregar headers finales
    baseHeaders.push(
      'Desc. Cliente (%)',
      'Desc. Producto (%)',
      'Precio Unitario',
      'Subtotal',
      'Total c/IGV'
    );

    // Agregar datos finales
    baseProductData.forEach((row, index) => {
      const p = quotationProducts[index];
      row.push(
        p.descSuma01 ? Math.round(p.descSuma01 * 100) / 100 : 0, // desc_cliente_%
        p.descSuma02 ? Math.round(p.descSuma02 * 100) / 100 : 0, // desc_fijos_%
        p.unitPrice,                    // precio_unitario
        p.totalSinIgv,                  // subtotal
        p.totalConIgv                   // total_con_igv
      );
    });

    // Verificar qué columnas tienen todos valores cero y filtrarlas
    const columnsToKeep = [];
    const filteredHeaders = [];
    const filteredProductData = [];
    const baseColumnWidths = [
      { wch: 6 },  // índice
      { wch: 12 }, // código
      { wch: 40 }, // nombre
      { wch: 10 }, // cantidad
      { wch: 14 }, // precio_lista
      // Anchos para descuentos dinámicos
      ...availableDiscounts.map(() => ({ wch: 16 })),
      { wch: 16 }, // desc_cliente_%
      { wch: 16 }, // desc_fijos_%
      { wch: 16 }, // precio_unitario
      { wch: 14 }, // subtotal
      { wch: 14 }  // total_con_igv
    ];
    const filteredColumnWidths = [];

    baseHeaders.forEach((header, index) => {
      // Siempre mantener Índice, Código, Nombre, Cantidad, Precio Unitario, Subtotal, Total c/IGV
      const alwaysKeep = ['#', 'Código', 'Nombre', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Total c/IGV'].includes(header);

      if (alwaysKeep) {
        columnsToKeep.push(index);
        filteredHeaders.push(header);
        filteredColumnWidths.push(baseColumnWidths[index]);
      } else {
        // Verificar si todos los valores en esta columna son cero
        const allZero = baseProductData.every(row => row[index] === 0 || row[index] === '0' || row[index] === null || row[index] === undefined);
        if (!allZero) {
          columnsToKeep.push(index);
          filteredHeaders.push(header);
          filteredColumnWidths.push(baseColumnWidths[index]);
        }
      }
    });

    // Filtrar los datos de productos según las columnas a mantener
    baseProductData.forEach(row => {
      const filteredRow = columnsToKeep.map(colIndex => row[colIndex]);
      filteredProductData.push(filteredRow);
    });

    // Usar headers y datos filtrados
    const headers = filteredHeaders;
    const productData = filteredProductData;

    // Crear fila de totales ajustada a las columnas filtradas
    const totalRow = ['TOTALES'];
    // Agregar celdas vacías para las columnas que no son totales (desde índice 1 hasta length-3)
    for (let i = 1; i < headers.length - 2; i++) {
      totalRow.push('');
    }
    // Agregar los totales al final
    totalRow.push(totals.totalSinIgv, totals.totalConIgv);

    // Crear filas de guía de fórmulas
    const formulaGuideRows = [
      [], // fila vacía
      ['💡 GUÍAS DE FÓRMULAS (Alt+Shift+= para autosuma):'],
      ['• Subtotal producto: =[Cantidad] * [Precio Unitario]'],
      ['• Total con IGV: =[Subtotal] * 1.18'],
      ['• Suma totales: Selecciona celdas y presiona Alt+Shift+='],
      [], // fila vacía
    ];

    const totalsData = [
      ...formulaGuideRows,
      [], // fila vacía
      totalRow,
    ];

    // Combinar título, headers, datos y totales
    const aoa = [
      ...titleData,
      headers,
      ...productData,
      ...totalsData
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Estilos generales
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };
    ws['!freeze'] = { xSplit: 0, ySplit: 6 }; // Freeze después del título

    // Column widths dinámicas según columnas filtradas
    ws['!cols'] = filteredColumnWidths;

    // Definir estilos comunes
    const borderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    const headerStyle = {
      font: { bold: true, sz: 11, name: 'Arial' },
      fill: { fgColor: { rgb: 'FF4F81BD' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderStyle
    };

    const titleStyle = {
      font: { bold: true, sz: 14, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    const dataStyle = {
      font: { sz: 10, name: 'Arial' },
      border: borderStyle
    };

    const numberStyle = {
      ...dataStyle,
      alignment: { horizontal: 'right', vertical: 'center' },
      numFmt: '#,##0.00'
    };

    const percentStyle = {
      ...dataStyle,
      alignment: { horizontal: 'center', vertical: 'center' },
      numFmt: '0.00%'
    };

    const textStyle = {
      ...dataStyle,
      alignment: { horizontal: 'left', vertical: 'center' }
    };

    const totalStyle = {
      font: { bold: true, sz: 11, name: 'Arial' },
      fill: { fgColor: { rgb: 'FFD9D9D9' } },
      border: borderStyle,
      alignment: { horizontal: 'right', vertical: 'center' }
    };

    // Función helper para obtener el índice de columna por nombre de header
    const getColumnIndex = (headerName) => {
      return headers.indexOf(headerName);
    };

    // Aplicar estilos a cada celda
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell) continue;

        // Título (fila 0)
        if (R === 0) {
          cell.s = titleStyle;
        }
        // Información del cliente (filas 1-3)
        else if (R >= 1 && R <= 3) {
          cell.s = { font: { sz: 10, name: 'Arial' }, alignment: { horizontal: 'left', vertical: 'center' } };
        }
        // Headers (fila 5)
        else if (R === 5) {
          cell.s = headerStyle;
        }
        // Datos de productos
        else if (R >= 6 && R < 6 + productData.length) {
          const rowIndex = R - 6;
          const isEvenRow = rowIndex % 2 === 0;

          // Fondo alternado para filas pares
          const baseStyle = isEvenRow ? { ...dataStyle, fill: { fgColor: { rgb: 'FFF2F2F2' } } } : dataStyle;

          const headerName = headers[C];
          if (headerName === '#') {
            cell.s = { ...baseStyle, alignment: { horizontal: 'center', vertical: 'center' } };
          } else if (headerName === 'Código') {
            cell.s = { ...baseStyle, alignment: { horizontal: 'center', vertical: 'center' } };
          } else if (headerName === 'Nombre') {
            cell.s = { ...baseStyle, alignment: { horizontal: 'left', vertical: 'center' } };
          } else if (headerName === 'Cantidad') {
            cell.s = { ...baseStyle, alignment: { horizontal: 'center', vertical: 'center' }, numFmt: '0' };
          } else if (['Precio Lista', 'Precio Unitario', 'Subtotal'].includes(headerName)) {
            cell.s = { ...numberStyle, fill: baseStyle.fill };
          } else if (headerName === 'Total c/IGV') {
            cell.s = { ...numberStyle, fill: baseStyle.fill, font: { ...numberStyle.font, bold: true } };
          } else if (headerName.includes('Desc.')) {
            // Todos los descuentos usan formato de porcentaje
            cell.s = { ...numberStyle, fill: baseStyle.fill, numFmt: '0.00%' };
          } else {
            cell.s = baseStyle;
          }
        }
        // Fila de totales
        else if (R === 6 + productData.length + 1) {
          const headerName = headers[C];
          if (headerName === 'Código' || C === 0) { // "TOTALES"
            cell.s = { ...totalStyle, alignment: { horizontal: 'left', vertical: 'center' }, font: { ...totalStyle.font, bold: true } };
          } else if (['Subtotal', 'Total c/IGV'].includes(headerName)) {
            cell.s = { ...totalStyle, font: { ...totalStyle.font, bold: true, sz: 12 } };
          } else {
            cell.s = totalStyle;
          }
        }
      }
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUC/DNI
                {!isRUCValid && clientData.ruc && (
                  <span className="text-red-500 text-xs ml-2">• Debe ser 8 (DNI) o 11 (RUC) dígitos</span>
                )}
              </label>
              <input
                type="text"
                className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 transition-colors ${!isRUCValid && clientData.ruc
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                placeholder="Ingrese RUC (11 dígitos) o DNI (8 dígitos)"
                value={clientData.ruc}
                onChange={(e) => updateClientData('ruc', e.target.value)}
                maxLength="11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre del cliente o empresa"
                value={clientData.nombre}
                onChange={(e) => updateClientData('nombre', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Compra
                {!isOCValid && clientData.oc && (
                  <span className="text-red-500 text-xs ml-2">• Solo números permitidos</span>
                )}
              </label>
              <input
                type="text"
                className={`w-full border-2 rounded-lg px-3 py-2 focus:ring-2 transition-colors ${!isOCValid && clientData.oc
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                placeholder="Ingrese número de orden de compra"
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
              <h2 className="text-xl font-bold text-gray-800">Seleccionar Productos para Cotización</h2>
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
                  placeholder="Buscar productos por código, nombre o descripción..."
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
                  {[...new Set(processedCatalogData.map(p => p.linea).filter(Boolean))].sort().map(line => (
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
                    <button onClick={() => handleSelectionSort('orden')} className="hover:text-blue-600 flex items-center gap-1">
                      #
                      {selectionSortKey === 'orden' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Seleccionar todos los productos visibles
                          const allProducts = paginatedCatalog.map(p => ({ product: p, quantity: 1, manualDiscounts: [0, 0] }));
                          setQuotedItems(allProducts);
                        } else {
                          // Deseleccionar todos
                          setQuotedItems([]);
                        }
                      }}
                      checked={paginatedCatalog.length > 0 && paginatedCatalog.every(p => p.isSelected)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button onClick={() => handleSelectionSort('codigo')} className="hover:text-blue-600 flex items-center gap-1">
                      Código
                      {selectionSortKey === 'codigo' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button onClick={() => handleSelectionSort('nombre')} className="hover:text-blue-600 flex items-center gap-1">
                      Nombre
                      {selectionSortKey === 'nombre' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button onClick={() => handleSelectionSort('stock')} className="hover:text-blue-600 flex items-center gap-1">
                      Stock
                      {selectionSortKey === 'stock' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button onClick={() => handleSelectionSort('precio_lista')} className="hover:text-blue-600 flex items-center gap-1">
                      Precio s/IGV
                      {selectionSortKey === 'precio_lista' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <button onClick={() => handleSelectionSort('precio_igv')} className="hover:text-blue-600 flex items-center gap-1">
                      Precio c/IGV
                      {selectionSortKey === 'precio_igv' && <span>{selectionSortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCatalog.map((product, index) => {
                  const { isSelected, selectedItem } = product;

                  return (
                    <tr key={product.idx} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-2 text-center font-mono text-sm text-gray-500">{product.orden || index + 1}</td>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${(product.stock || 0) > 20 ? 'bg-green-100 text-green-800' :
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
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(product.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(product.unitPrice * (1 + IGV))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Controles de Paginación para Selección */}
        {selectionTotalItems > 0 && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Mostrar:</label>
                <select
                  value={selectionPageSize}
                  onChange={(e) => {
                    setSelectionPageSize(Number(e.target.value));
                    setSelectionCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">por página</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectionCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={selectionCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹ Anterior
                </button>

                <span className="text-sm text-gray-700">
                  Página {selectionCurrentPage} de {selectionTotalPages}
                </span>

                <button
                  onClick={() => setSelectionCurrentPage(prev => Math.min(selectionTotalPages, prev + 1))}
                  disabled={selectionCurrentPage === selectionTotalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Resumen de Cotización */}
        {quotationProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen de Cotización</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-center">
                      <button onClick={() => handleSort('orden')} className="hover:text-blue-600 flex items-center gap-1">
                        #
                        {sortKey === 'orden' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button onClick={() => handleSort('codigo')} className="hover:text-blue-600 flex items-center gap-1">
                        Código
                        {sortKey === 'codigo' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button onClick={() => handleSort('nombre')} className="hover:text-blue-600 flex items-center gap-1">
                        Nombre
                        {sortKey === 'nombre' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      <button onClick={() => handleSort('cantidad')} className="hover:text-blue-600 flex items-center gap-1">
                        Cantidad
                        {sortKey === 'cantidad' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <button onClick={() => handleSort('precio_base')} className="hover:text-blue-600 flex items-center gap-1">
                        Precio Base
                        {sortKey === 'precio_base' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">Desc. Cliente (%)</th>
                    <th scope="col" className="px-4 py-3 text-center">Desc. Producto (%)</th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <button onClick={() => handleSort('precio_unitario')} className="hover:text-blue-600 flex items-center gap-1">
                        Precio Unitario
                        {sortKey === 'precio_unitario' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <button onClick={() => handleSort('subtotal')} className="hover:text-blue-600 flex items-center gap-1">
                        Subtotal
                        {sortKey === 'subtotal' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <button onClick={() => handleSort('total')} className="hover:text-blue-600 flex items-center gap-1">
                        Total c/IGV
                        {sortKey === 'total' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p, index) => {
                    return (
                      <tr key={p.idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-center font-mono text-sm text-gray-500">{p.orden || index + 1}</td>
                        <td className="px-4 py-2 font-mono font-medium text-gray-900">{p.codigo}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-sm leading-tight break-words line-clamp-2 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help" title={p.nombre}>
                          {p.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{Math.round(p.quantity)}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(p.precio_lista)}</td>
                      <td className="px-4 py-2 text-center font-mono text-sm">{p.descSuma01 ? (Math.round(p.descSuma01 * 100) / 100).toFixed(2) + '%' : '0.00%'}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Controles de Paginación para Cotización */}
        {quotationProducts.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Mostrar:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">por página</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹ Anterior
                </button>

                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Totales y acciones */}
        {quotationProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-lg font-bold border-b border-gray-300 pb-2">
                <span className="text-gray-800">Subtotal (sin IGV):</span>
                <span className="text-green-600">{formatMoney(totals.totalSinIgv)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-800">Total (con IGV):</span>
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
                Generar Cotización
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}