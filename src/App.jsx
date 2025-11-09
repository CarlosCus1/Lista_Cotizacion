import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { calculatePrice } from './hooks/usePriceCalculator.js';
import { useDebounce } from './hooks/useDebounce.js';
import catalogData from '../catalogo.json';

// Lazy load Cotizacion component to avoid ESLint warning
const LazyCotizacion = (props) => {
  const [CotizacionComponent, setCotizacionComponent] = useState(null);

  useEffect(() => {
    import('./Cotizacion.jsx').then(module => {
      setCotizacionComponent(() => module.default);
    });
  }, []);

  if (!CotizacionComponent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cargando Cotización...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return <CotizacionComponent {...props} />;
};

// Export for use in render - ESLint ignore for this specific case
// eslint-disable-next-line no-unused-vars
const Cotizacion = LazyCotizacion;

const CURRENCY = 'PEN';

/**
 * Rounds a number to 2 decimal places
 * @param {number} n - Number to round
 * @returns {number} Rounded number
 */
function toFixed2(n) {
  return isFinite(n) ? parseFloat(n.toFixed(2)) : 0;
}

/**
 * Formats a number as currency in Peruvian Soles
 * @param {number} n - Number to format
 * @returns {string} Formatted currency string
 */
function formatMoney(n) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: CURRENCY }).format(n || 0);
}

/**
 * Custom hook to track window size changes
 * @returns {[number, number]} Array with [width, height]
 */
// Removed unused useWindowSize hook (not referenced elsewhere)

/**
 * Header component for the product table with sorting functionality
 * @param {Object} props - Component props
 * @param {string} props.sortKey - Current sort field
 * @param {string} props.sortDir - Current sort direction ('asc' | 'desc')
 * @param {Function} props.handleSort - Sort handler function
 * @param {number[]} props.descOcultos - Hidden discount values
 * @returns {JSX.Element} Header component
 */
// Header component removed — not used in the current JSX

/**
 * Row component for individual product data display
 * @param {Object} props - Component props
 * @param {number} props.index - Row index
 * @param {Object} props.style - React Window style object
 * @param {Array} props.data - Array of product data
 * @param {Function} props.updateRow - Function to update row data
 * @returns {JSX.Element|null} Row component or null if no data
 */
// Row component removed — not used in the current JSX


/**
 * Main App component for the interactive pricing catalog
 * @returns {JSX.Element} Main application component
 */
export default function App() {
  // State for product data and loading
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for catalog persistence
  const [catalogSaved, setCatalogSaved] = useState(false);
  const [catalogLastSaved, setCatalogLastSaved] = useState(null);
  const [catalogLastUpdated, setCatalogLastUpdated] = useState(null);

  useEffect(() => {
    // Load saved catalog data first
    loadSavedCatalog();

    // Load saved discounts on component mount
    loadSavedDiscounts();

    // Load saved search filters
    loadSavedSearchFilters();

    // Save catalog data before page unload
    const handleBeforeUnload = () => {
      saveCatalog();
    };

    // Save catalog data periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      saveCatalog();
    }, 30000); // 30 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
    };
  }, []);

  // Auto-save catalog when data changes (but not on initial load)
  useEffect(() => {
    if (data.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        saveCatalog();
      }, 1000); // Debounce auto-save
      return () => clearTimeout(timeoutId);
    }
  }, [data, loading]);

  /**
    * Loads saved catalog data from localStorage
    */
   function loadSavedCatalog() {
     try {
       const saved = localStorage.getItem('catalogo_data');
       if (saved) {
         const { data: savedData, timestamp } = JSON.parse(saved);
         console.log('Catálogo cargado desde localStorage:', savedData.length, 'productos');
         setData(savedData);
         setCatalogSaved(true);
         setCatalogLastSaved(new Date(timestamp));
         setLoading(false);
         return;
       }
     } catch (e) {
       console.warn('Error loading saved catalog:', e);
     }

     // Load from JSON if no valid saved data
     console.log('Cargando catálogo desde JSON');
     const initialData = catalogData.map((row, idx) => ({
       ...row,
       idx,
       precioBase: row.precio,
       descManual1: 0,
       descManual2: 0,
       descManual3: 0,
     }));
     setData(initialData);
     setLoading(false);
   }

  /**
    * Saves current catalog data to localStorage
    */
   function saveCatalog() {
     const catalogDataToSave = {
       data,
       timestamp: Date.now(),
     };
     try {
       localStorage.setItem('catalogo_data', JSON.stringify(catalogDataToSave));
       setCatalogSaved(true);
       setCatalogLastSaved(new Date());
       console.log('Catálogo guardado exitosamente');
     } catch (error) {
       console.error('Error al guardar catálogo:', error);
     }
   }


  /**
    * Updates catalog from JSON file (preserves manual discounts)
    */
   function updateCatalogPreserveDiscounts() {
     // Create a map of existing manual discounts by product code
     const existingDiscounts = {};
     data.forEach(product => {
       existingDiscounts[product.codigo] = {
         descManual1: product.descManual1 || 0,
         descManual2: product.descManual2 || 0,
         descManual3: product.descManual3 || 0,
       };
     });

     const freshData = catalogData.map((row, idx) => ({
       ...row,
       idx,
       precioBase: row.precio,
       descManual1: existingDiscounts[row.codigo]?.descManual1 || 0,
       descManual2: existingDiscounts[row.codigo]?.descManual2 || 0,
       descManual3: existingDiscounts[row.codigo]?.descManual3 || 0,
     }));
     setData(freshData);
     setCatalogLastUpdated(new Date());
     setCatalogSaved(false);
     setCatalogLastSaved(null);
   }

  /**
   * Clears saved catalog data
   */
  function clearCatalog() {
    localStorage.removeItem('catalogo_data');
    setCatalogSaved(false);
    setCatalogLastSaved(null);
    setCatalogLastUpdated(null);

    // Reload from JSON
    const initialData = catalogData.map((row, idx) => ({
      ...row,
      idx,
      precioBase: row.precio,
      descManual1: 0,
      descManual2: 0,
      descManual3: 0,
    }));
    setData(initialData);
  }

  // State for filters and sorting
  const [selectedLine, setSelectedLine] = useState('TODAS');
  const [search, setSearch] = useState('');
  const [descOcultos, setDescOcultos] = useState([0, 0, 0, 0]);
  const [descManualCount, setDescManualCount] = useState(1);

  const [sortKey, setSortKey] = useState('codigo');
  const [sortDir, setSortDir] = useState('asc');

  // State for view management
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' or 'quotation'

  // Debounce search term to improve performance
  const debouncedSearch = useDebounce(search, 300);

  // Memoized unique line options for the filter dropdown
  const lineOptions = useMemo(() => {
    const lines = new Set(data.map((r) => r.linea).filter(Boolean));
    return [...lines].sort();
  }, [data]);


  // Estado para persistencia de descuentos
  const [discountsSaved, setDiscountsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Estado para persistencia de filtros de búsqueda
  const [searchFiltersSaved, setSearchFiltersSaved] = useState(false);
  const [searchFiltersLastSaved, setSearchFiltersLastSaved] = useState(null);

  // Auto-save search filters when they change
  useEffect(() => {
    saveSearchFilters();
  }, [selectedLine, search]);
  
  
  
  const processedRows = useMemo(() => {
    let filteredData = data;

    if (selectedLine !== 'TODAS') {
      filteredData = filteredData.filter((r) => r.linea === selectedLine);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      filteredData = filteredData.filter(
        (r) =>
          String(r.codigo).toLowerCase().includes(q) ||
          String(r.nombre).toLowerCase().includes(q),
      );
    }

    const sortedData = [...filteredData].sort((a, b) => {
      let res = 0;
      if (sortKey === 'codigo') {
        res = String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortKey === 'linea') {
        res = String(a.linea).localeCompare(String(b.linea), undefined, { sensitivity: 'base' });
      }
      return sortDir === 'asc' ? res : -res;
    });

    return sortedData.map((d) => {
      const { neto, final } = calculatePrice(d, descOcultos);
      return {
        ...d,
        neto,
        final,
      };
    });
  }, [data, selectedLine, debouncedSearch, descOcultos, sortKey, sortDir]);

  /**
    * Updates a specific field for a product row
    * @param {number} idx - Index in processed rows
    * @param {string} field - Field name to update
    * @param {any} value - New value
    */
   function updateRow(idx, field, value) {
     setData((prev) => {
       const newData = [...prev];
       const r = processedRows[idx];
       if (!r) return prev;

       const originalIndex = data.findIndex(item => item.idx === r.idx);
       if (originalIndex === -1) return prev;

       newData[originalIndex] = {
         ...newData[originalIndex],
         [field]: parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0,
       };

       return newData;
     });
   }

  /**
   * Handles sorting by toggling direction or changing sort key
   * @param {string} key - Sort field ('codigo' | 'linea')
   */
  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  /**
   * Updates hidden discount values
   * @param {number} i - Index of discount (0-3)
   * @param {any} v - New discount value
   */
  function setDescOculto(i, v) {
    setDescOcultos((arr) => {
      const next = arr.slice();
      next[i] = Math.max(0, parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0);
      return next;
    });
  }

  /**
   * Saves current discount configuration to localStorage
   */
  function saveDiscounts() {
    const discountData = {
      descOcultos,
      timestamp: Date.now(),
    };
    localStorage.setItem('precios_descuentos', JSON.stringify(discountData));
    setDiscountsSaved(true);
    setLastSaved(new Date());
  }

  /**
   * Loads saved discount configuration from localStorage
   */
  function loadSavedDiscounts() {
    try {
      const saved = localStorage.getItem('precios_descuentos');
      if (saved) {
        const { descOcultos: savedOcultos, timestamp } = JSON.parse(saved);
        // Only load if saved within last 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < thirtyDays) {
          setDescOcultos(savedOcultos);
          setDiscountsSaved(true);
          setLastSaved(new Date(timestamp));
        }
      }
    } catch (e) {
      console.warn('Error loading saved discounts:', e);
    }
  }

  /**
   * Clears all discounts and removes from localStorage
   */
  function clearDiscounts() {
    setDescOcultos([0, 0, 0, 0]);
    localStorage.removeItem('precios_descuentos');
    setDiscountsSaved(false);
    setLastSaved(null);
  }

  /**
   * Loads saved search filters from localStorage
   */
  function loadSavedSearchFilters() {
    try {
      const saved = localStorage.getItem('search_filters');
      if (saved) {
        const { selectedLine: savedLine, search: savedSearch, timestamp } = JSON.parse(saved);
        // Only load if saved within last 24 hours
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < oneDay) {
          setSelectedLine(savedLine || 'TODAS');
          setSearch(savedSearch || '');
          setSearchFiltersSaved(true);
          setSearchFiltersLastSaved(new Date(timestamp));
        }
      }
    } catch (e) {
      console.warn('Error loading saved search filters:', e);
    }
  }

  /**
   * Saves current search filters to localStorage
   */
  function saveSearchFilters() {
    const filtersData = {
      selectedLine,
      search,
      timestamp: Date.now(),
    };
    localStorage.setItem('search_filters', JSON.stringify(filtersData));
    setSearchFiltersSaved(true);
    setSearchFiltersLastSaved(new Date());
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

  /**
   * Exports current filtered data to Excel XLSX format
   */
  function downloadXLSX() {
    if (!processedRows.length) return;

    const wb = XLSX.utils.book_new();
    const linesToExport =
      selectedLine === 'TODAS'
        ? [...new Set(processedRows.map((r) => r.linea))].filter(Boolean)
        : [selectedLine];

    for (const ln of linesToExport) {
      const rowsForLine = processedRows.filter((r) => r.linea === ln);
      if (rowsForLine.length === 0) continue;

      const header = [
        'código', 'línea', 'nombre', 'precioBase', 'descOculto1', 'descOculto2',
        'descOculto3', 'descOculto4', 'descManual1', 'descManual2', 'neto', '+IGV', 'final',
      ];

      const aoa = [header, ...rowsForLine.map(r => [
        r.codigo ?? '',
        r.linea ?? '',
        r.nombre ?? '',
        r.precioBase, // This is the original priceBase
        ...descOcultos.map(v => parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0),
        r.descManual1,
        r.descManual2,
        r.neto,
        r.final,
        r.final,
      ])];

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Add autofilter
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };

      // Set column widths
      ws['!cols'] = [
        { wch: 14 }, { wch: 16 }, { wch: 48 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      ];

      // Freeze header row
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      // Style header row (bold)
      const moneyCols = new Set([3, 10, 11, 12]);
      for (let C = 0; C < header.length; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) cell.s = { font: { bold: true } };
      }

      // Format money columns
      for (let R = 1; R < aoa.length; R++) {
        for (const C of moneyCols) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell) cell.z = '#,##0.00';
        }
      }

      const safeSheetName = (ln || 'Sheet').slice(0, 31).replace(/[/\\?*[\]:]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }

    // Generate timestamp for filename
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const lineName = selectedLine === 'TODAS' ? 'TODAS' : selectedLine;
    const descStr = descOcultos.map(v => String(parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0).replace(/\./g, '-')).join('-');
    const fileName = `precios_${lineName.toLowerCase()}-descuentos${descStr}_${stamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  // Renderizar vista según el estado actual
  if (currentView === 'quotation') {
    return (
      <LazyCotizacion
        onBack={() => setCurrentView('catalog')}
        catalogData={data}
        descOcultos={descOcultos}
      />
    );
  }

  // Vista del catálogo
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Navigation Toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-blue-600 text-white shadow-md"
              >
                📋 Catálogo
              </button>
              <button
                onClick={() => setCurrentView('quotation')}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-purple-600 text-white shadow-md"
              >
                🧾 Cotización
              </button>
            </div>
          </div>

          {/* Catalog Management Buttons */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-100 p-1 rounded-lg flex gap-2">
              <button
                onClick={saveCatalog}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Grabar Catálogo
              </button>
              <button
                onClick={updateCatalogPreserveDiscounts}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Actualizar Catálogo
              </button>
              <button
                onClick={clearCatalog}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Limpiar Catálogo
              </button>
            </div>
          </div>

          {/* Catalog and Search Filters Status */}
          {((catalogSaved || catalogLastUpdated) || (searchFiltersSaved && searchFiltersLastSaved)) && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {catalogSaved && catalogLastSaved && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Catálogo guardado {formatTimeAgo(catalogLastSaved)}</span>
                  </div>
                )}
                {catalogLastUpdated && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Actualizado {formatTimeAgo(catalogLastUpdated)}</span>
                  </div>
                )}
                {searchFiltersSaved && searchFiltersLastSaved && (
                  <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Filtros guardados {formatTimeAgo(searchFiltersLastSaved)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile: stacked layout */}
          <div className="block md:hidden space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">Línea</label>
                <select
                  className="border border-gray-300 rounded-md px-2 py-2 bg-white text-sm"
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                >
                  <option value="TODAS">TODAS</option>
                  {lineOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                  placeholder="código o nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700 mb-1">Desc. ocultos (%)</span>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="border border-gray-300 rounded px-1 py-1 text-xs text-center"
                    placeholder={`v${i + 1}`}
                    value={descOcultos[i]}
                    onChange={(e) => setDescOculto(i, e.target.value)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={downloadXLSX}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm"
            >
              Descargar XLSX
            </button>
          </div>

          {/* Desktop: original layout */}
          <div className="hidden md:flex md:items-center md:justify-between gap-4">
            <div className="flex gap-4 flex-1">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Línea</label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                >
                  <option value="TODAS">TODAS</option>
                  {lineOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2"
                  placeholder="código o nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 mb-1">Desc. ocultos</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      placeholder={`v${i + 1}`}
                      value={descOcultos[i]}
                      onChange={(e) => setDescOculto(i, e.target.value)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveDiscounts}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Guardar
                    </button>
                    <button
                      onClick={clearDiscounts}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Limpiar
                    </button>
                  </div>

                  {discountsSaved && lastSaved && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Guardado {formatTimeAgo(lastSaved)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadXLSX}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Descargar XLSX
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
           <div className="relative">
             {processedRows.length === 0 && !loading ? (
               <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                 <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-lg font-medium">No se encontraron productos.</p>
                 <p className="text-sm">Intenta ajustar tus filtros o búsqueda.</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full min-w-[800px]">
                   <thead className="sticky top-0 z-10 bg-blue-800 text-white font-bold text-sm shadow-md">
                     <tr>
                       <th className="px-3 py-3 text-left border-r border-blue-600 min-w-[96px]">
                         <button
                           className="hover:text-blue-200 transition-colors text-sm font-bold"
                           onClick={() => handleSort('codigo')}
                           title="Ordenar por código"
                           aria-label={`Ordenar por código ${sortKey === 'codigo' ? (sortDir === 'asc' ? 'ascendente' : 'descendente') : ''}`}
                         >
                           código
                           {sortKey === 'codigo' && (
                             <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                           )}
                         </button>
                       </th>
                       <th className="px-3 py-3 border-r border-blue-600 min-w-[200px]">nombre</th>
                       <th className="px-3 py-3 text-center border-r border-blue-600 min-w-[80px]">stock</th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[112px]">precio base</th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[80px]">desc1</th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[80px]">desc2</th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[80px]">desc3</th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[80px]">desc4</th>
                       <th className="px-3 py-3 text-center border-r border-blue-600 min-w-[80px]">Especial 1</th>
                       {descManualCount >= 2 && (
                         <th className="px-3 py-3 text-center border-r border-blue-600 min-w-[80px]">Especial 2</th>
                       )}
                       {descManualCount >= 3 && (
                         <th className="px-3 py-3 text-center border-r border-blue-600 min-w-[80px]">Especial 3</th>
                       )}
                       <th className="px-3 py-3 text-center border-r border-blue-600 min-w-[80px]">
                         <div className="flex items-center gap-1 justify-center">
                           {descManualCount > 1 && (
                             <button
                               onClick={() => setDescManualCount(Math.max(1, descManualCount - 1))}
                               className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium flex items-center justify-center transition-colors"
                               title="Quitar descuento manual"
                             >
                               −
                             </button>
                           )}
                           {descManualCount < 3 && (
                             <button
                               onClick={() => setDescManualCount(Math.min(3, descManualCount + 1))}
                               className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium flex items-center justify-center transition-colors"
                               title="Agregar descuento manual"
                             >
                               +
                             </button>
                           )}
                         </div>
                       </th>
                       <th className="px-3 py-3 text-right border-r border-blue-600 min-w-[112px]">s/igv</th>
                       <th className="px-3 py-3 text-right min-w-[112px]">c/igv</th>
                     </tr>
                   </thead>
                   <tbody className="max-h-[600px] overflow-y-auto block">
                     {processedRows.map((r, dataIndex) => (
                       <tr key={r.idx} className="border-b border-gray-200 hover:bg-gray-50">
                         <td className="px-3 py-3 truncate font-mono text-sm border-r border-gray-200">{r.codigo}</td>
                         <td className="px-3 py-3 border-r border-gray-200">
                           <div className="font-medium text-sm leading-tight break-words line-clamp-2 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help" title={r.nombre}>
                             {r.nombre}
                           </div>
                         </td>
                         <td className="px-3 py-3 text-center border-r border-gray-200">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                             (r.stock || 0) > 20 ? 'bg-green-100 text-green-800' :
                             (r.stock || 0) > 10 ? 'bg-yellow-100 text-yellow-800' :
                             'bg-red-100 text-red-800'
                           }`}>
                             {r.stock || 0}
                           </span>
                         </td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono text-sm border-r border-gray-200">{formatMoney(r.precioBase)}</td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200">{r.desc1 ? toFixed2(r.desc1).toFixed(2) : '0.00'}</td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200">{r.desc2 ? toFixed2(r.desc2).toFixed(2) : '0.00'}</td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200">{r.desc3 ? toFixed2(r.desc3).toFixed(2) : '0.00'}</td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200">{r.desc4 ? toFixed2(r.desc4).toFixed(2) : '0.00'}</td>

                         <td className="px-3 py-3 text-center border-r border-gray-200">
                           <input
                             type="number"
                             min="0"
                             max="100"
                             step="0.01"
                             className="w-16 border border-gray-300 rounded px-2 py-1 text-right tabular-nums text-sm"
                             value={r.descManual1}
                             onChange={(e) => updateRow(dataIndex, 'descManual1', e.target.value)}
                           />
                         </td>
                         {descManualCount >= 2 && (
                           <td className="px-3 py-3 text-center border-r border-gray-200">
                             <input
                               type="number"
                               min="0"
                               max="100"
                               step="0.01"
                               className="w-16 border border-gray-300 rounded px-2 py-1 text-right tabular-nums text-sm"
                               value={r.descManual2}
                               onChange={(e) => updateRow(dataIndex, 'descManual2', e.target.value)}
                             />
                           </td>
                         )}
                         {descManualCount >= 3 && (
                           <td className="px-3 py-3 text-center border-r border-gray-200">
                             <input
                               type="number"
                               min="0"
                               max="100"
                               step="0.01"
                               className="w-16 border border-gray-300 rounded px-2 py-1 text-right tabular-nums text-sm"
                               value={r.descManual3 || 0}
                               onChange={(e) => updateRow(dataIndex, 'descManual3', e.target.value)}
                             />
                           </td>
                         )}
                         <td className="px-3 py-3 border-r border-gray-200"></td>

                         <td className="px-3 py-3 text-right tabular-nums font-mono text-green-700 text-sm border-r border-gray-200">{formatMoney(r.neto)}</td>
                         <td className="px-3 py-3 text-right tabular-nums font-mono font-bold text-blue-700 text-sm">{formatMoney(r.final)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

          <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 text-sm">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 mb-3 sm:mb-0">
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm">Cargando...</span>
                </div>
              ) : (
                <span className="font-medium text-xs sm:text-sm">{processedRows.length} registros</span>
              )}
              {selectedLine !== 'TODAS' && (
                <span className="text-gray-500 text-xs sm:text-sm">• Línea: <span className="font-medium text-gray-700">{selectedLine}</span></span>
              )}
              {search && (
                <span className="text-gray-500 text-xs sm:text-sm">• Búsqueda: <span className="font-medium text-gray-700">"{search}"</span></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">Total visible:</span>
              <span className="font-bold text-base sm:text-lg text-blue-700">
                {formatMoney(processedRows.reduce((a, r) => a + (r.final || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}