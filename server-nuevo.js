import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());

// Endpoint para obtener catálogo fusionado (productos + stock)
app.get('/api/catalogo', async (req, res) => {
  try {
    console.log('🔄 Fusionando datos de productos y stock...');

    // Cargar archivos directamente
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Cargar configuración de productos
    const configPath = path.join(__dirname, 'productos-ejemplo.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Archivo productos-ejemplo.json no encontrado');
    }
    const configData = fs.readFileSync(configPath, 'utf8');
    const productsConfig = JSON.parse(configData);

    // Cargar datos de stock
    const stockPath = path.join(__dirname, 'stock-ejemplo.json');
    if (!fs.existsSync(stockPath)) {
      throw new Error('Archivo stock-ejemplo.json no encontrado');
    }
    const stockDataRaw = fs.readFileSync(stockPath, 'utf8');
    const stockData = JSON.parse(stockDataRaw);

    // Fusionar productos con stock
    const mergedProducts = [];
    Object.keys(productsConfig).forEach(category => {
      if (productsConfig[category].productos) {
        productsConfig[category].productos.forEach(product => {
          const stockInfo = stockData[product.codigo];

          mergedProducts.push({
            ...product,
            categoria: category,
            idx: Math.random(), // ID temporal único
            stock: stockInfo || 0,
            precio_lista: product.precio_lista,
            descManual1: 0,
            descManual2: 0,
            descManual3: 0,
            sinDescuentos: false
          });
        });
      }
    });

    console.log(`✅ Fusionados ${mergedProducts.length} productos con datos de stock`);

    // Enviar respuesta fusionada
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.json(mergedProducts);

  } catch (error) {
    console.error('❌ Error fusionando catálogo:', error.message);

    res.status(500).json({
      error: 'Error obteniendo catálogo fusionado',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/catalogo', '/api/productos-config', '/api/stock-data', '/api/health']
  });
});

// Endpoint para configuración de productos (códigos y descuentos fijos)
app.get('/api/productos-config', async (req, res) => {
  try {
    console.log('📋 Sirviendo configuración de productos...');

    // En desarrollo, servir archivo local
    // En producción, esto podría venir de una base de datos
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const configPath = path.join(__dirname, 'productos-ejemplo.json');

    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(config);
    } else {
      throw new Error('Archivo productos-ejemplo.json no encontrado');
    }

  } catch (error) {
    console.error('❌ Error en /api/productos-config:', error.message);
    res.status(500).json({
      error: 'Error obteniendo configuración de productos',
      message: error.message
    });
  }
});

// Endpoint para datos de stock (actualizable cada hora)
app.get('/api/stock-data', async (req, res) => {
  try {
    console.log('📦 Sirviendo datos de stock...');

    // En desarrollo, servir archivo local
    // En producción, esto se actualizaría desde el ERP cada hora
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const stockPath = path.join(__dirname, 'stock-ejemplo.json');

    if (fs.existsSync(stockPath)) {
      const stockData = fs.readFileSync(stockPath, 'utf8');
      const stock = JSON.parse(stockData);

      // Convertir el formato simple a la estructura esperada
      const formattedStock = {
        stock: stock,
        lastUpdated: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(formattedStock);
    } else {
      throw new Error('Archivo stock-ejemplo.json no encontrado');
    }

  } catch (error) {
    console.error('❌ Error en /api/stock-data:', error.message);
    res.status(500).json({
      error: 'Error obteniendo datos de stock',
      message: error.message
    });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/productos-config - Configuración de productos`);
  console.log(`   GET /api/stock-data - Datos de stock`);
  console.log(`   GET /api/catalogo - Catálogo fusionado`);
  console.log(`🔗 Configurar frontend: VITE_CATALOG_JSON_URL=http://localhost:${PORT}/api/catalogo`);
});