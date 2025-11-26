# 🚀 Sistema de Actualización Simplificado

## Nueva Arquitectura - Despliegue Directo desde main

### ✅ **Ventajas del Nuevo Sistema:**
- **Simplicidad**: Un solo workflow (main → GitHub Pages)
- **Control Manual**: Decides cuándo hacer commits
- **Deployment Automático**: GitHub Actions se encarga automáticamente
- **Menos Complejidad**: Sin sincronización entre ramas

### 📁 **Estructura de Archivos JSON:**
```
src/App.jsx → importa desde → data-processor/outputs/
                             ↓
                       [Archivos JSON procesados]
```

### 🔧 **Scripts Disponibles:**

#### 1. `process-only.bat` - Solo Procesamiento
```batch
process-only.bat
```
- **Función**: Solo actualiza los JSONs desde los archivos XLSX
- **Sin commits**: No toca Git ni hace commits automáticos
- **Uso**: Para actualizar datos cuando necesitas probar localmente

#### 2. `update-and-deploy-improved.bat` - Procesamiento + Guías
```batch
update-and-deploy-improved.bat
```
- **Función**: Actualiza JSONs + muestra instrucciones para continuar
- **Flujo**: Procesa datos → Muestra qué hacer después
- **Guía**: Te dice exactamente qué comandos usar para commit/deploy

#### 3. `update-and-deploy.bat` (Original) - Full Automation
```batch
update-and-deploy.bat
```
- **Función**: Todo automatizado (procesamiento + commit + push + deploy)
- **Uso**: Solo cuando quieras automatización completa

### 🎯 **Nuevo Workflow Recomendado:**

#### **Opción A: Procesamiento Simple**
```batch
# 1. Solo procesar datos
process-only.bat

# 2. Revisar cambios
git status

# 3. Si todo está bien, commit manual desde VS Code o:
git add .
git commit -m "Actualización de stock desde ERP"

# 4. Push (GitHub Actions despliega automáticamente)
git push origin main
```

#### **Opción B: Guía Visual**
```batch
# 1. Usar script mejorado
update-and-deploy-improved.bat

# 2. Seguir las instrucciones que aparecen en pantalla
```

#### **Opción C: Automatización Completa**
```batch
# 1. Usar el script original
update-and-deploy.bat

# 2. Todo se hace automáticamente
```

### ⚙️ **Configuración GitHub Actions:**
El archivo `.github/workflows/deploy.yml` ya está configurado para:
- Ejecutar en `push` a la rama `main`
- Hacer `npm install` y `npm run build`
- Desplegar automáticamente a GitHub Pages

### 🔍 **Flujo de Datos:**
```
ERP (Excel) → processor.js → data-processor/outputs/JSONs → src/App.jsx → GitHub Pages
```

### 📋 **Lista de Archivos JSON Generados:**
- `catalogo-base.json` - Catálogo de productos base
- `stock.json` - Stock de productos  
- `descuentos-fijos.json` - Descuentos aplicados
- `sin-descuentos.json` - Productos sin descuentos

### 🚨 **Notas Importantes:**
1. **Control de Commits**: El script mejorado NO hace commits automáticos
2. **Deployment**: Siempre es automático via GitHub Actions
3. **Testing Local**: Usa `process-only.bat` para probar sin afectar Git
4. **Backup**: Los archivos se respaldan automáticamente en `public/backup/`

### 🛠️ **Para Desarrolladores:**
Si quieres hacer cambios al sistema:
1. Edita archivos en `src/`
2. Testea localmente con `npm run dev`
3. Cuando estés listo, haz commit manual
4. GitHub Actions se encarga del build y deployment

---

**🎯 Resultado: Sistema más simple, control total sobre commits, deployment automático**