import React from 'react';
import { calculatePrice } from '../hooks/usePriceCalculator.js';
import Tooltip from './Tooltip.jsx';

export default function DataTable({
  data,
  formatMoney,
  descOcultos,
  descManualCount,
  setDescManualCount,
  updateRow,
  sortKey,
  sortDir,
  handleSort
}) {
  const manualCols = (descManualCount >= 2 ? 1 : 0) + (descManualCount >= 3 ? 1 : 0);
  const totalCols = 12 + manualCols;

  // Medidas ajustadas para alineación perfecta
  const gridTemplate = `
    8%            /* código */
    36%           /* nombre - espacio prioritario */
    6%            /* stock */
    8%            /* precio base */
    5% 5% 5% 5%  /* descuentos */
    7%            /* manual 1 */
    ${descManualCount >= 2 ? '6% ' : ''}  /* manual 2 */
    ${descManualCount >= 3 ? '6% ' : ''}  /* manual 3 */
    5%            /* sin desc */
    8%            /* s/igv */
    8%            /* c/igv */
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="w-full">
      {/* Vista Desktop - Tabla completa */}
      <div className="hidden md:block overflow-x-auto">
        <div
          className="grid gap-0 w-full min-w-[1000px]"
          style={{
            gridTemplateColumns: gridTemplate
          }}
        >
        {/* Primera fila - Headers (Sticky) */}
        <div className="contents h-12"> {/* Altura fija igual que las filas de datos */}
          {/* Código */}
          <Tooltip
            content="Ordenar productos por código"
            position="bottom"
            variant="primary"
            delay={200}
          >
            <button
              onClick={() => handleSort('codigo')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              código
              {sortKey === 'codigo' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Nombre - COLUMNA FLEXIBLE AMPLIADA */}
          <Tooltip
            content="Ordenar productos por nombre"
            position="bottom"
            variant="primary"
            delay={200}
          >
            <button
              onClick={() => handleSort('nombre')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-4 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              nombre
              {sortKey === 'nombre' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Stock */}
          <Tooltip
            content="Ordenar productos por stock disponible"
            position="bottom"
            variant="primary"
            delay={200}
          >
            <button
              onClick={() => handleSort('stock')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              stock
              {sortKey === 'stock' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Precio Base */}
          <Tooltip
            content="Ordenar productos por precio de lista"
            position="bottom"
            variant="primary"
            delay={200}
          >
            <button
              onClick={() => handleSort('precio_lista')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              precio base
              {sortKey === 'precio_lista' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Descuentos - No ordenables */}
          <Tooltip content="Descuento fijo 1 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">desc1</div>
          </Tooltip>
          <Tooltip content="Descuento fijo 2 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">desc2</div>
          </Tooltip>
          <Tooltip content="Descuento fijo 3 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">desc3</div>
          </Tooltip>
          <Tooltip content="Descuento fijo 4 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">desc4</div>
          </Tooltip>

          {/* Manual 1 */}
          <Tooltip content="Descuento manual personalizable - se aplica a todos los productos" position="bottom" variant="warning" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
              <span className="hidden sm:inline">Manual 1</span>
              <span className="sm:hidden">M1</span>
            </div>
          </Tooltip>

          {/* Manual 2 (condicional) */}
          {descManualCount >= 2 && (
            <Tooltip content="Segundo descuento manual personalizable" position="bottom" variant="warning" delay={200}>
              <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                <span className="hidden sm:inline">Manual 2</span>
                <span className="sm:hidden">M2</span>
              </div>
            </Tooltip>
          )}

          {/* Manual 3 (condicional) */}
          {descManualCount >= 3 && (
            <Tooltip content="Tercer descuento manual personalizable" position="bottom" variant="warning" delay={200}>
              <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                <span className="hidden sm:inline">Manual 3</span>
                <span className="sm:hidden">M3</span>
              </div>
            </Tooltip>
          )}

          {/* Sin Descuentos */}
          <Tooltip content="Marcar para omitir descuentos fijos y ocultos (mantiene descuentos manuales)" position="bottom" variant="danger" delay={200}>
            <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
              <div className="flex items-center justify-center">
                <span className="hidden md:inline">sin desc.</span>
                <span className="md:hidden">?</span>
              </div>
            </div>
          </Tooltip>

          {/* S/IGV */}
          <Tooltip content="Ordenar productos por precio sin IGV" position="bottom" variant="success" delay={200}>
            <button
              onClick={() => handleSort('neto')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              <span className="hidden sm:inline">s/igv</span>
              <span className="sm:hidden">s/I</span>
              {sortKey === 'neto' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>

          {/* C/IGV */}
          <Tooltip content="Ordenar productos por precio con IGV incluido" position="bottom" variant="primary" delay={200}>
            <button
              onClick={() => handleSort('final')}
              className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
            >
              <span className="hidden sm:inline">c/igv</span>
              <span className="sm:hidden">c/I</span>
              {sortKey === 'final' && (
                <span className="ml-1 text-xs">
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        {/* Filas de datos */}
        <div className="contents overflow-y-auto max-h-[540px]">
          {data.map((r, dataIndex) => (
            <div key={r.idx} className="contents h-12"> {/* Altura fija para toda la fila */}
              {/* Código */}
              <div className="px-2 py-2 font-mono text-sm border-r border-gray-200 border-b flex items-center justify-start hover:bg-gray-50 h-full">
                <div className="flex items-center gap-1">
                  {r.sinDescuentos && (
                    <Tooltip content="Producto en lista negra - Sin descuentos automáticos" position="top" variant="danger" delay={200}>
                      <span className="text-red-500 font-bold">🚫</span>
                    </Tooltip>
                  )}
                  {r.codigo}
                </div>
              </div>

              {/* Nombre - COLUMNA FLEXIBLE AMPLIADA */}
              <Tooltip
                content={r.nombre}
                position="right"
                variant="secondary"
                delay={500}
                className="w-full"
              >
                <div className="px-4 py-2 border-r border-gray-200 border-b flex items-start hover:bg-gray-50 h-full">
                  <div className="font-medium text-sm break-words line-clamp-2 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help w-full">
                    {r.nombre}
                  </div>
                </div>
              </Tooltip>

              {/* Stock */}
              <div className="px-2 py-2 text-right border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip
                  content={`Stock disponible: ${r.stock || 0} unidades`}
                  position="top"
                  variant={(r.stock || 0) > 20 ? 'success' : (r.stock || 0) > 10 ? 'warning' : 'danger'}
                  delay={200}
                >
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    (r.stock || 0) > 20 ? 'bg-success-100 text-success-800' :
                    (r.stock || 0) > 10 ? 'bg-warning-100 text-warning-800' :
                    'bg-danger-100 text-danger-800'
                  }`}>
                    {r.stock || 0}
                  </span>
                </Tooltip>
              </div>

              {/* Precio Base */}
              <div className="px-2 py-2 text-right tabular-nums font-mono text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip
                  content="Precio de lista sin descuentos"
                  position="top"
                  variant="secondary"
                  delay={200}
                >
                  {formatMoney(r.precio_lista)}
                </Tooltip>
              </div>

              {/* Descuentos */}
              <Tooltip content={`Descuento fijo 1: ${r.desc1 ? parseFloat(r.desc1).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                <div className="px-1 py-2 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  {r.desc1 ? parseFloat(r.desc1).toFixed(2) : ''}
                </div>
              </Tooltip>
              <Tooltip content={`Descuento fijo 2: ${r.desc2 ? parseFloat(r.desc2).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                <div className="px-1 py-2 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  {r.desc2 ? parseFloat(r.desc2).toFixed(2) : ''}
                </div>
              </Tooltip>
              <Tooltip content={`Descuento fijo 3: ${r.desc3 ? parseFloat(r.desc3).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                <div className="px-1 py-2 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  {r.desc3 ? parseFloat(r.desc3).toFixed(2) : ''}
                </div>
              </Tooltip>
              <Tooltip content={`Descuento fijo 4: ${r.desc4 ? parseFloat(r.desc4).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                <div className="px-1 py-2 text-right tabular-nums font-mono text-gray-500 text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  {r.desc4 ? parseFloat(r.desc4).toFixed(2) : ''}
                </div>
              </Tooltip>

              {/* Manual 1 */}
              <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip content="Descuento manual 1 - se aplica siempre" position="top" variant="warning" delay={200}>
                  <input
                    type="text"
                    className="w-14 border border-gray-300 rounded px-1 py-1 text-right tabular-nums text-sm"
                    placeholder="0.00"
                    defaultValue={r.descManual1.toFixed(2)}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      updateRow(dataIndex, 'descManual1', val.toFixed(2));
                    }}
                  />
                </Tooltip>
              </div>

              {/* Manual 2 (condicional) */}
              {descManualCount >= 2 && (
                <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  <Tooltip content="Descuento manual 2 - se aplica siempre" position="top" variant="warning" delay={200}>
                    <input
                      type="text"
                      className="w-14 border border-gray-300 rounded px-1 py-1 text-right tabular-nums text-sm"
                      placeholder="0.00"
                      defaultValue={r.descManual2.toFixed(2)}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateRow(dataIndex, 'descManual2', val.toFixed(2));
                      }}
                    />
                  </Tooltip>
                </div>
              )}

              {/* Manual 3 (condicional) */}
              {descManualCount >= 3 && (
                <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  <Tooltip content="Descuento manual 3 - se aplica siempre" position="top" variant="warning" delay={200}>
                    <input
                      type="text"
                      className="w-14 border border-gray-300 rounded px-1 py-1 text-right tabular-nums text-sm"
                      placeholder="0.00"
                      defaultValue={(r.descManual3 || 0).toFixed(2)}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateRow(dataIndex, 'descManual3', val.toFixed(2));
                      }}
                    />
                  </Tooltip>
                </div>
              )}

              {/* Sin Descuentos */}
              <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip content="Marcar para saltar descuentos fijos y ocultos (mantiene descuentos manuales)" position="top" variant="danger" delay={200}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    checked={r.sinDescuentos || false}
                    onChange={(e) => updateRow(dataIndex, 'sinDescuentos', e.target.checked)}
                  />
                </Tooltip>
              </div>

              {/* S/IGV */}
              <div className="px-2 py-2 text-right tabular-nums font-mono text-success-600 text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip content="Precio sin IGV después de aplicar descuentos" position="top" variant="success" delay={200}>
                  {(() => {
                    const priceCalc = calculatePrice(r, descOcultos);
                    return formatMoney(priceCalc.neto);
                  })()}
                </Tooltip>
              </div>

              {/* C/IGV */}
              <div className="px-2 py-2 text-right tabular-nums font-mono font-bold text-primary-600 text-sm border-b flex items-center justify-center hover:bg-gray-50 h-full">
                <Tooltip content="Precio con IGV incluido (18%)" position="top" variant="primary" delay={200}>
                  {(() => {
                    const priceCalc = calculatePrice(r, descOcultos);
                    return formatMoney(priceCalc.final);
                  })()}
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Vista Móvil - Tabla compacta con overflow horizontal */}
      <div className="md:hidden">
        <div className="overflow-x-auto">
          <div
            className="grid gap-0 w-full min-w-[1200px]"
            style={{
              gridTemplateColumns: gridTemplate
            }}
          >
            {/* Primera fila - Headers móviles (más pequeños) */}
            <div className="contents h-10">
              {/* Código */}
              <Tooltip
                content="Ordenar productos por código"
                position="bottom"
                variant="primary"
                delay={200}
              >
                <button
                  onClick={() => handleSort('codigo')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  código
                  {sortKey === 'codigo' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Nombre - COLUMNA FLEXIBLE AMPLIADA */}
              <Tooltip
                content="Ordenar productos por nombre"
                position="bottom"
                variant="primary"
                delay={200}
              >
                <button
                  onClick={() => handleSort('nombre')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-2 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  nombre
                  {sortKey === 'nombre' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Stock */}
              <Tooltip
                content="Ordenar productos por stock disponible"
                position="bottom"
                variant="primary"
                delay={200}
              >
                <button
                  onClick={() => handleSort('stock')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  stock
                  {sortKey === 'stock' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Precio Base */}
              <Tooltip
                content="Ordenar productos por precio de lista"
                position="bottom"
                variant="primary"
                delay={200}
              >
                <button
                  onClick={() => handleSort('precio_lista')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  precio base
                  {sortKey === 'precio_lista' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Descuentos - No ordenables */}
              <Tooltip content="Descuento fijo 1 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">d1</div>
              </Tooltip>
              <Tooltip content="Descuento fijo 2 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">d2</div>
              </Tooltip>
              <Tooltip content="Descuento fijo 3 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">d3</div>
              </Tooltip>
              <Tooltip content="Descuento fijo 4 para esta línea de productos" position="bottom" variant="secondary" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">d4</div>
              </Tooltip>

              {/* Manual 1 */}
              <Tooltip content="Descuento manual personalizable - se aplica a todos los productos" position="bottom" variant="warning" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M1</div>
              </Tooltip>

              {/* Manual 2 (condicional) */}
              {descManualCount >= 2 && (
                <Tooltip content="Segundo descuento manual personalizable" position="bottom" variant="warning" delay={200}>
                  <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M2</div>
                </Tooltip>
              )}

              {/* Manual 3 (condicional) */}
              {descManualCount >= 3 && (
                <Tooltip content="Tercer descuento manual personalizable" position="bottom" variant="warning" delay={200}>
                  <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M3</div>
                </Tooltip>
              )}

              {/* Sin Descuentos */}
              <Tooltip content="Marcar para omitir descuentos fijos y ocultos (mantiene descuentos manuales)" position="bottom" variant="danger" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">?</div>
              </Tooltip>

              {/* S/IGV */}
              <Tooltip content="Ordenar productos por precio sin IGV" position="bottom" variant="success" delay={200}>
                <button
                  onClick={() => handleSort('neto')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  s/igv
                  {sortKey === 'neto' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* C/IGV */}
              <Tooltip content="Ordenar productos por precio con IGV incluido" position="bottom" variant="primary" delay={200}>
                <button
                  onClick={() => handleSort('final')}
                  className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
                >
                  c/igv
                  {sortKey === 'final' && (
                    <span className="ml-1 text-xs">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </Tooltip>
            </div>

            {/* Filas de datos móviles - más compactas */}
            <div className="contents overflow-y-auto max-h-[400px]">
              {data.map((r, dataIndex) => (
                <div key={r.idx} className="contents h-10">
                  {/* Código */}
                  <div className="px-1 py-1 font-mono text-xs border-r border-gray-200 border-b flex items-center justify-start hover:bg-gray-50 h-full">
                    <div className="flex items-center gap-1">
                      {r.sinDescuentos && (
                        <Tooltip content="Producto en lista negra - Sin descuentos automáticos" position="top" variant="danger" delay={200}>
                          <span className="text-red-500 font-bold text-xs">🚫</span>
                        </Tooltip>
                      )}
                      <span className="truncate">{r.codigo}</span>
                    </div>
                  </div>

                  {/* Nombre - COLUMNA FLEXIBLE AMPLIADA */}
                  <Tooltip
                    content={r.nombre}
                    position="right"
                    variant="secondary"
                    delay={500}
                    className="w-full"
                  >
                    <div className="px-2 py-1 border-r border-gray-200 border-b flex items-start hover:bg-gray-50 h-full">
                      <div className="font-medium text-xs break-words line-clamp-1 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help w-full truncate">
                        {r.nombre}
                      </div>
                    </div>
                  </Tooltip>

                  {/* Stock */}
                  <div className="px-1 py-1 text-right border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip
                      content={`Stock disponible: ${r.stock || 0} unidades`}
                      position="top"
                      variant={(r.stock || 0) > 20 ? 'success' : (r.stock || 0) > 10 ? 'warning' : 'danger'}
                      delay={200}
                    >
                      <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                        (r.stock || 0) > 20 ? 'bg-success-100 text-success-800' :
                        (r.stock || 0) > 10 ? 'bg-warning-100 text-warning-800' :
                        'bg-danger-100 text-danger-800'
                      }`}>
                        {r.stock || 0}
                      </span>
                    </Tooltip>
                  </div>

                  {/* Precio Base */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip
                      content="Precio de lista sin descuentos"
                      position="top"
                      variant="secondary"
                      delay={200}
                    >
                      {formatMoney(r.precio_lista)}
                    </Tooltip>
                  </div>

                  {/* Descuentos */}
                  <Tooltip content={`Descuento fijo 1: ${r.desc1 ? parseFloat(r.desc1).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                    <div className="px-1 py-1 text-right tabular-nums font-mono text-gray-500 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      {r.desc1 ? parseFloat(r.desc1).toFixed(2) : ''}
                    </div>
                  </Tooltip>
                  <Tooltip content={`Descuento fijo 2: ${r.desc2 ? parseFloat(r.desc2).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                    <div className="px-1 py-1 text-right tabular-nums font-mono text-gray-500 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      {r.desc2 ? parseFloat(r.desc2).toFixed(2) : ''}
                    </div>
                  </Tooltip>
                  <Tooltip content={`Descuento fijo 3: ${r.desc3 ? parseFloat(r.desc3).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                    <div className="px-1 py-1 text-right tabular-nums font-mono text-gray-500 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      {r.desc3 ? parseFloat(r.desc3).toFixed(2) : ''}
                    </div>
                  </Tooltip>
                  <Tooltip content={`Descuento fijo 4: ${r.desc4 ? parseFloat(r.desc4).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                    <div className="px-1 py-1 text-right tabular-nums font-mono text-gray-500 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      {r.desc4 ? parseFloat(r.desc4).toFixed(2) : ''}
                    </div>
                  </Tooltip>

                  {/* Manual 1 */}
                  <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Descuento manual 1 - se aplica siempre" position="top" variant="warning" delay={200}>
                      <input
                        type="text"
                        className="w-12 border border-gray-300 rounded px-1 py-0.5 text-right tabular-nums text-xs"
                        placeholder="0.00"
                        defaultValue={r.descManual1.toFixed(2)}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateRow(dataIndex, 'descManual1', val.toFixed(2));
                        }}
                      />
                    </Tooltip>
                  </div>

                  {/* Manual 2 (condicional) */}
                  {descManualCount >= 2 && (
                    <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      <Tooltip content="Descuento manual 2 - se aplica siempre" position="top" variant="warning" delay={200}>
                        <input
                          type="text"
                          className="w-12 border border-gray-300 rounded px-1 py-0.5 text-right tabular-nums text-xs"
                          placeholder="0.00"
                          defaultValue={r.descManual2.toFixed(2)}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateRow(dataIndex, 'descManual2', val.toFixed(2));
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}

                  {/* Manual 3 (condicional) */}
                  {descManualCount >= 3 && (
                    <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      <Tooltip content="Descuento manual 3 - se aplica siempre" position="top" variant="warning" delay={200}>
                        <input
                          type="text"
                          className="w-12 border border-gray-300 rounded px-1 py-0.5 text-right tabular-nums text-xs"
                          placeholder="0.00"
                          defaultValue={(r.descManual3 || 0).toFixed(2)}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateRow(dataIndex, 'descManual3', val.toFixed(2));
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}

                  {/* Sin Descuentos */}
                  <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Marcar para saltar descuentos fijos y ocultos (mantiene descuentos manuales)" position="top" variant="danger" delay={200}>
                      <input
                        type="checkbox"
                        className="w-3 h-3 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        checked={r.sinDescuentos || false}
                        onChange={(e) => updateRow(dataIndex, 'sinDescuentos', e.target.checked)}
                      />
                    </Tooltip>
                  </div>

                  {/* S/IGV */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono text-success-600 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Precio sin IGV después de aplicar descuentos" position="top" variant="success" delay={200}>
                      {(() => {
                        const priceCalc = calculatePrice(r, descOcultos);
                        return formatMoney(priceCalc.neto);
                      })()}
                    </Tooltip>
                  </div>

                  {/* C/IGV */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono font-bold text-primary-600 text-xs border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Precio con IGV incluido (18%)" position="top" variant="primary" delay={200}>
                      {(() => {
                        const priceCalc = calculatePrice(r, descOcultos);
                        return formatMoney(priceCalc.final);
                      })()}
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}