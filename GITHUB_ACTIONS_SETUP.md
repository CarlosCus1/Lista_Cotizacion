# 🔧 Guía de Configuración: GitHub Actions y Permisos

## 📋 Paso a Paso para Habilitar GitHub Pages

### **Paso 1: Habilitar GitHub Actions**
1. **Ve al repositorio**: https://github.com/CarlosCus1/Lista_Cotizacion
2. **Click en "Actions"** (tab superior, junto a Settings)
3. **Habilitar Actions**: Si aparece un botón "Enable Actions", click en él
4. **Aceptar flujo de trabajo**: Click "I understand my workflows, go ahead and enable them"

### **Paso 2: Configurar GitHub Pages**
1. **Click en "Settings"** (tab superior)
2. **Scroll down al sidebar izquierdo**: Busca "Pages"
3. **Click en "Pages"**
4. **En "Source"**: Selecciona **"GitHub Actions"**
5. **Guardar**: Click "Save"

### **Paso 3: Configurar Permisos (IMPORTANTE)**

#### **Opción A: Configuración por Repositorio**
1. **En Settings del repositorio**
2. **Click en "Actions"** (sidebar izquierdo)
3. **En "Workflow permissions"**:
   - ✅ Selecciona **"Read and write permissions"**
   - ✅ Marca **"Allow GitHub Actions to create and approve pull requests"**

#### **Opción B: Configuración por Organización (Si tienes una organización)**
1. **Ve a tu organización**: https://github.com/organizations/[tu-organizacion]/settings/actions
2. **En "Workflow permissions"**:
   - ✅ Selecciona **"Read and write permissions"**
   - ✅ Marca **"Allow GitHub Actions to create and approve pull requests"**

### **Paso 4: Verificar el Workflow**
1. **Ve a "Actions"** (tab superior)
2. **Deberías ver**: "Build and Deploy to GitHub Pages" workflow
3. **El workflow debería ejecutarse** cuando hagas push a main

### **Paso 5: Activar Deployment Manual (Una sola vez)**
```bash
# Desde tu terminal local:
git commit --allow-empty -m "Activar GitHub Pages"
git push origin main
```

### **Paso 6: Verificar Funcionamiento**
1. **Ve a Actions**: Deberías ver una ejecución en progreso
2. **Espera 2-3 minutos** para que complete
3. **Ve a**: https://carloscus1.github.io/Lista_Cotizacion/
4. **Verifica**: Ya no aparece código HTML en "Última actualización"

---

## 🚨 **Si GitHub Actions No Funciona:**

### **Problema Común: Permisos Insuficientes**
Si ves errores como:
- `Permission denied (public_key)`
- `Error: Resource not accessible by integration`

### **Solución: Configuración de Token Personal**
1. **Ve a Settings** del repositorio
2. **Click en "Actions"** → **"General"**
3. **En "Workflow permissions"**:
   - Selecciona **"Read and write permissions"**
4. **Save**

### **Si Persiste el Problema:**
1. **Ve a Settings** → **"Security"** → **"Secrets and variables"**
2. **Click "Actions"**
3. **Verificar que existe** el secreto `GITHUB_TOKEN`
4. **Si no existe**: GitHub lo crea automáticamente cuando habilitas Actions

---

## ✅ **Verificación Final**

Una vez configurado correctamente:
- ✅ **GitHub Actions ejecuta automáticamente** en cada push a main
- ✅ **Build exitoso**: "Build successful - dist/ directory created"
- ✅ **Deploy exitoso**: "Deploy to GitHub Pages completed"
- ✅ **Sitio web funciona**: https://carloscus1.github.io/Lista_Cotizacion/
- ✅ **Fecha correcta**: "Última actualización: 26/11/2025, 4:19:50 p. m."

---

## 🔧 **Comandos de Diagnóstico**
```bash
# Verificar estado local
diagnostic-github-pages.bat

# Verificar permisos de GitHub Actions
git status
git log --oneline -3

# Forzar nuevo deployment
git commit --allow-empty -m "Re-trigger deployment"
git push origin main