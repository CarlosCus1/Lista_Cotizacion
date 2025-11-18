# Procesador de Datos

Este módulo procesa los datos de cotización desde archivos Excel y genera los JSON necesarios para la aplicación.

## Archivos requeridos

- `inputs/configuracion_cotizacion.xlsx`: Archivo Excel con la configuración de productos, precios y descuentos.

## Estructura del Excel

### Hoja 1: Stock/Productos
Columnas esperadas:
- `codigo` o `Código`: Código del producto
- `nombre` o `Nombre`: Nombre del producto
- `linea` o `Línea`: Línea del producto
- `categoria` o `Categoría`: Categoría (vinifan, viniball, representadas)
- `precio_lista` o `Precio Lista`: Precio base
- `stock` o `Stock`: Cantidad disponible

### Hoja 2: Configuración de Descuentos
Columnas esperadas:
- `codigo` o `Código`: Código del producto
- `desc1`, `desc2`, `desc3`, `desc4`: Porcentajes de descuento
- `precio_fijo` (opcional): Precio fijo si aplica

## Uso

```bash
npm install
npm run process
```

Esto generará los archivos JSON en `outputs/` y los copiará a `../public/`.

## Archivos generados

- `catalogo-base.json`: Catálogo completo de productos
- `descuentos-fijos.json`: Descuentos por producto
- `sin-descuentos.json`: Lista de códigos sin descuentos
- `stock.json`: Mapeo de códigos a stock disponible