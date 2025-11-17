# Lista de Cotización

Aplicación web para catálogo de precios interactivo con sistema de cotizaciones.

## 🚀 Despliegue en GitHub Pages

### Configuración Inicial
1. Actualizar `package.json`:
   ```json
   "homepage": "https://TU-USUARIO.github.io/Lista_Cotizacion"
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Desplegar:
   ```bash
   npm run deploy
   ```

## 📊 Sistema de Datos

### Estructura Simplificada
- `catalogo-base.json` - Productos básicos
- `stock.json` - Inventario actual
- `descuentos-fijos.json` - Descuentos específicos
- `sin-descuentos.json` - Excepciones

### Procesamiento Automático
```bash
# Actualización completa
data-processor\update-and-deploy.bat
```

## 🔧 Arquitectura

### Mini-Proyecto `data-processor/`
- **Inputs**: Configuración manual + datos del ERP
- **Proceso**: Filtrado y transformación
- **Outputs**: JSONs optimizados
- **Deploy**: Commit automático

### Flujo de Datos
```
ERP → Stock Completo → Procesador → JSONs → GitHub Pages
```

## 📋 Características

- ✅ Catálogo interactivo con paginación (50/100 por página)
- ✅ Sistema de cotizaciones con ordenamiento y paginación
- ✅ Cálculos de descuentos automáticos con formato decimal mejorado
- ✅ Exportación a Excel (lista de precios y hoja de pedido)
- ✅ Persistencia offline con IndexedDB
- ✅ Actualización automática de datos
- ✅ Interfaz responsive con tabla móvil completa
- ✅ Ordenamiento por múltiples columnas en todas las tablas
- ✅ UX mejorada en inputs de descuentos (selección automática, formateo)

## 🛠️ Desarrollo

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview
npm run preview
```

## 📁 Estructura del Proyecto

```
Lista_Cotizacion/
├── data-processor/          # Procesamiento de datos
│   ├── inputs/             # Configuración manual
│   ├── outputs/            # JSONs generados
│   └── processor.js        # Script de procesamiento
├── public/                 # Assets estáticos
├── src/                    # Código fuente React
└── package.json