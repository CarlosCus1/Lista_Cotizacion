$file = 'data-processor/processor.js'
$content = Get-Content $file -Raw -Encoding UTF8

# Buscar la sección donde se guardan los archivos
$oldCode = @'
  const sinDescuentosJson = Array.from(preciosFijosMap.keys()); // Solo códigos con precio fijo

  // Crear directorio outputs si no existe
  if (!fs.existsSync('./outputs')) {
    fs.mkdirSync('./outputs');
  }

  // Guardar archivos
  fs.writeFileSync('./outputs/catalogo-base.json', JSON.stringify(catalogoBase, null, 2));
  fs.writeFileSync('./outputs/stock.json', JSON.stringify(stockJson, null, 2));
  fs.writeFileSync('./outputs/descuentos-fijos.json', JSON.stringify(descuentosFijosJson, null, 2));
  fs.writeFileSync('./outputs/sin-descuentos.json', JSON.stringify(sinDescuentosJson, null, 2));
'@

$newCode = @'
  const sinDescuentosJson = Array.from(preciosFijosMap.keys()); // Solo códigos con precio fijo

  // Crear directorio outputs si no existe
  if (!fs.existsSync('./outputs')) {
    fs.mkdirSync('./outputs');
  }

  // Metadata con fecha de actualización
  const metadata = {
    _metadata: {
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  };

  // Guardar archivos con metadata
  fs.writeFileSync('./outputs/catalogo-base.json', JSON.stringify({ ...metadata, data: catalogoBase }, null, 2));
  fs.writeFileSync('./outputs/stock.json', JSON.stringify({ ...metadata, data: stockJson }, null, 2));
  fs.writeFileSync('./outputs/descuentos-fijos.json', JSON.stringify({ ...metadata, data: descuentosFijosJson }, null, 2));
  fs.writeFileSync('./outputs/sin-descuentos.json', JSON.stringify({ ...metadata, data: sinDescuentosJson }, null, 2));
'@

$content = $content -replace [regex]::Escape($oldCode), $newCode

[System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.Encoding]::UTF8)

Write-Host "✅ Metadata agregada al processor.js"
