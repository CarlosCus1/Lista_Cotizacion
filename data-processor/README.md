# Data Processor - Cotización

Mini-proyecto para procesar y actualizar datos de la aplicación de cotización.

## 📁 Estructura

```
data-processor/
├── inputs/
│   └── configuracion_cotizacion.xlsx  # Configuración manual
├── outputs/                          # JSONs generados
├── processor.js                      # Script principal
├── package.json                      # Dependencias
└── update-and-deploy.bat            # Automatización completa
```

## 🚀 Uso

### Procesamiento Manual
```bash
cd data-processor
npm install
npm run process
```

### Automatización Completa
```bash
# Desde la raíz del proyecto
data-processor\update-and-deploy.bat
```

## 📊 Archivos de Configuración

### `configuracion_cotizacion.xlsx`

#### Hoja `codigos_cotizacion`
| codigo |
|--------|
| 76227  |
| 76225  |

#### Hoja `descuentos_fijos`
| codigo | desc1 | desc2 | desc3 | desc4 |
|--------|-------|-------|-------|-------|
| 76225  | 0.00  | 25.00 | 0.00  | 0.00  |

#### Hoja `sin_descuentos`
| codigo |
|--------|
| 76226  |
| 77266  |

## 🔄 Flujo de Trabajo

1. **ERP genera** `data_stock_completo.xlsx` cada hora
2. **Script lee** datos desde carpeta `gestion_de_stock`
3. **Cruce** con configuración local
4. **Genera** JSONs filtrados
5. **Commit automático** a GitHub Pages

## 📋 JSONs Generados

- `catalogo-base.json` - Productos básicos
- `stock.json` - Stock por código
- `descuentos-fijos.json` - Descuentos específicos
- `sin-descuentos.json` - Códigos sin descuentos

## ⚙️ Requisitos

- Node.js
- Acceso a carpeta `gestion_de_stock\procesamiento\`
- Archivo `configuracion_cotizacion.xlsx` configurado