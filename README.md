# Sistema de Precios y Cotizaciones

Una aplicación web profesional para la gestión comercial de catálogos de productos, con cálculos automáticos de precios, estructura completa de descuentos y generación de **listas de precios** y **hojas de pedido** en Excel. **Optimizada para despliegue gratuito en GitHub Pages**.

**Versión 1.1.0** - Preparada para GitHub Pages con descuentos persistentes automáticos

## 🚀 Características Principales

### 📊 Gestión de Catálogo
- **Vista tabular** optimizada para grandes volúmenes de datos (hasta 200+ productos)
- **Búsqueda en tiempo real** por código o nombre de producto
- **Filtrado por línea** de productos
- **Ordenamiento** por código o línea
- **Persistencia automática** de datos y configuraciones

### 💰 Cálculos de Precios Profesionales
- **Estructura completa de descuentos**: Descuentos cliente, fijos del producto y adicionales
- **Cálculos automáticos y precisos**: Aplicación secuencial de todos los descuentos
- **IGV automático**: Cálculo del 18% en todos los totales
- **Precios en tiempo real**: Actualización instantánea sin recargar la página
- **Márgenes de ganancia**: Control total sobre precios y rentabilidad

### 🧾 Sistema de Cotizaciones
- **Selección visual** de productos con tarjetas interactivas
- **Cálculo automático** de totales por cotización
- **Descuentos por ítem** en cotizaciones
- **Exportación a Excel** con formato profesional
- **Datos del cliente** integrados

### 💾 Persistencia de Datos
- **Auto-guardado** de descuentos variables
- **Persistencia de catálogo** con descuentos manuales
- **Filtros guardados** automáticamente
- **Recuperación automática** al recargar la página

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework principal
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **SheetJS (XLSX)** - Exportación a Excel
- **LocalStorage** - Persistencia de datos
- **GitHub Pages** - Hosting gratuito y CDN global
- **Express.js** - Servidor backend (opcional, solo para desarrollo local)

## 📁 Estructura del Proyecto

```
lista-cotizacion/
├── src/
│   ├── components/
│   │   └── DataTable.jsx            # Componente de tabla de datos
│   ├── hooks/
│   │   ├── usePriceCalculator.js    # Lógica de cálculos de precios
│   │   └── useDebounce.js          # Hook para búsqueda debounced
│   ├── utils/
│   │   └── formatters.js           # Utilidades de formato
│   ├── App.jsx                     # Componente principal
│   ├── Cotizacion.jsx              # Módulo de cotizaciones
│   ├── index.css                   # Estilos globales
│   └── main.jsx                    # Punto de entrada
├── catalogo.json                   # Datos del catálogo
├── server.js                       # Servidor backend (opcional)
├── server-nuevo.js                 # Servidor backend alternativo
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 16+
- npm o yarn
- Cuenta de Google (opcional, para integración con Google Sheets)

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd catalogo-precios

# Instalar dependencias
npm install
```

### Configuración de Catálogo JSON Remoto (Opcional)

Para sincronizar automáticamente con un archivo JSON remoto:

#### **🚀 Guía Rápida - GitHub Raw (Recomendado):**

1. **Crear repositorio público** en GitHub (o usar uno existente)
2. **Subir el archivo** `catalogo.json` al repositorio
3. **Obtener URL Raw:**
   - Ir al archivo en GitHub
   - Presionar "Raw"
   - Copiar la URL (ejemplo: `https://raw.githubusercontent.com/tuusuario/turepo/main/catalogo.json`)
4. **Configurar variable:**
   ```bash
   VITE_CATALOG_JSON_URL=https://raw.githubusercontent.com/tuusuario/turepo/main/catalogo.json
   ```

#### **📋 Ejemplo Práctico:**
```bash
# 1. Crear repositorio: https://github.com/tuusuario/catalogo-productos
# 2. Subir catalogo.json
# 3. URL Raw resultante:
#    https://raw.githubusercontent.com/tuusuario/catalogo-productos/main/catalogo.json
# 4. Configurar en .env:
#    VITE_CATALOG_JSON_URL=https://raw.githubusercontent.com/tuusuario/catalogo-productos/main/catalogo.json
```

#### **🔧 Solución Backend Completa:**

**Si tienes un backend, puedes crear un servidor que descargue de Google Drive y sirva con CORS:**

**Archivos creados:**
- `server.js` - Servidor backend
- `package-backend.json` - Dependencias del backend

**Instalación del backend:**
```bash
# Instalar dependencias del backend
npm install express cors node-fetch

# Ejecutar el servidor backend
node server.js
```

**Configuración del frontend:**
```bash
# En .env
VITE_CATALOG_JSON_URL=http://localhost:3001/api/catalogo
```

**Resultado:** ✅ El backend descarga de Google Drive sin restricciones CORS y sirve los datos al frontend.

#### ** Configuración Avanzada:**

1. **Preparar archivo JSON:**
    - El archivo debe contener un array de objetos de productos
    - Estructura requerida: `codigo`, `linea`, `nombre`, `precioLista`, `desc1-4`, `stock`
    - Ejemplo:
    ```json
    [
      {
        "codigo": "ABC123",
        "linea": "PAPELERIA",
        "nombre": "Lápiz HB",
        "precioLista": 2.50,
        "desc1": 5.0,
        "desc2": 10.0,
        "desc3": 0,
        "desc4": 0,
        "stock": 100
      }
    ]
    ```

    **Nota**: También se acepta `"precio"` en lugar de `"precioLista"` para compatibilidad con catálogos existentes.

2. **Hospedar el archivo JSON:**
   - Sube el archivo a cualquier servidor web
   - O usa servicios como GitHub Raw, CDN, o tu propia API

3. **Configurar variables de entorno:**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env

   # Configurar URL del JSON remoto
   VITE_CATALOG_JSON_URL=https://tu-api.com/api/catalogo.json
   ```

4. **Ejemplos de URLs válidas:**
   - `https://api.tuempresa.com/catalogo.json`
   - `https://raw.githubusercontent.com/usuario/repo/main/catalogo.json`
   - `https://cdn.tuempresa.com/data/catalogo.json`
   - `https://drive.google.com/uc?export=download&id=FILE_ID` (Google Drive)
   - `/catalogo.json` (para usar el archivo local)

5. **⚠️ LIMITACIÓN IMPORTANTE - Google Drive NO es compatible:**
   - **Google Drive bloquea CORS** desde aplicaciones web
   - **No se puede acceder directamente** desde el frontend
   - **Usa alternativas** como GitHub Raw o tu propio servidor

6. **Alternativas recomendadas:**
   - **GitHub Raw**: Sube el archivo a un repositorio público
   - **Tu propio servidor**: API con CORS habilitado
   - **CDN público**: Netlify, Vercel, o similar
   - **Archivo local**: Para desarrollo y pruebas

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`

### Backend (Opcional)
```bash
# Iniciar servidor backend
npm run dev:backend
# o
node server-nuevo.js
```

### Producción
```bash
# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

### 🚀 Despliegue en GitHub Pages

#### **Opción 1: Despliegue Automático (Recomendado)**
1. **Subir código a GitHub** en un repositorio público
2. **Habilitar GitHub Pages:**
   - Ir a Settings → Pages
   - Seleccionar "GitHub Actions" como source
3. **El workflow incluido** se ejecutará automáticamente en cada push a main
4. **URL resultante:** `https://tu-usuario.github.io/Lista_Cotizacion`

#### **Opción 2: Despliegue Manual**
```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Configurar homepage en package.json
"homepage": "https://tu-usuario.github.io/Lista_Cotizacion"

# Desplegar
npm run deploy
```

#### **Configuración del Repositorio**
- **Nombre del repo:** `Lista_Cotizacion` (importante para la configuración)
- **Rama principal:** `main`
- **GitHub Pages:** Habilitado en Settings → Pages

#### **Características del Despliegue**
- ✅ **100% cliente-side** - No requiere servidor
- ✅ **Persistencia automática** - Funciona con localStorage
- ✅ **Optimizado** - Archivos minificados y comprimidos
- ✅ **CDN global** - Entrega rápida desde GitHub

## 📋 Funcionalidades Detalladas

### Gestión del Catálogo

#### Navegación
- **Catálogo**: Vista principal con tabla de productos
- **Cotización**: Módulo para crear cotizaciones

#### Filtros y Búsqueda
- **Búsqueda**: Campo de texto que filtra por código o nombre
- **Línea**: Dropdown para filtrar por categoría de producto
- **Resultados**: Contador de productos visibles

#### Descuentos Variables
- **4 niveles** de descuentos globales (0-100%)
- **Aplicación automática** a todos los productos
- **Persistencia automática** - Se guardan al cambiar valores
- **Sin botones manuales** - Funciona automáticamente

### Cálculos de Precios

#### Fórmula de Precio Final
```
Precio Unitario = Precio Base × (1 - DescOculto1%) × (1 - DescOculto2%) ×
                   (1 - DescOculto3%) × (1 - DescOculto4%) ×
                   (1 - Desc1%) × (1 - Desc2%) × (1 - Desc3%) × (1 - Desc4%) ×
                   (1 - Especial1%) × (1 - Especial2%)

Total s/IGV = Precio Unitario × Cantidad
Total c/IGV = Total s/IGV × 1.18
```

#### Descuentos Adicionales
- **Hasta 3 niveles** de descuentos manuales por producto
- **Configurables** en la tabla del catálogo
- **Aplicables** en cotizaciones por ítem

### Sistema de Cotizaciones

#### Creación de Cotización
1. **Datos del cliente**: RUC, nombre, orden de compra
2. **Selección de productos**: Interfaz de tarjetas con checkboxes
3. **Configuración por ítem**: Cantidad y descuentos especiales
4. **Cálculo automático**: Totales en tiempo real

#### Exportación
- **Formato Excel** profesional
- **Datos del cliente** incluidos
- **Hoja separada** por línea de producto
- **Fórmulas y formato** automático

### Opciones de Descarga Excel

#### 💰 Lista de Precios
- **Propósito**: Compartir precios con descuentos aplicados a clientes
- **Uso**: Cliente solicita "lista de precios", aplicas descuentos (ej: 25-4-2) y descargas
- **Contenido**: Precios finales con descuentos aplicados, sin columnas vacías
- **Archivo**: `lista_precios_[LINEA]_[TIMESTAMP].xlsx`

#### 📝 Hoja de Pedido
- **Propósito**: Generar pedidos con control de stock
- **Uso**: Ver stock disponible e ingresar cantidades para pedidos
- **Contenido**: Stock, precios y columna vacía para cantidades
- **Archivo**: `hoja_pedido_[LINEA]_[TIMESTAMP].xlsx`

## 🔧 Configuración

### Archivo `catalogo.json`
```json
[
  {
    "codigo": "ABC123",
    "linea": "CATEGORIA",
    "nombre": "Producto Ejemplo",
    "precioLista": 100.00,
    "stock": 50,
    "desc1": 5.0,
    "desc2": 10.0,
    "desc3": 0,
    "desc4": 0
  }
]
```

**Nota**: El sistema acepta tanto `"precio"` como `"precioLista"` para compatibilidad. Internamente se normaliza a `"precio_lista"`.

### Variables de Configuración
- **IGV**: 18% (configurable en `usePriceCalculator.js`)
- **Moneda**: PEN (Perú) - configurable en `App.jsx`
- **Límite de productos**: Sin límite técnico, optimizado para 200+

## 🎨 Interfaz de Usuario

### Diseño Responsivo
- **Desktop**: Tabla completa con todas las columnas
- **Mobile**: Layout adaptativo con elementos esenciales

### Tema Visual
- **Colores principales**: Azul (#3B82F6) y verde (#10B981)
- **Tipografía**: Monospace para códigos, sans-serif para texto
- **Estados**: Hover, focus, loading, error

### Indicadores Visuales
- **Stock**: Colores por nivel (verde >20, amarillo >10, rojo ≤10)
- **Estados**: Guardado, cargando, errores
- **Totales**: Resaltados en colores distintivos

## 🔒 Persistencia de Datos

### Almacenamiento Local
- **Catálogo**: Datos de productos con descuentos manuales
- **Descuentos**: Configuración de descuentos variables
- **Filtros**: Búsqueda y selección de línea
- **Cotizaciones**: No persistidas (por sesión)

### Auto-guardado
- **Descuentos variables**: Se guardan automáticamente al cambiar valores
- **Filtros**: Se guardan automáticamente al cambiar valores
- **Sin intervención manual**: Todo funciona automáticamente

## 📊 Exportación de Datos

### Formato Excel
- **Múltiples hojas**: Una por línea de producto
- **Encabezados**: Código, cantidad, precio base, descuentos, totales
- **Formato**: Moneda, porcentajes, números
- **Filtros**: Auto-filtros aplicados

### Archivo de Salida
```
lista_precios_[LINEA]_[TIMESTAMP].xlsx
hoja_pedido_[LINEA]_[TIMESTAMP].xlsx
```

## 🧹 Limpieza del Proyecto

### Cambios Recientes (v1.1.0)
- ✅ **Optimización para GitHub Pages**: Eliminadas funciones de servidor, descuentos persistentes automáticos
- ✅ **Despliegue automático**: Workflow de GitHub Actions incluido para despliegue continuo
- ✅ **Nombres comerciales claros**: "Lista de Precios" y "Hoja de Pedido" en lugar de términos técnicos
- ✅ **Eliminación de código muerto**: Removidos archivos de ejemplo, temporales y configuraciones duplicadas
- ✅ **Limpieza de dependencias**: Eliminada configuración de testing innecesaria
- ✅ **Optimización de estructura**: Reorganización de archivos y eliminación de directorios vacíos
- ✅ **Consolidación de configuración**: Unificación de archivos de configuración Tailwind
- ✅ **Actualización de documentación**: README actualizado con estructura actual del proyecto

### Archivos Removidos
- `test/` - Directorio de tests (tests rotos eliminados)
- `tailwind.config.cjs` - Configuración duplicada defectuosa
- `catalogo-remoto-ejemplo.json` - Archivo de ejemplo
- `temp_response.json` - Archivo temporal
- `test-calculo.js` - Archivo de prueba temporal
- `instructions.txt` - Documentación temporal

### Funciones Simplificadas (v1.1.0)
- **Eliminadas funciones de servidor**: `fetchFromRemoteJSON()`, `updateCatalogPreserveDiscounts()`, `clearCatalog()`
- **Descuentos automáticos**: Eliminados botones manuales de guardar/limpiar descuentos
- **Exportación simplificada**: Solo 2 opciones de descarga Excel (básico e inventario)
- **Persistencia automática**: Los descuentos se guardan automáticamente al cambiar valores

## 🐛 Solución de Problemas

### Problemas Comunes

#### Error de localStorage
- Verificar permisos del navegador
- Limpiar datos del sitio si es necesario

#### Cálculos incorrectos
- Verificar orden de descuentos
- Revisar valores en catalogo.json

#### Rendimiento lento
- Limitar búsqueda a campos esenciales
- Considerar paginación para catálogos muy grandes

### Logs y Debugging
- Consola del navegador para errores
- localStorage inspector para datos persistidos
- Network tab para requests

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o reportar bugs, por favor crear un issue en el repositorio.

---

**Desarrollado con ❤️ para optimizar la gestión de precios y cotizaciones**