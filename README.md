# Catálogo de Precios Interactivo

Una aplicación web moderna para gestionar catálogos de productos con cálculos de precios dinámicos, descuentos acumulativos y generación de cotizaciones en Excel.

## 🚀 Características Principales

### 📊 Gestión de Catálogo
- **Vista tabular** optimizada para grandes volúmenes de datos (hasta 200+ productos)
- **Búsqueda en tiempo real** por código o nombre de producto
- **Filtrado por línea** de productos
- **Ordenamiento** por código o línea
- **Persistencia automática** de datos y configuraciones

### 💰 Cálculos de Precios Avanzados
- **Descuentos acumulativos**: Todos los descuentos se aplican de manera secuencial
- **Múltiples niveles de descuento**:
  - Descuentos ocultos (globales)
  - Descuentos del producto (desde JSON)
  - Descuentos especiales (manuales)
- **Cálculo automático de IGV** (18%)
- **Precios en tiempo real** sin recargar la página

### 🧾 Sistema de Cotizaciones
- **Selección visual** de productos con tarjetas interactivas
- **Cálculo automático** de totales por cotización
- **Descuentos por ítem** en cotizaciones
- **Exportación a Excel** con formato profesional
- **Datos del cliente** integrados

### 💾 Persistencia de Datos
- **Auto-guardado** de descuentos ocultos
- **Persistencia de catálogo** con descuentos manuales
- **Filtros guardados** automáticamente
- **Recuperación automática** al recargar la página

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework principal
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **React Window** - Virtualización (removida en favor de tabla nativa)
- **SheetJS (XLSX)** - Exportación a Excel
- **LocalStorage** - Persistencia de datos

## 📁 Estructura del Proyecto

```
catalogo-precios/
├── public/
│   ├── vite.svg
│   └── manifest.json
├── src/
│   ├── hooks/
│   │   ├── usePriceCalculator.js    # Lógica de cálculos de precios
│   │   └── useDebounce.js          # Hook para búsqueda debounced
│   ├── App.jsx                     # Componente principal
│   ├── Cotizacion.jsx              # Módulo de cotizaciones
│   ├── index.css                   # Estilos globales
│   └── main.jsx                    # Punto de entrada
├── catalogo.json                   # Datos del catálogo
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 16+
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd catalogo-precios

# Instalar dependencias
npm install
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`

### Producción
```bash
# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

## 📋 Funcionalidades Detalladas

### Gestión del Catálogo

#### Navegación
- **Catálogo**: Vista principal con tabla de productos
- **Cotización**: Módulo para crear cotizaciones

#### Filtros y Búsqueda
- **Búsqueda**: Campo de texto que filtra por código o nombre
- **Línea**: Dropdown para filtrar por categoría de producto
- **Resultados**: Contador de productos visibles

#### Descuentos Ocultos
- **4 niveles** de descuentos globales (0-100%)
- **Aplicación automática** a todos los productos
- **Persistencia** automática al cambiar valores
- **Botones** para guardar/limpiar configuración

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

#### Descuentos Especiales
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

## 🔧 Configuración

### Archivo `catalogo.json`
```json
[
  {
    "codigo": "ABC123",
    "linea": "CATEGORIA",
    "nombre": "Producto Ejemplo",
    "precio": 100.00,
    "stock": 50,
    "desc1": 5.0,
    "desc2": 10.0,
    "desc3": 0,
    "desc4": 0
  }
]
```

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
- **Descuentos**: Configuración de descuentos ocultos
- **Filtros**: Búsqueda y selección de línea
- **Cotizaciones**: No persistidas (por sesión)

### Auto-guardado
- **Descuentos ocultos**: Cada cambio se guarda automáticamente
- **Catálogo**: Al presionar F5 o cerrar la página
- **Filtros**: Al cambiar valores

## 📊 Exportación de Datos

### Formato Excel
- **Múltiples hojas**: Una por línea de producto
- **Encabezados**: Código, cantidad, precio base, descuentos, totales
- **Formato**: Moneda, porcentajes, números
- **Filtros**: Auto-filtros aplicados

### Archivo de Salida
```
precios_[LINEA]_[DESCUENTOS]_[TIMESTAMP].xlsx
```

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