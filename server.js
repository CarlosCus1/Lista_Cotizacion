import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());

// Endpoint para obtener catálogo desde Google Drive
app.get('/api/catalogo', async (req, res) => {
  try {
    console.log('🔄 Descargando catálogo desde Google Drive...');

    // URL del archivo en Google Drive
    const googleDriveUrl = 'https://drive.google.com/uc?export=download&id=1cx8OFHs_6xp2-hfYsc_OdWhnUHFe1NCz';

    // Descargar desde Google Drive (el backend no tiene restricciones CORS)
    const response = await fetch(googleDriveUrl);

    if (!response.ok) {
      throw new Error(`Error descargando de Google Drive: ${response.status}`);
    }

    // Obtener el contenido como texto primero
    const text = await response.text();

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Si no es JSON puro, intentar extraer JSON de respuesta HTML
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('El archivo no contiene JSON válido');
      }
    }

    // Validar que sea un array de productos
    if (!Array.isArray(data)) {
      throw new Error('El archivo debe contener un array de productos');
    }

    // Validar estructura básica
    const validProducts = data.filter(product =>
      product &&
      typeof product === 'object' &&
      product.codigo &&
      product.nombre
    );

    console.log(`✅ Procesados ${validProducts.length} productos válidos`);

    // Enviar respuesta con headers CORS
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.json(validProducts);

  } catch (error) {
    console.error('❌ Error en /api/catalogo:', error.message);

    // Enviar error con estructura consistente
    res.status(500).json({
      error: 'Error obteniendo catálogo',
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

    const configPath = path.join(__dirname, 'productos-config.json');

    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(config);
    } else {
      throw new Error('Archivo productos-config.json no encontrado');
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

    const stockPath = path.join(__dirname, 'stock-data.json');

    if (fs.existsSync(stockPath)) {
      const stockData = fs.readFileSync(stockPath, 'utf8');
      const stock = JSON.parse(stockData);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(stock);
    } else {
      throw new Error('Archivo stock-data.json no encontrado');
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
  console.log(`   GET /api/catalogo - Obtener catálogo desde Google Drive`);
  console.log(`🔗 Configurar frontend: VITE_CATALOG_JSON_URL=http://localhost:${PORT}/api/catalogo`);
});