const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando procesamiento de datos de cotización...');

// Leer stock completo desde data_stock_completo.xlsx
console.log('📥 Leyendo stock completo desde data_stock_completo.xlsx...');
const stockWorkbook = XLSX.readFile('C:\\Users\\ccusi\\Documents\\Proyect_Coder\\gestion_de_stock\\procesamiento\\data_stock_completo.xlsx');
const stockSheet = stockWorkbook.Sheets[stockWorkbook.SheetNames[0]];
const stockData = XLSX.utils.sheet_to_json(stockSheet);

// Leer configuración desde configuracion_cotizacion.xlsx
console.log('📋 Leyendo configuración desde configuracion_cotizacion.xlsx...');
const configWorkbook = XLSX.readFile('inputs/configuracion_cotizacion.xlsx');
const configSheet = configWorkbook.Sheets[configWorkbook.SheetNames[0]]; // Configuración en la primera hoja
const configData = XLSX.utils.sheet_to_json(configSheet);

console.log(`📊 Stock completo: ${stockData.length} productos`);
console.log(`🎯 Códigos para cotización: ${configData.length}`);

// Procesar descuentos y precios fijos desde config
const descuentos = {};
const preciosFijos = {};
const codigosCotizacion = new Set();

configData.forEach(row => {
  const code = row.codigo || row.Codigo || row.CÓDIGO;
  if (code) {
    codigosCotizacion.add(code);
    descuentos[code] = [
      row.desc1 || row.Desc1 || 0,
      row.desc2 || row.Desc2 || 0,
      row.desc3 || row.Desc3 || 0,
      row.desc4 || row.Desc4 || 0
    ];

    if (row.precio_fijo || row.PrecioFijo) {
      preciosFijos[code] = row.precio_fijo || row.PrecioFijo;
    }
  }
});

console.log(`💰 Descuentos configurados: ${Object.keys(descuentos).length}`);
console.log(`💵 Precios fijos configurados: ${Object.keys(preciosFijos).length}`);

// Procesar productos solo para códigos en cotización
const productos = stockData.filter(row => {
  const code = row.codigo || row.Codigo || row.CÓDIGO;
  return code && codigosCotizacion.has(code);
}).map((row, idx) => {
  const code = row.codigo || row.Codigo || row.CÓDIGO;
  const discounts = descuentos[code] || [0, 0, 0, 0];
  const stock = row.stock_referencial || row.StockReferencial || row.stock || row.Stock || 0;
  const precioLista = row.precio_lista || row.PrecioLista || row['Precio Lista'] || 0;

  return {
    idx,
    codigo: code,
    nombre: row.nombre || row.Nombre || row.PRODUCTO || '',
    linea: row.linea || row.Linea || row.LÍNEA || '',
    categoria: row.categoria || row.Categoria || row.CATEGORÍA || 'vinifan',
    precio_lista: precioLista,
    stock,
    desc1: discounts[0],
    desc2: discounts[1],
    desc3: discounts[2],
    desc4: discounts[3],
    sinDescuentos: row.sin_descuentos || row.SinDescuentos || false
  };
});

// Filtrar productos válidos
const productosValidos = productos.filter(p => p.codigo && p.nombre);

console.log(`✅ Productos procesados: ${productosValidos.length}`);

// Categorías detectadas
const categorias = [...new Set(productosValidos.map(p => p.categoria).filter(Boolean))];
console.log(`📊 Categorías detectadas: ${categorias}`);

// Productos con precio fijo
const productosPrecioFijo = productosValidos.filter(p => preciosFijos[p.codigo]);
console.log(`💵 Productos con precio fijo: ${productosPrecioFijo.length}`);

// Generar archivos JSON
console.log('📋 Generando archivos JSON...');

// Catálogo base
fs.writeFileSync('outputs/catalogo-base.json', JSON.stringify(productosValidos, null, 2));

// Descuentos fijos
fs.writeFileSync('outputs/descuentos-fijos.json', JSON.stringify(descuentos, null, 2));

// Sin descuentos
const sinDescuentos = productosValidos.filter(p => p.sinDescuentos).map(p => p.codigo);
fs.writeFileSync('outputs/sin-descuentos.json', JSON.stringify(sinDescuentos, null, 2));

// Stock
const stockMap = {};
productosValidos.forEach(p => {
  stockMap[p.codigo] = p.stock;
});
fs.writeFileSync('outputs/stock.json', JSON.stringify(stockMap, null, 2));

// Copiar a public
console.log('📋 Copiando archivos a public/');
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

['catalogo-base.json', 'descuentos-fijos.json', 'sin-descuentos.json', 'stock.json'].forEach(file => {
  const src = path.join('outputs', file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

console.log('🎉 Procesamiento completado exitosamente!');
console.log(`📄 Archivos generados: ${productosValidos.length} productos con stock`);
console.log(`💰 Productos con descuentos: ${Object.keys(descuentos).length}`);
console.log(`💵 Productos con precio fijo: ${productosPrecioFijo.length}`);