
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { calculatePrice, calculateCompoundHiddenDiscount } from './hooks/usePriceCalculator.js';
import { useDebounce } from './hooks/useDebounce.js';
import catalogData from '../catalogo.json';
import DataTable from './components/DataTable.jsx';
import { formatMoney, formatTimeAgo } from './utils/formatters.js';
import CategoryFilter from './components/CategoryFilter.jsx';
import { loadNoDiscountProducts, isNoDiscountProduct } from './utils/noDiscountManager.js';


// Carga diferida del componente Cotizacion para evitar advertencia de ESLint
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

/**
 * Componente principal de la aplicación para el catálogo de precios interactivo
 * @returns {JSX.Element} Componente principal de la aplicación
 */
export default function App() {
  // Estado para datos de productos y carga
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para la lista negra de productos sin descuentos
  const [noDiscountList, setNoDiscountList] = useState(new Set());

  // Estado para filtros y ordenación
  const [selectedLine, setSelectedLine] = useState('TODAS');
  const [search, setSearch] = useState('');
  const [descOcultos, setDescOcultos] = useState([0, 0, 0, 0]);
  const [descManualCount, setDescManualCount] = useState(1);

  // Estado para categorías principales activas
  const [categoriasActivas, setCategoriasActivas] = useState({
    vinifan: true,
    viniball: false,
    representadas: false
  });

  const [sortKey, setSortKey] = useState('codigo');
  const [sortDir, setSortDir] = useState('asc');

  // Estado para la gestión de la vista
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' or 'quotation'

  // Término de búsqueda debounced para mejorar rendimiento
  const debouncedSearch = useDebounce(search, 300);

  // Opciones de línea únicas memorizadas para el menú desplegable de filtro
  const lineOptions = useMemo(() => {
    const lines = new Set(data.map((r) => r.linea).filter(Boolean));
    return [...lines].sort();
  }, [data]);

  // Opciones de categoría memorizadas
  const categoriaOptions = useMemo(() => {
    const categorias = ['vinifan', 'viniball', 'representadas'];
    return categorias.filter(cat => categoriasActivas[cat]);
  }, [categoriasActivas]);

  // Los descuentos se guardan automáticamente en localStorage

  // Estado para persistencia de filtros de búsqueda
  const [searchFiltersSaved, setSearchFiltersSaved] = useState(false);
  const [searchFiltersLastSaved, setSearchFiltersLastSaved] = useState(null);

  // Guardar automáticamente los filtros de búsqueda cuando cambian
  useEffect(() => {
    const filtersData = {
      selectedLine,
      search,
      categoriasActivas,
      timestamp: Date.now(),
    };
    localStorage.setItem('idb_settings_searchFilters', JSON.stringify(filtersData));
  }, [selectedLine, search, categoriasActivas]);

  const processedRows = useMemo(() => {
    let filteredData = data;

    // Filtrar por categorías activas
    filteredData = filteredData.filter((r) => {
      if (r.categoria === 'vinifan' && !categoriasActivas.vinifan) return false;
      if (r.categoria === 'viniball' && !categoriasActivas.viniball) return false;
      if (r.categoria === 'representadas' && !categoriasActivas.representadas) return false;
      return true;
    });

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
      } else if (sortKey === 'categoria') {
        res = String(a.categoria).localeCompare(String(b.categoria), undefined, { sensitivity: 'base' });
      } else if (sortKey === 'nombre') {
        res = String(a.nombre).localeCompare(String(b.nombre), undefined, { sensitivity: 'base' });
      } else if (sortKey === 'precio_lista') {
        res = (a.precio_lista || 0) - (b.precio_lista || 0);
      } else if (sortKey === 'stock') {
        res = (a.stock || 0) - (b.stock || 0);
      } else if (sortKey === 'neto') {
        res = (a.neto || 0) - (b.neto || 0);
      } else if (sortKey === 'final') {
        res = (a.final || 0) - (b.final || 0);
      }
      return sortDir === 'asc' ? res : -res;
    });

    return sortedData.map((d) => {
      // Calcular precios con descuentos aplicados
      const { neto, final } = calculatePrice(d, descOcultos);
      return {
        ...d,
        neto,
        final,
      };
    });
  }, [data, categoriasActivas, selectedLine, debouncedSearch, descOcultos, sortKey, sortDir]);

  useEffect(() => {
    // Secuencia de inicialización robusta con recuperación automática
    initializeApplication();
  }, []);

  /**
   * Inicialización robusta de la aplicación con múltiples niveles de recuperación
   */
  async function initializeApplication() {
    try {
      console.log('Iniciando aplicación con sistema de recuperación robusto...');
      
      // 1. Inicializar datos del catálogo
      await loadSavedCatalog();
      
      // 2. Cargar contador de columnas manuales con recuperación
      const manualCountLoaded = await loadManualColumnsCount();
      if (!manualCountLoaded) {
        console.info('Usando contador de columnas manuales por defecto');
      }

      // 3. Los descuentos se cargan con el catálogo

      // 4. Cargar filtros de búsqueda
      await loadSavedSearchFilters();
      
      console.log('Aplicación inicializada exitosamente');
      
    } catch (error) {
      console.error('Error crítico en inicialización:', error);
      
      // Último recurso: valores por defecto absolutos
      console.log('Iniciando con configuración por defecto debido a error crítico');
    }
  }

  /**
   * Carga descuentos con sistema de recuperación automático
   */
  async function loadSavedDiscountsWithRecovery() {
    try {
      // Intentar carga normal primero y esperar resultado
      await loadSavedDiscounts();
      
      // Esperar un momento para que React procese el estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar si realmente se cargaron datos válidos
      const currentDescuentos = JSON.parse(localStorage.getItem('precios_descuentos_backup') || '{}');
      const hasValidData = currentDescuentos &&
                          Array.isArray(currentDescuentos.descOcultos) &&
                          currentDescuentos.descOcultos.length === 4 &&
                          currentDescuentos.descOcultos.some(d => d > 0);
      
      console.log('Estado de carga de descuentos:', {
        descOcultosActuales: descOcultos,
        tieneDatosValidos: hasValidData,
        datosEnStorage: currentDescuentos
      });
      
      return hasValidData || descOcultos.some(d => d > 0);
      
    } catch (error) {
      console.error('Error en carga de descuentos con recuperación:', error);
      return false;
    }
  }


  // Auto-guardar configuración de columnas manuales
  useEffect(() => {
    localStorage.setItem('idb_settings_manualColumns', JSON.stringify(descManualCount));
  }, [descManualCount]);

  // Guardar automáticamente el catálogo en localStorage estructurado
  useEffect(() => {
    // Evita guardar un array vacío durante la carga inicial
    if (data.length > 0) {
      localStorage.setItem('idb_catalog_data', JSON.stringify(data));
    }
  }, [data]);

  // Guardar descuentos cliente en localStorage estructurado
  useEffect(() => {
    localStorage.setItem('idb_settings_clientDiscounts', JSON.stringify(descOcultos));
  }, [descOcultos]);


  // Cargar la lista negra de productos sin descuentos
  useEffect(() => {
    if (data.length > 0) {
      loadAndApplyNoDiscountList();
    }
  }, [data.length]);


  /**
   * Carga los datos del catálogo desde localStorage o archivo JSON
   */
  async function loadSavedCatalog() {
    try {
      const savedData = await loadFromDB('catalog', 'data');
      if (savedData && Array.isArray(savedData) && savedData.length > 0) {
        console.log('Catálogo cargado desde IndexedDB:', savedData.length, 'productos');
        await applyNoDiscountList(savedData);

        // Cargar configuraciones
        const savedDesc = await loadFromDB('settings', 'clientDiscounts');
        if (savedDesc && Array.isArray(savedDesc) && savedDesc.length === 4) {
          setDescOcultos(savedDesc);
          console.log('Descuentos cliente cargados desde IndexedDB:', savedDesc);
        }

        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Error loading saved catalog from IndexedDB:', e);
    }

    // Cargar desde JSON si no hay datos guardados válidos
    console.log('Cargando catálogo desde JSON');
    const initialData = catalogData.map((row, idx) => ({
      ...row,
      idx,
      precio_lista: row.precio || row.precioLista,
      descManual1: 0,
      descManual2: 0,
      descManual3: 0,
      sinDescuentos: false,
    }));
    await applyNoDiscountList(initialData);
    // Guardar en IndexedDB para futuras cargas
    saveToDB('catalog', 'data', initialData);
    setLoading(false);
  }

  /**
   * Carga la lista negra de productos sin descuentos y la aplica a los datos
   */
  async function loadAndApplyNoDiscountList() {
    try {
      const noDiscountSet = await loadNoDiscountProducts();
      setNoDiscountList(noDiscountSet);
      
      // Aplicar la lista negra a los datos actuales
      setData(prevData => prevData.map(item => ({
        ...item,
        sinDescuentos: noDiscountSet.has(item.codigo) || item.sinDescuentos
      })));
      
      console.log(`Lista negra aplicada: ${noDiscountSet.size} productos marcados sin descuentos automáticos`);
    } catch (error) {
      console.error('Error cargando lista negra:', error);
    }
  }

  /**
   * Aplica la lista negra a un array de datos de productos
   */
  async function applyNoDiscountList(dataArray) {
    try {
      const noDiscountSet = await loadNoDiscountProducts();
      setNoDiscountList(noDiscountSet);
      
      const updatedData = dataArray.map(item => ({
        ...item,
        sinDescuentos: noDiscountSet.has(item.codigo) || item.sinDescuentos
      }));
      
      setData(updatedData);
      console.log(`Lista negra aplicada: ${noDiscountSet.size} productos marcados sin descuentos automáticos`);
    } catch (error) {
      console.error('Error aplicando lista negra:', error);
      setData(dataArray);
    }
  }



  /**
   * Actualiza un campo específico para una fila de producto
   * @param {number} idx - Índice en las filas procesadas
   * @param {string} field - Nombre del campo a actualizar
   * @param {any} value - Nuevo valor
   */
  function updateRow(idx, field, value) {
    setData((prev) => {
      const newData = [...prev];
      const r = processedRows[idx];
      if (!r) return prev;

      const originalIndex = data.findIndex(item => item.idx === r.idx);
      if (originalIndex === -1) return prev;

      let newValue;
      if (field === 'sinDescuentos') {
        newValue = Boolean(value);
      } else {
        newValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
      }

      newData[originalIndex] = {
        ...newData[originalIndex],
        [field]: newValue,
      };

      return newData;
    });
  }

  /**
   * Maneja la ordenación cambiando la dirección o la clave de ordenación
   * @param {string} key - Campo de ordenación ('codigo' | 'linea')
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
   * Actualiza los valores de los descuentos variables
   * @param {number} i - Índice del descuento (0-3)
   * @param {any} v - Nuevo valor del descuento
   */
   function setDescOculto(i, v) {
     setDescOcultos((arr) => {
       const next = arr.slice();
       next[i] = Math.min(100, Math.max(0, parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0));
       return next;
     });
   }


   /**
    * Inicializa la base de datos IndexedDB
    */
   function initDB() {
     return new Promise((resolve, reject) => {
       const request = indexedDB.open('ListaCotizacionDB', 2);
       request.onerror = () => reject(request.error);
       request.onsuccess = () => resolve(request.result);
       request.onupgradeneeded = (event) => {
         const db = event.target.result;
         if (!db.objectStoreNames.contains('catalog')) {
           db.createObjectStore('catalog');
         }
         if (!db.objectStoreNames.contains('settings')) {
           db.createObjectStore('settings');
         }
       };
     });
   }

   /**
    * Guarda un valor en IndexedDB
    */
   async function saveToDB(storeName, key, value) {
     try {
       const db = await initDB();
       const transaction = db.transaction([storeName], 'readwrite');
       const store = transaction.objectStore(storeName);
       store.put(value, key);
       return new Promise((resolve, reject) => {
         transaction.oncomplete = () => resolve();
         transaction.onerror = () => reject(transaction.error);
       });
     } catch (error) {
       console.error('Error guardando en IndexedDB:', error);
     }
   }

   /**
    * Carga un valor desde IndexedDB
    */
   async function loadFromDB(key) {
     try {
       const db = await initDB();
       const transaction = db.transaction(['settings'], 'readonly');
       const store = transaction.objectStore('settings');
       const request = store.get(key);
       return new Promise((resolve, reject) => {
         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
       });
     } catch (error) {
       console.error('Error cargando desde IndexedDB:', error);
       return null;
     }
   }

  /**
   * Guarda automáticamente la cadena de descuentos en IndexedDB
   */
   async function saveDiscounts() {
     try {
       await saveToDB('descuentos_cliente_string', discountString);
       console.log('Cadena de descuentos cliente guardada en IndexedDB:', discountString);
     } catch (error) {
       console.error('Error guardando cadena de descuentos cliente:', error);
     }
   }

  /**
   * Genera un checksum simple para verificar integridad de datos
   */
  function generateSimpleChecksum(discounts) {
    return discounts.reduce((sum, discount) => sum + (discount || 0), 0).toFixed(2);
  }

  /**
   * Función de recuperación de emergencia para casos extremos
   */
  function emergencyRestoreDiscounts() {
    try {
      // Intentar múltiples fuentes de respaldo
      const sources = ['precios_descuentos_emergency', 'precios_descuentos_backup'];
      
      for (const source of sources) {
        const saved = localStorage.getItem(source);
        if (saved) {
          const data = JSON.parse(saved);
          if (data && Array.isArray(data.descOcultos) && data.descOcultos.length === 4) {
            console.log('Descuentos restaurados desde fuente de emergencia:', source);
            setDescOcultos(data.descOcultos);
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error en recuperación de emergencia:', error);
    }
    
    console.warn('No se pudieron recuperar descuentos desde fuentes de emergencia');
    return false;
  }

  /**
   * Sincroniza cadena de descuentos desde IndexedDB para detectar cambios externos
   */
   async function syncDiscountsFromStorage() {
     try {
       const saved = await loadFromDB('descuentos_cliente_string');
       if (saved && saved !== discountString) {
         console.log('Cambios detectados en cadena de descuentos, sincronizando...');
         setDiscountString(saved);
       }
     } catch (error) {
       console.warn('Error sincronizando cadena de descuentos desde IndexedDB:', error);
     }
   }

  /**
   * Guarda el contador de columnas manuales en localStorage
   */
  function saveManualColumnsCount() {
    try {
      const data = {
        descManualCount,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem('desc_manual_count', JSON.stringify(data));
      console.log('Contador de columnas manuales guardado:', descManualCount);
      
    } catch (error) {
      console.error('Error guardando contador de columnas manuales:', error);
    }
  }

  /**
   * Carga el contador de columnas manuales desde localStorage
   */
  async function loadManualColumnsCount() {
    try {
      const saved = await loadFromDB('settings', 'manualColumns');
      if (typeof saved === 'number' && saved >= 1 && saved <= 3) {
        console.log('Contador de columnas manuales cargado desde IndexedDB:', saved);
        setDescManualCount(saved);
        return true;
      }
    } catch (error) {
      console.warn('Error cargando contador de columnas manuales desde IndexedDB:', error);
    }

    return false;
  }

  /**
   * Carga la cadena de descuentos guardada desde IndexedDB
   */
   async function loadSavedDiscounts() {
     try {
       let saved = await loadFromDB('descuentos_cliente_string');
       if (!saved) {
         // Intentar migrar desde localStorage
         let localSaved = localStorage.getItem('descuentos_cliente_string');
         if (localSaved) {
           saved = localSaved;
         } else {
           const oldSaved = localStorage.getItem('precios_descuentos');
           if (oldSaved) {
             const data = JSON.parse(oldSaved);
             if (data && Array.isArray(data.descOcultos) && data.descOcultos.length === 4) {
               saved = data.descOcultos.map(d => d.toString()).join(' ');
             }
           }
         }
         if (saved) {
           // Migrar a IndexedDB
           await saveToDB('descuentos_cliente_string', saved);
           localStorage.removeItem('descuentos_cliente_string');
           localStorage.removeItem('precios_descuentos');
           localStorage.removeItem('precios_descuentos_backup');
           localStorage.removeItem('precios_descuentos_emergency');
           console.log('Descuentos migrados a IndexedDB:', saved);
         }
       }
       if (saved) {
         setDiscountString(saved);
         updateDiscountsFromString(saved);
         console.log('Cadena de descuentos cliente cargada desde IndexedDB:', saved);
       }
     } catch (error) {
       console.error('Error cargando cadena de descuentos cliente:', error);
     }
   }

  /**
   * Carga los filtros de búsqueda guardados desde localStorage
   */
  async function loadSavedSearchFilters() {
    try {
      const saved = await loadFromDB('settings', 'searchFilters');
      if (saved) {
        const { selectedLine: savedLine, search: savedSearch, categoriasActivas: savedCategorias, timestamp } = saved;
        // Solo cargar si se guardó en las últimas 24 horas
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < oneDay) {
          setSelectedLine(savedLine || 'TODAS');
          setSearch(savedSearch || '');
          setCategoriasActivas(savedCategorias || { vinifan: true, viniball: false, representadas: false });
          setSearchFiltersSaved(true);
          setSearchFiltersLastSaved(new Date(timestamp));
        }
      }
    } catch (e) {
      console.warn('Error loading saved search filters from IndexedDB:', e);
    }
  }

  /**
   * Guarda los filtros de búsqueda actuales en localStorage
   */
  function saveSearchFilters() {
    const filtersData = {
      selectedLine,
      search,
      categoriasActivas,
      timestamp: Date.now(),
    };
    localStorage.setItem('search_filters', JSON.stringify(filtersData));
    setSearchFiltersSaved(true);
    setSearchFiltersLastSaved(new Date());
  }


  /**
   * Exporta lista de precios con descuentos aplicados para compartir con clientes
   */
  function downloadPriceList() {
    if (!processedRows.length) return;

    const wb = XLSX.utils.book_new();
    const linesToExport =
      selectedLine === 'TODAS'
        ? [...new Set(processedRows.map((r) => r.linea))].filter(Boolean)
        : [selectedLine];

    // Asegurar que siempre haya al menos una línea para exportar
    if (linesToExport.length === 0) {
      linesToExport.push('GENERAL');
    }

    for (const ln of linesToExport) {
      const rowsForLine = ln === 'GENERAL'
        ? processedRows
        : processedRows.filter((r) => r.linea === ln);
      if (rowsForLine.length === 0) continue;

      // Calcular descuento compuesto oculto
      const compoundHidden = calculateCompoundHiddenDiscount(descOcultos);

      // Encabezado dinámico según columnas activadas (nomenclatura comercial estandarizada)
      const baseHeader = [
        'codigo',
        'linea',
        'nombre',
        'precio_lista',
        'desc_cliente_%',
        'desc_fijos_1_%',
        'desc_fijos_2_%',
        'desc_fijos_3_%',
        'desc_fijos_4_%'
      ];

      // Agregar solo las columnas de descuentos adicionales activadas
      const manualHeaders = [];
      for (let i = 1; i <= descManualCount; i++) {
        manualHeaders.push(`desc_adicionales_${i}_%`);
      }

      const finalHeader = [
        ...baseHeader,
        ...manualHeaders,
        'precio_neto',
        'con_igv'
      ];

      const aoa = [finalHeader, ...rowsForLine.map(r => {
        const baseData = [
          r.codigo ?? '',
          r.linea ?? '',
          r.nombre ?? '',
          r.precio_lista,
          r.sinDescuentos ? 0 : compoundHidden, // Descuentos variables (0% si "Sin Descuentos")
          r.sinDescuentos ? 0 : (r.desc1 || 0), // Descuentos fijos 1 (0% si "Sin Descuentos")
          r.sinDescuentos ? 0 : (r.desc2 || 0), // Descuentos fijos 2 (0% si "Sin Descuentos")
          r.sinDescuentos ? 0 : (r.desc3 || 0), // Descuentos fijos 3 (0% si "Sin Descuentos")
          r.sinDescuentos ? 0 : (r.desc4 || 0), // Descuentos fijos 4 (0% si "Sin Descuentos")
        ];

        // Agregar solo los valores de descuentos manuales activados
        const manualData = [];
        for (let i = 1; i <= descManualCount; i++) {
          manualData.push(r[`descManual${i}`] || 0);
        }

        const finalData = [
          ...baseData,
          ...manualData,
          r.neto,             // Precio neto final
          r.final             // Precio con IGV
        ];

        return finalData;
      })];

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Agregar autofiltro
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };

      // Anchos de columna dinámicos según columnas activadas
      const baseWidths = [
        { wch: 12 }, // Código
        { wch: 16 }, // Línea
        { wch: 40 }, // Nombre
        { wch: 14 }, // Precio base
        { wch: 18 }, // Descuentos ocultos
        { wch: 16 }, // Descuentos fijos 1
        { wch: 16 }, // Descuentos fijos 2
        { wch: 16 }, // Descuentos fijos 3
        { wch: 16 }, // Descuentos fijos 4
      ];

      // Agregar anchos para descuentos manuales activados
      const manualWidths = [];
      for (let i = 1; i <= descManualCount; i++) {
        manualWidths.push({ wch: 18 }); // Ancho para cada descuento manual
      }

      const finalWidths = [
        ...baseWidths,
        ...manualWidths,
        { wch: 14 }, // Precio neto
        { wch: 14 }  // Con IGV
      ];

      ws['!cols'] = finalWidths;

      // Congelar fila de encabezado
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      // Calcular índices de columnas dinámicamente
      const precioListaCol = 3; // Siempre columna 3
      const descuentosVariablesCol = 4; // Siempre columna 4
      const descuentosFijosStart = 5; // Columnas 5,6,7,8 para descuentos fijos
      const descuentosFijosEnd = 8;
      const descuentosManualesStart = 9; // Después de descuentos fijos
      const descuentosManualesEnd = 8 + descManualCount; // 9 + número de manuales activados - 1
      const precioNetoCol = finalHeader.length - 2; // Penúltima columna
      const conIgvCol = finalHeader.length - 1; // Última columna

      // Estilo de la fila de encabezado (negrita)
      for (let C = 0; C < finalHeader.length; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) cell.s = { font: { bold: true } };
      }

      // Formatear columnas de dinero
      const moneyCols = new Set([precioListaCol, precioNetoCol, conIgvCol]);
      for (let R = 1; R < aoa.length; R++) {
        for (const C of moneyCols) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell) cell.z = '#,##0.00';
        }
      }

      // Formatear columnas de porcentajes (todas las de descuentos)
      const percentCols = new Set([
        descuentosVariablesCol, // Descuentos ocultos
        ...Array.from({length: 4}, (_, i) => descuentosFijosStart + i), // Descuentos fijos 1-4
        ...Array.from({length: descManualCount}, (_, i) => descuentosManualesStart + i), // Descuentos manuales activados
      ]);

      for (let R = 1; R < aoa.length; R++) {
        for (const C of percentCols) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && typeof cell.v === 'number') cell.t = 'n';
        }
      }

      const safeSheetName = (ln === 'GENERAL' ? 'GENERAL' : (ln || 'Sheet')).slice(0, 31).replace(/[/\\?*[\]:]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }

    // Generar marca de tiempo para el nombre del archivo
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const lineName = selectedLine === 'TODAS' ? 'TODAS' : (selectedLine || 'GENERAL');
    const descStr = descOcultos.map(v => String(parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0).replace(/\./g, '-')).join('-');
    const fileName = `lista_precios_${lineName.toLowerCase()}_${stamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  /**
   * Exporta hoja de pedido con stock disponible y columna para ingresar cantidades
   */
  function downloadOrderSheet() {
    if (!processedRows.length) return;

    const wb = XLSX.utils.book_new();
    const linesToExport =
      selectedLine === 'TODAS'
        ? [...new Set(processedRows.map((r) => r.linea))].filter(Boolean)
        : [selectedLine];

    // Asegurar que siempre haya al menos una línea para exportar
    if (linesToExport.length === 0) {
      linesToExport.push('GENERAL');
    }

    for (const ln of linesToExport) {
      const rowsForLine = ln === 'GENERAL'
        ? processedRows
        : processedRows.filter((r) => r.linea === ln);
      if (rowsForLine.length === 0) continue;

      // Calcular descuento compuesto oculto
      const compoundHidden = calculateCompoundHiddenDiscount(descOcultos);

      // Encabezado base
      const baseHeader = [
        'codigo',
        'linea',
        'nombre',
        'stock',
        'precio_lista'
      ];

      // Filtrar descuentos cliente activos
      const clientDiscounts = compoundHidden > 0 ? ['descuento_cliente_%'] : [];

      // Filtrar descuentos fijos solo si tienen valores > 0 en esta línea
      const activeFixedHeaders = [];
      for (let i = 1; i <= 4; i++) {
        if (rowsForLine.some(r => (r[`desc${i}`] || 0) > 0 && !r.sinDescuentos)) {
          activeFixedHeaders.push(`desc_fijos_${i}_%`);
        }
      }

      // Agregar descuentos manuales solo si están activados
      const manualHeaders = [];
      for (let i = 1; i <= descManualCount; i++) {
        if (rowsForLine.some(r => (r[`descManual${i}`] || 0) > 0)) {
          manualHeaders.push(`desc_adicionales_${i}_%`);
        }
      }

      const finalHeader = [
        ...baseHeader,
        ...clientDiscounts,
        ...activeFixedHeaders,
        ...manualHeaders,
        'precio_unitario_neto',
        'precio_unitario_igv',
        'unidades'
      ];

      const aoa = [finalHeader, ...rowsForLine.map(r => {
        const baseData = [
          r.codigo ?? '',
          r.linea ?? '',
          r.nombre ?? '',
          r.stock ?? 0,
          r.precio_lista
        ];

        // Descuento cliente
        const clientData = compoundHidden > 0 ? [r.sinDescuentos ? 0 : compoundHidden] : [];

        // Descuentos fijos (solo los activos)
        const fixedData = activeFixedHeaders.map((_, i) => {
          const descIndex = i + 1;
          return r.sinDescuentos ? 0 : (r[`desc${descIndex}`] || 0);
        });

        // Descuentos manuales (solo los activos)
        const manualData = manualHeaders.map((_, i) => {
          const manualIndex = i + 1;
          return r[`descManual${manualIndex}`] || 0;
        });

        const finalData = [
          ...baseData,
          ...clientData,
          ...fixedData,
          ...manualData,
          r.neto,             // Precio unitario neto
          r.final,            // Precio unitario con IGV
          ''                  // Columna de unidades (vacía para que el usuario la llene)
        ];

        return finalData;
      })];

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Agregar autofiltro
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };

      // Anchos de columna dinámicos
      const baseWidths = [
        { wch: 12 }, // Código
        { wch: 16 }, // Línea
        { wch: 40 }, // Nombre
        { wch: 10 }, // Stock
        { wch: 14 }, // Precio lista
      ];

      const clientWidths = compoundHidden > 0 ? [{ wch: 18 }] : [];
      const fixedWidths = activeFixedHeaders.map(() => ({ wch: 16 }));
      const manualWidths = manualHeaders.map(() => ({ wch: 18 }));
      const finalWidths = [
        { wch: 18 }, // Precio unitario neto
        { wch: 18 }, // Precio unitario IGV
        { wch: 12 }  // Unidades
      ];

      ws['!cols'] = [
        ...baseWidths,
        ...clientWidths,
        ...fixedWidths,
        ...manualWidths,
        ...finalWidths
      ];

      // Congelar fila de encabezado
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      // Calcular índices de columnas dinámicamente
      let currentCol = baseHeader.length;
      if (compoundHidden > 0) currentCol += 1;
      currentCol += activeFixedHeaders.length;
      currentCol += manualHeaders.length;

      const precioNetoCol = currentCol;
      const precioIgvCol = currentCol + 1;

      // Estilo de la fila de encabezado (negrita)
      for (let C = 0; C < finalHeader.length; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) cell.s = { font: { bold: true } };
      }

      // Formatear columnas de dinero
      const moneyCols = new Set([4, precioNetoCol, precioIgvCol]); // precio_lista, precio_neto, precio_igv
      for (let R = 1; R < aoa.length; R++) {
        for (const C of moneyCols) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell) cell.z = '#,##0.00';
        }
      }

      // Formatear columnas de porcentajes (todas las de descuentos)
      const percentCols = new Set();
      let percentColIndex = baseHeader.length;
      if (compoundHidden > 0) {
        percentCols.add(percentColIndex);
        percentColIndex += 1;
      }
      for (let i = 0; i < activeFixedHeaders.length; i++) {
        percentCols.add(percentColIndex + i);
      }
      percentColIndex += activeFixedHeaders.length;
      for (let i = 0; i < manualHeaders.length; i++) {
        percentCols.add(percentColIndex + i);
      }

      for (let R = 1; R < aoa.length; R++) {
        for (const C of percentCols) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && typeof cell.v === 'number') cell.t = 'n';
        }
      }

      const safeSheetName = (ln === 'GENERAL' ? 'GENERAL' : (ln || 'Sheet')).slice(0, 31).replace(/[/\\?*[\]:]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }

    // Generar marca de tiempo para el nombre del archivo
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const lineName = selectedLine === 'TODAS' ? 'TODAS' : (selectedLine || 'GENERAL');
    const fileName = `hoja_pedido_${lineName.toLowerCase()}_${stamp}.xlsx`;

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
          {/* Alternar Navegación */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setCurrentView('catalog')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all text-white shadow-md ${currentView === 'catalog' ? 'bg-primary-600' : 'bg-secondary-500 hover:bg-secondary-600'}`}
              >
                📋 Catálogo
              </button>
              <button
                onClick={() => setCurrentView('quotation')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all text-white shadow-md ${currentView === 'quotation' ? 'bg-primary-600' : 'bg-secondary-600'}`}
              >
                🧾 Cotización
              </button>
            </div>
          </div>



          {/* Móvil: diseño completamente optimizado para touch */}
          <div className="block md:hidden space-y-4">
            {/* Filtros principales */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Mostrar producto</label>
                  <input
                    type="text"
                    className="border-2 border-gray-300 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Código o nombre del producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Mostrar categoria</label>
                  <select
                    className="border-2 border-gray-300 rounded-lg px-3 py-3 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={selectedLine}
                    onChange={(e) => setSelectedLine(e.target.value)}
                  >
                    <option value="TODAS">Todas las categorías</option>
                    {lineOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <CategoryFilter
              categoriasActivas={categoriasActivas}
              setCategoriasActivas={setCategoriasActivas}
            />

            {/* Descuentos ocultos - Diseño mejorado */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Descuentos cliente (%)</span>
                {descOcultos.some(v => v > 0) && (
                  <span className="ml-2 text-blue-600 font-bold text-sm">
                    (Total: {parseFloat(calculateCompoundHiddenDiscount(descOcultos)).toFixed(2)}%)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1 text-center">D{i + 1}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="border-2 border-gray-300 rounded-lg px-2 py-3 text-center text-base font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                      value={descOcultos[i]}
                      onChange={(e) => setDescOculto(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Controles de columnas manuales - Mejorado */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Columnas de descuentos manuales</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{descManualCount}</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                {descManualCount > 1 && (
                  <button
                    onClick={() => setDescManualCount(Math.max(1, descManualCount - 1))}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full text-xl font-bold flex items-center justify-center transition-colors shadow-lg"
                    title="Quitar columna manual"
                  >
                    −
                  </button>
                )}
                <span className="text-lg font-bold text-gray-600 min-w-[3rem] text-center">{descManualCount}/3</span>
                {descManualCount < 3 && (
                  <button
                    onClick={() => setDescManualCount(Math.min(3, descManualCount + 1))}
                    className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full text-xl font-bold flex items-center justify-center transition-colors shadow-lg"
                    title="Agregar columna manual"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Botones de descarga - Optimizados para móvil */}
            <div className="space-y-3">
              <button
                onClick={downloadPriceList}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95"
                title="Lista de precios con descuentos aplicados para compartir con clientes"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                💰 Lista de Precios
              </button>
              <button
                onClick={downloadOrderSheet}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 text-white px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95"
                title="Hoja de pedido con stock disponible y columna para ingresar cantidades"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                📝 Hoja de Pedido
              </button>
            </div>
          </div>

          {/* Escritorio: Diseño Reorganizado */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-4">
            {/* Columna Izquierda y Central: Controles y Filtros */}
            <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sección de Filtros */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Filtros</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mostrar categoria</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedLine}
                    onChange={(e) => setSelectedLine(e.target.value)}
                  >
                    <option value="TODAS">Todas las líneas</option>
                    {lineOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mostrar producto</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar por código o nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Sección de Descuentos y Opciones */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Descuentos y Opciones</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Descuentos Cliente
                    {descOcultos.some(v => v > 0) && (
                      <span className="ml-2 text-blue-600 font-bold">
                        (Total: {parseFloat(calculateCompoundHiddenDiscount(descOcultos)).toFixed(2)}%)
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500"
                        placeholder={`D${i + 1}`}
                        value={descOcultos[i]}
                        onChange={(e) => setDescOculto(i, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Columnas Manuales</label>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 p-1 rounded-md">
                    <button
                      onClick={() => setDescManualCount(Math.max(1, descManualCount - 1))}
                      disabled={descManualCount <= 1}
                      className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-md font-bold flex items-center justify-center transition-colors disabled:bg-gray-300"
                      title="Quitar columna manual"
                    >
                      −
                    </button>
                    <span className="text-md font-bold text-gray-700 min-w-[2rem] text-center">{descManualCount}</span>
                    <button
                      onClick={() => setDescManualCount(Math.min(3, descManualCount + 1))}
                      disabled={descManualCount >= 3}
                      className="w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full text-md font-bold flex items-center justify-center transition-colors disabled:bg-gray-300"
                      title="Agregar columna manual"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Sección de Categorías Principales */}
              <div className="lg:col-span-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold text-gray-800">Categorías Principales</h3>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
                    {Object.values(categoriasActivas).filter(Boolean).length}/3 activas
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                  <label className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={categoriasActivas.vinifan}
                      onChange={(e) => setCategoriasActivas(prev => ({ ...prev, vinifan: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-800">🎨 Vinifan</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={categoriasActivas.viniball}
                      onChange={(e) => setCategoriasActivas(prev => ({ ...prev, viniball: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-800">🏀 Viniball</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={categoriasActivas.representadas}
                      onChange={(e) => setCategoriasActivas(prev => ({ ...prev, representadas: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-800">🏢 Representadas</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Acciones */}
            <div className="flex flex-col gap-3 justify-center">
              <button
                onClick={downloadPriceList}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95"
                title="Exportar lista de precios con descuentos aplicados"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                <span>Lista de Precios</span>
              </button>
              <button
                onClick={downloadOrderSheet}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95"
                title="Exportar hoja de pedido con stock disponible"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Hoja de Pedido</span>
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
              <DataTable
                data={processedRows}
                formatMoney={formatMoney}
                descOcultos={descOcultos}
                descManualCount={descManualCount}
                setDescManualCount={setDescManualCount}
                updateRow={updateRow}
                sortKey={sortKey}
                sortDir={sortDir}
                handleSort={handleSort}
              />
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
          </div>
        </div>
      </main>
    </div>
  );
}