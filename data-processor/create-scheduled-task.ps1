<#
.SYNOPSIS
    Crea una tarea programada para actualización automática de datos

.DESCRIPTION
    Configura una tarea programada en Windows para ejecutar actualizaciones
    automáticas de datos de cotización en intervalos regulares.

.PARAMETER Interval
    Intervalo de ejecución (Daily, Weekly, Monthly)

.PARAMETER Time
    Hora de ejecución en formato HH:mm

.PARAMETER Remove
    Elimina la tarea programada existente

.EXAMPLE
    .\create-scheduled-task.ps1 -Interval Daily -Time "09:00"
    .\create-scheduled-task.ps1 -Remove
#>

param(
    [ValidateSet("Daily", "Weekly", "Monthly")]
    [string]$Interval = "Daily",

    [ValidatePattern("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")]
    [string]$Time = "09:00",

    [switch]$Remove
)

$taskName = "CotizacionDataUpdate"
$scriptPath = $PSScriptRoot
$psScript = Join-Path $scriptPath "update-and-deploy.ps1"

function Write-Log {
    param([string]$Message)
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message"
}

if ($Remove) {
    Write-Log "Eliminando tarea programada: $taskName"
    try {
        schtasks /delete /tn $taskName /f 2>$null
        Write-Log "✅ Tarea programada eliminada exitosamente"
    }
    catch {
        Write-Log "⚠️ No se pudo eliminar la tarea (puede que no exista)"
    }
    exit 0
}

# Verificar que el script existe
if (!(Test-Path $psScript)) {
    Write-Log "❌ Error: Script no encontrado: $psScript"
    exit 1
}

# Verificar permisos de administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (!$isAdmin) {
    Write-Log "⚠️ Advertencia: Se requieren permisos de administrador para crear tareas programadas"
    Write-Log "Ejecuta este script como administrador para continuar"
    $choice = Read-Host "¿Continuar de todos modos? (S/N)"
    if ($choice -ne 'S' -and $choice -ne 's') {
        exit 1
    }
}

Write-Log "Creando tarea programada: $taskName"
Write-Log "Intervalo: $Interval"
Write-Log "Hora: $Time"
Write-Log "Script: $psScript"

# Construir comando schtasks
$command = "schtasks /create /tn `"$taskName`" /tr `"powershell -ExecutionPolicy Bypass -File \`"$psScript\`"`" /sc $Interval /st $Time"

if ($Interval -eq "Weekly") {
    $command += " /d MON"
}
elseif ($Interval -eq "Monthly") {
    $command += " /d 1"
}

$command += " /ru `"$env:USERNAME`" /rl HIGHEST /f"

Write-Log "Comando: $command"

try {
    # Ejecutar comando
    $result = cmd /c $command 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Tarea programada creada exitosamente"

        # Verificar que se creó correctamente
        $verify = schtasks /query /tn $taskName 2>$null
        if ($verify) {
            Write-Log "✅ Verificación exitosa: Tarea programada activa"
        }

        Write-Log ""
        Write-Log "📋 Información de la tarea:"
        Write-Log "Nombre: $taskName"
        Write-Log "Programa: PowerShell"
        Write-Log "Argumentos: -ExecutionPolicy Bypass -File `"$psScript`""
        Write-Log "Intervalo: $Interval a las $Time"
        Write-Log "Usuario: $env:USERNAME"

        Write-Log ""
        Write-Log "💡 Para modificar la tarea:"
        Write-Log "   schtasks /change /tn `"$taskName`" /st NuevaHora"
        Write-Log ""
        Write-Log "💡 Para ver el historial:"
        Write-Log "   schtasks /query /tn `"$taskName`" /v /fo LIST"

    }
    else {
        Write-Log "❌ Error creando tarea programada"
        Write-Log "Código de error: $LASTEXITCODE"
        Write-Log "Salida: $result"
        exit 1
    }

}
catch {
    Write-Log "❌ Error ejecutando comando: $($_.Exception.Message)"
    exit 1
}

Write-Log ""
Write-Log "🎉 Configuración completada!"
Write-Log "La actualización automática se ejecutará $Interval a las $Time"