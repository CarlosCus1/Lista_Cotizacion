# 🚀 Automatización de Actualización de Datos

## Archivo Batch Principal

### `update-and-deploy.bat`

Este archivo batch es el punto de entrada principal para iniciar el proceso de automatización completo.

#### Uso Básico

```batch
# Ejecutar automatización completa
update-and-deploy.bat

# Ejecutar en modo automático (sin pausas)
update-and-deploy.bat -Auto

# Solo procesar datos, omitir despliegue
update-and-deploy.bat -SkipDeploy

# Forzar actualización aunque no haya cambios
update-and-deploy.bat -Force
```

#### Parámetros Disponibles

- **Sin parámetros**: Modo interactivo con pausas
- **`-Auto`**: Modo automático sin pausas interactivas
- **`-SkipDeploy`**: Omite el despliegue a GitHub Pages
- **`-Force`**: Fuerza la actualización incluso si no hay cambios

#### Lo que hace el script

1. ✅ **Verifica prerrequisitos** (Node.js, npm, Git)
2. ✅ **Crea backups** de archivos JSON existentes
3. ✅ **Procesa datos** desde Excel usando Node.js
4. ✅ **Copia archivos** JSON a la carpeta `public`
5. ✅ **Verifica cambios** en archivos
6. ✅ **Crea commit** automático si hay cambios
7. ✅ **Sube cambios** a rama main de Git
8. ✅ **Despliega** a GitHub Pages (opcional)

#### Archivos de Log

Los logs detallados se guardan en la carpeta `logs/` con nombres como:
- `update_20251122_191700.log`

#### Archivos de Backup

Los backups se guardan en `public/backup/` con nombres como:
- `catalogo-base_20251122_191700.json`

## Scripts de PowerShell

### `data-processor/update-and-deploy.ps1`

Script principal de PowerShell con funcionalidad completa.

### `data-processor/create-scheduled-task.ps1`

Script para crear tareas programadas en Windows.

### `data-processor/monitor-updates.ps1`

Script para monitorear actualizaciones.

## Requisitos

- **Node.js** instalado y en PATH
- **npm** instalado y en PATH
- **Git** instalado y configurado
- **PowerShell** disponible
- Repositorio Git inicializado
- Archivo `data-processor/inputs/configuracion_cotizacion.xlsx`

## Ejemplos de Uso

### Actualización Diaria Automática

```batch
# Para uso diario - modo automático
update-and-deploy.bat -Auto
```

### Pruebas sin Despliegue

```batch
# Solo procesar y subir cambios, sin desplegar
update-and-deploy.bat -SkipDeploy
```

### Forzar Actualización

```batch
# Actualizar incluso si no hay cambios aparentes
update-and-deploy.bat -Force
```

## Solución de Problemas

### Error: "Node.js no está instalado"
- Instala Node.js desde https://nodejs.org/
- Reinicia la terminal

### Error: "Git no está disponible"
- Instala Git desde https://git-scm.com/
- Configura tu usuario: `git config --global user.name "Tu Nombre"`

### Error: "Archivo de configuración no encontrado"
- Verifica que existe: `data-processor/inputs/configuracion_cotizacion.xlsx`

### Error en despliegue
- Verifica que tienes configurado `gh-pages` en package.json
- Verifica permisos de escritura en GitHub

## Logs y Monitoreo

- Revisa `logs/update_*.log` para detalles completos
- Los backups están en `public/backup/` por seguridad
- El timestamp de última actualización está en `public/last-update.txt`