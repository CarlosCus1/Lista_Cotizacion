# 🚀 Automatización de Actualización de Datos

## 🎯 Opciones de Automatización Disponibles

### 1. 🚀 **GitHub Actions (MÁS RECOMENDADO)**
Sistema completamente automatizado en la nube con alta confiabilidad.

#### Archivo: `.github/workflows/update-stock-and-deploy.yml`

**Ventajas:**
- ✅ **Totalmente automático** - Se ejecuta sin intervención humana
- ✅ **Programado diariamente** - Actualización automática cada día
- ✅ **Manejo robusto de errores** - Reintentos automáticos
- ✅ **Logs detallados** - Seguimiento completo en GitHub
- ✅ **No depende de máquina local** - Siempre disponible
- ✅ **Notificaciones** - Alertas por email/Slack opcionales

**Triggers disponibles:**
- **Manual**: Desde interfaz de GitHub Actions
- **Programado**: Todos los días a las 6 AM UTC (1 AM Lima)
- **Automático**: En push a rama main

**Para ejecutar manualmente:**
1. Ir a GitHub → Actions → "Update Stock & Deploy"
2. Click "Run workflow"
3. Seleccionar opciones si es necesario

---

### 2. 🖥️ **Script Mejorado Local (ALTERNATIVA ROBUSTA)**

#### Archivo: `update-and-deploy-improved.bat`

**Ventajas:**
- ✅ **Manejo avanzado de errores** - Verificación de cada paso
- ✅ **Backups automáticos** - Seguridad de datos
- ✅ **Logs detallados** - Seguimiento completo
- ✅ **Verificación de prerrequisitos** - Antes de ejecutar
- ✅ **Modo interactivo** - Control del usuario

#### Uso Básico

```batch
# Ejecutar automatización completa mejorada
update-and-deploy-improved.bat
```

#### Lo que hace el script mejorado

1. ✅ **Verificación exhaustiva de prerrequisitos**
2. ✅ **Creación automática de backups**
3. ✅ **Procesamiento seguro de datos**
4. ✅ **Validación de cambios**
5. ✅ **Commit inteligente** (solo si hay cambios)
6. ✅ **Push seguro con manejo de errores**
7. ✅ **Build y deploy completo**

---

### 3. 📜 **Script PowerShell Original**

#### Archivo: `data-processor/update-and-deploy.ps1`

**Ventajas:**
- ✅ **Funcionalidad completa** - Todos los features
- ✅ **Parámetros avanzados** - Control granular
- ✅ **Scripting profesional** - Manejo avanzado

#### Uso con Parámetros

```powershell
# Modo automático completo
.\data-processor\update-and-deploy.ps1 -Auto

# Solo procesar, sin deploy
.\data-processor\update-and-deploy.ps1 -SkipDeploy

# Forzar actualización
.\data-processor\update-and-deploy.ps1 -Force
```

---

### 4. 📜 **Script Batch Simple**

#### Archivo: `update-and-deploy.bat`

**Ventajas:**
- ✅ **Simple y directo** - Un solo clic
- ✅ **Rápido** - Mínima configuración
- ✅ **Compatible** - Funciona en cualquier Windows

#### Uso Básico

```batch
# Simplemente ejecutar
update-and-deploy.bat
```

---

## 📊 Comparación de Métodos

| Característica | GitHub Actions | Script Mejorado | PowerShell | Batch Simple |
|---|---|---|---|---|
| **Confiabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Automatización** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Manejo de Errores** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Logs** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Backups** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Facilidad de Uso** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dependencia Local** | ❌ | ✅ | ✅ | ✅ |

---

## 🔧 Configuración de Tareas Programadas (Windows)

Para automatización local programada, crear tarea programada:

1. **Buscar**: "Programador de tareas"
2. **Crear tarea**: "Actualización Stock Cotización"
3. **Trigger**: Diario a las 6:00 AM
4. **Acción**: Ejecutar `update-and-deploy-improved.bat`
5. **Directorio**: Ruta completa del proyecto

---

## 📋 Requisitos del Sistema

### Para Todos los Métodos
- **Node.js** 18+ instalado
- **npm** instalado
- **Git** configurado
- **PowerShell** (para scripts avanzados)

### Para GitHub Actions
- Repositorio en GitHub
- GitHub Actions habilitado
- Permisos de escritura en repo

### Para Scripts Locales
- Windows 10/11
- Acceso a archivos de stock
- Conexión a internet

---

## 🚨 Solución de Problemas

### Error: "Node.js no está disponible"
```bash
# Instalar Node.js
# Descargar desde: https://nodejs.org/
```

### Error: "Archivo de stock no encontrado"
```bash
# Verificar ruta en processor.js
# STOCK_COMPLETO_PATH = 'C:\Users\ccusi\Documents\Proyect_Coder\gestion_de_stock\procesamiento\data_stock_completo.xlsx'
```

### Error en GitHub Actions
- Revisar logs en Actions tab
- Verificar permisos del repo
- Confirmar que archivos de configuración existen

### Error de Commit/Push
```bash
# Verificar credenciales Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 📈 Recomendación Final

**Para máxima confiabilidad**: Usar **GitHub Actions** con el workflow programado.

**Para control local**: Usar **Script Mejorado** (`update-and-deploy-improved.bat`).

**Para simplicidad**: Usar **Batch Simple** (`update-and-deploy.bat`).

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