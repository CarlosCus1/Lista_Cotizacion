const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando procesamiento de datos de cotización...');

// Función para determinar categoría
function determinarCategoria(codigo, linea) {
  const code = String(codigo);
  const line = String(linea || '').toLowerCase();

  // Productos que inician con 85* son representadas
  if (code.startsWith('85')) {
    return 'representadas';
  }

  // Productos de línea "pelotas" y "mascotas" son viniball
  if (line.includes('pelota') || line.includes('mascota')) {
    return 'viniball';
  }

  // El resto es vinifan
  return 'vinifan';
}

// Rutas de archivos
const STOCK_COMPLETO_PATH = 'C:\\Users\\ccusi\\Documents\\Proyect_Coder\\gestion_de_stock\\procesamiento\\data_stock_completo.xlsx';

try {
  // Verificar que el archivo de stock existe
  if (!fs.existsSync(STOCK_COMPLETO_PATH)) {
    throw new Error(`Archivo de stock no encontrado: ${STOCK_COMPLETO_PATH}`);
  }

  // Leer stock completo desde carpeta original
  console.log('📥 Leyendo stock completo desde gestión...');
  const stockWorkbook = XLSX.readFile(STOCK_COMPLETO_PATH);
  const stockCompleto = XLSX.utils.sheet_to_json(stockWorkbook.Sheets[stockWorkbook.SheetNames[0]]);

  // Verificar que el archivo de configuración existe
  const configPath = './inputs/configuracion_cotizacion.xlsx';
  if (!fs.existsSync(configPath)) {
    throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
  }

  // Leer configuración desde Excel unificado
  console.log('📋 Leyendo configuración desde Excel unificado...');
  const configWorkbook = XLSX.readFile(configPath);

  const codigosCotizacion = XLSX.utils.sheet_to_json(configWorkbook.Sheets['codigos_cotizacion']);
  const descuentosFijos = XLSX.utils.sheet_to_json(configWorkbook.Sheets['descuentos_fijos']);
  const preciosFijos = XLSX.utils.sheet_to_json(configWorkbook.Sheets['precios_fijos']);

  console.log(`📊 Stock completo: ${stockCompleto.length} productos`);
  console.log(`🎯 Códigos para cotización: ${codigosCotizacion.length}`);
  console.log(`💰 Descuentos configurados: ${descuentosFijos.length}`);
  console.log(`💵 Precios fijos configurados: ${preciosFijos.length}`);

  // Crear mapas para búsqueda rápida
  const codigosValidos = new Set(codigosCotizacion.map(r => String(r.Codigo || r.codigo)));
  const descuentosMap = new Map(descuentosFijos.map(r => [String(r.Codigo || r.codigo), r]));
  const preciosFijosMap = new Map(preciosFijos.map(r => [String(r.Codigo || r.codigo), r.precio || r.Precio]));

  // Filtrar y procesar productos
  const productosFiltrados = stockCompleto
    .filter(producto => {
      const code = String(producto.Código || producto.codigo);
      return codigosValidos.has(code);
    })
    .map(producto => {
      const code = String(producto.Código || producto.codigo);
      const descuentos = descuentosMap.get(code) || {};

      // Usar precio fijo si existe, sino el precio del stock
      const precioBase = preciosFijosMap.get(code) || producto.Precio || producto.precio || producto['Precio Lista'] || 0;

      // Redondear precios fijos a 2 decimales para evitar problemas de precisión
      const precioFinal = preciosFijosMap.has(code) ? parseFloat(parseFloat(precioBase).toFixed(2)) : precioBase;

      // Extraer stock con más opciones de campos
      const stockValue = producto.VES_disponible || producto.disponible_ves || producto['Stock VES'] || producto['Stock Disponible'] ||
                        producto.stock || producto.disponible || producto['Disponible'] ||
                        producto['Stock'] || producto['Cantidad'] || 0;

      return {
        codigo: code,
        linea: producto.Linea || producto.linea || 'GENERAL',
        categoria: determinarCategoria(code, producto.Linea || producto.linea), // 🔄 Automático por código y línea
        nombre: producto.Descripción || producto.nombre || producto.descripcion,
        precioLista: parseFloat(precioFinal),
        stock: stockValue,
        desc1: Math.round(parseFloat(descuentos.Desc1 || descuentos.desc1 || 0) * 100), // 💰 Convertir a enteros (porcentajes)
        desc2: Math.round(parseFloat(descuentos.Desc2 || descuentos.desc2 || 0) * 100),
        desc3: Math.round(parseFloat(descuentos.Desc3 || descuentos.desc3 || 0) * 100),
        desc4: Math.round(parseFloat(descuentos.Desc4 || descuentos.desc4 || 0) * 100),
        sinDescuentos: preciosFijosMap.has(code) // 🚫 Si tiene precio fijo, marcar como sin descuentos
      };
    });

  console.log(`✅ Productos procesados: ${productosFiltrados.length}`);
  console.log(`📊 Categorías detectadas:`, [...new Set(productosFiltrados.map(p => p.categoria))]);
  console.log(`💵 Productos con precio fijo: ${Array.from(preciosFijosMap.keys()).length}`);

  // Generar JSONs de salida
  const catalogoBase = productosFiltrados.map(p => ({
    codigo: p.codigo,
    linea: p.linea,
    categoria: p.categoria,
    nombre: p.nombre,
    precioLista: p.precioLista
  }));

  const stockJson = {};
  productosFiltrados.forEach(p => {
    stockJson[p.codigo] = p.stock;
  });

  const descuentosFijosJson = {};
  productosFiltrados.forEach(p => {
    if (p.desc1 || p.desc2 || p.desc3 || p.desc4) {
      descuentosFijosJson[p.codigo] = [p.desc1, p.desc2, p.desc3, p.desc4];
    }
  });

  const sinDescuentosJson = Array.from(preciosFijosMap.keys()); // Solo códigos con precio fijo

  // Crear directorio outputs si no existe
  if (!fs.existsSync('./outputs')) {
    fs.mkdirSync('./outputs');
  }

  // Guardar archivos
  fs.writeFileSync('./outputs/catalogo-base.json', JSON.stringify(catalogoBase, null, 2));
  fs.writeFileSync('./outputs/stock.json', JSON.stringify(stockJson, null, 2));
  fs.writeFileSync('./outputs/descuentos-fijos.json', JSON.stringify(descuentosFijosJson, null, 2));
  fs.writeFileSync('./outputs/sin-descuentos.json', JSON.stringify(sinDescuentosJson, null, 2));

  // Copiar a public del proyecto principal
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    fs.copyFileSync('./outputs/catalogo-base.json', path.join(publicDir, 'catalogo-base.json'));
    fs.copyFileSync('./outputs/stock.json', path.join(publicDir, 'stock.json'));
    fs.copyFileSync('./outputs/descuentos-fijos.json', path.join(publicDir, 'descuentos-fijos.json'));
    fs.copyFileSync('./outputs/sin-descuentos.json', path.join(publicDir, 'sin-descuentos.json'));
    console.log('📋 JSONs copiados a public/');

    // Escribir la fecha y hora de la última actualización
    const now = new Date();
    const updateTimestamp = now.toLocaleString('es-PE', { timeZone: 'America/Lima' });
    fs.writeFileSync(path.join(publicDir, 'last-update.txt'), updateTimestamp);
    console.log(`⏰ Fecha de actualización guardada: ${updateTimestamp}`);
  }

  console.log('🎉 Procesamiento completado exitosamente!');
  console.log(`📄 Archivos generados: ${Object.keys(stockJson).length} productos con stock`);
  console.log(`💰 Productos con descuentos: ${Object.keys(descuentosFijosJson).length}`);
  console.log(`💵 Productos con precio fijo: ${sinDescuentosJson.length}`);

} catch (error) {
  console.error('❌ Error en el procesamiento:', error.message);
  process.exit(1);
}