# 🚀 Sistema de Actualización Automática de Datos

Sistema completo para procesar, actualizar y desplegar automáticamente los datos de cotización en GitHub Pages.

## 📋 Características

- ✅ **Procesamiento automático** de archivos Excel
- ✅ **Actualización automática** de archivos JSON
- ✅ **Commit automático** con mensajes descriptivos
- ✅ **Despliegue automático** a GitHub Pages
- ✅ **Sistema de backups** automático
- ✅ **Logging detallado** de todas las operaciones
- ✅ **Detección de cambios** antes de commits innecesarios
- ✅ **Tareas programadas** para ejecución periódica
- ✅ **Monitoreo del sistema** y diagnóstico
- ✅ **Scripts multiplataforma** (.bat y PowerShell)

## 🏗️ Arquitectura

```
data-processor/
├── inputs/                 # Archivos de entrada
│   └── configuracion_cotizacion.xlsx
├── outputs/                # Archivos procesados (JSON)
├── logs/                   # Logs de ejecución
├── backup/                 # Backups automáticos
├── processor.js            # Script principal de procesamiento
├── update-and-deploy.bat   # Script de automatización (Windows)
├── update-and-deploy.ps1   # Script avanzado (PowerShell)
├── create-scheduled-task.ps1 # Configuración de tareas programadas
├── monitor-updates.ps1     # Monitoreo del sistema
└── package.json           # Scripts npm
```

## 🚀 Inicio Rápido

### 1. Instalación
```bash
cd data-processor
npm install
```

### 2. Primera ejecución manual
```bash
# Procesar datos y desplegar
npm run update

# O usando PowerShell (más robusto)
npm run update:auto
```

### 3. Configurar automatización
```bash
# Crear tarea programada diaria a las 9:00 AM
npm run schedule:create

# Verificar estado del sistema
npm run monitor
```

## 📜 Scripts Disponibles

### Procesamiento Básico
```bash
npm run process          # Procesar datos una vez
npm run dev             # Procesar en modo desarrollo
```

### Actualización Completa
```bash
npm run update          # Actualización interactiva completa
npm run update:auto     # Actualización automática (sin pausas)
npm run update:force    # Forzar actualización aunque no haya cambios
npm run update:skip-deploy # Actualizar sin desplegar a GitHub Pages
```

### Mantenimiento
```bash
npm run backup          # Crear backup manual
npm run logs:clean      # Limpiar logs antiguos (>30 días)
npm run monitor         # Verificar estado del sistema
```

### Tareas Programadas
```bash
npm run schedule:create # Crear tarea programada
npm run schedule:remove # Eliminar tarea programada
```

## ⚙️ Configuración Avanzada

### Variables de Entorno
```bash
# En .env (opcional)
GIT_BRANCH=main
DEPLOY_REMOTE=origin
LOG_RETENTION_DAYS=30
BACKUP_RETENTION_DAYS=90
```

### Personalización de Tareas Programadas
```powershell
# Tarea diaria a las 9:00 AM
.\create-scheduled-task.ps1 -Interval Daily -Time "09:00"

# Tarea semanal los lunes a las 8:00 AM
.\create-scheduled-task.ps1 -Interval Weekly -Time "08:00"

# Eliminar tarea
.\create-scheduled-task.ps1 -Remove
```

## 📊 Monitoreo y Diagnóstico

### Verificar Estado del Sistema
```bash
npm run monitor
```

**Salida típica:**
```
=========================================
🔍 MONITOREO DEL SISTEMA DE ACTUALIZACIÓN
=========================================

📁 VERIFICACIÓN DE ARCHIVOS
✅ Catálogo Base - Última modificación: 2024-01-15 09:30:00 (2.5 horas)
✅ Stock - Última modificación: 2024-01-15 09:30:00 (2.5 horas)
✅ Descuentos Fijos - Última modificación: 2024-01-15 09:30:00 (2.5 horas)

📊 ANÁLISIS DE LOGS (últimos 7 días)
📈 Estadísticas:
   Total de ejecuciones: 12
   Actualizaciones exitosas: 11
   Actualizaciones fallidas: 1
   Última actualización: 2024-01-15 09:30:00 (2.5 horas atrás)

⏰ ESTADO DE TAREA PROGRAMADA
✅ Tarea programada encontrada
   Estado: Ready
   Próxima ejecución: 2024-01-16 09:00:00
```

### Revisar Logs
```bash
# Ver logs recientes
Get-ChildItem ../logs/*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# Ver contenido de un log específico
Get-Content ../logs/update_20240115_093000.log
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### ❌ "Node.js no está instalado"
```bash
# Instalar Node.js desde https://nodejs.org
node --version  # Verificar instalación
```

#### ❌ "Git no está configurado"
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

#### ❌ "Error de permisos en tarea programada"
- Ejecutar PowerShell como administrador
- Verificar permisos de escritura en carpetas del proyecto

#### ❌ "Fallo en el despliegue"
```bash
# Verificar configuración de GitHub Pages
git remote -v
npm run deploy  # Intentar despliegue manual
```

### Logs de Diagnóstico
Los logs se guardan en `../logs/` con formato:
```
update_YYYYMMDD_HHMMSS.log
```

Cada log contiene:
- Timestamp de inicio/fin
- Comandos ejecutados
- Resultados de cada paso
- Errores detallados
- Estadísticas de procesamiento

## 📈 Métricas y Reportes

### Estadísticas Automáticas
El sistema registra automáticamente:
- ✅ Tasa de éxito de actualizaciones
- ⏱️ Tiempo promedio de procesamiento
- 📊 Número de productos procesados
- 🔄 Frecuencia de actualizaciones
- 💾 Espacio usado por backups

### Reportes de Salud
```bash
npm run monitor
```
Proporciona diagnóstico completo del sistema incluyendo:
- Estado de archivos
- Historial de actualizaciones
- Estado de backups
- Configuración de tareas programadas

## 🔒 Seguridad y Backups

### Sistema de Backups Automático
- ✅ Backup antes de cada actualización
- ✅ Retención configurable (por defecto 90 días)
- ✅ Compresión automática de backups antiguos
- ✅ Restauración manual disponible

### Control de Acceso
- 🔐 Verificación de permisos de Git
- 🔐 Validación de archivos de configuración
- 🔐 Logs de auditoría completos

## 🚀 Despliegue en Producción

### Configuración para Servidor
```bash
# Instalar dependencias
npm install

# Configurar tarea programada
npm run schedule:create

# Verificar funcionamiento
npm run monitor
```

### Monitoreo Continuo
```bash
# Agregar a crontab (Linux/Mac) o Programador de Tareas (Windows)
# Ejecutar diariamente: npm run monitor
```

## 📝 API y Integraciones

### Webhooks (Futuro)
El sistema puede extenderse para:
- ✅ Notificaciones por email/Slack
- ✅ Integración con APIs externas
- ✅ Triggers automáticos desde sistemas ERP
- ✅ Alertas de stock bajo

### Scripts Personalizados
```javascript
// En processor.js - agregar lógica personalizada
console.log('Procesamiento personalizado completado');
```

## 🆘 Soporte

### Reportar Problemas
1. Ejecutar `npm run monitor` y copiar la salida
2. Revisar logs en `../logs/`
3. Verificar archivos en `inputs/` y `outputs/`

### Logs de Debug
```bash
# Habilitar logging detallado
$env:DEBUG = "true"
npm run update
```

---

## 🎯 Resumen Ejecutivo

Este sistema proporciona una solución completa y robusta para la actualización automática de datos de cotización, asegurando que tu aplicación web siempre tenga la información más reciente sin intervención manual.

**Beneficios Clave:**
- 🔄 **Cero intervención manual** después de la configuración inicial
- 📊 **Transparencia total** con logging detallado
- 🛡️ **Alta confiabilidad** con backups y validaciones
- ⚡ **Rendimiento optimizado** con detección de cambios
- 🎛️ **Fácil configuración** con scripts npm

**Métricas Típicas:**
- ⏱️ **Tiempo de procesamiento**: < 30 segundos
- 📈 **Tasa de éxito**: > 99%
- 💾 **Espacio requerido**: < 50MB para logs y backups
- 🔄 **Frecuencia óptima**: Diaria o según necesidades del negocio