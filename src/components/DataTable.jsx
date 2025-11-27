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

  // Medidas ajustadas para alineación perfecta
  const gridTemplate = `
    4%            /* orden */
    8%            /* código */
    32%           /* nombre - espacio prioritario */
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
          <div className="contents h-12">
            {/* Orden */}
            <Tooltip content="Ordenar por secuencia original" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('orden')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                #
                {sortKey === 'orden' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* Código */}
            <Tooltip content="Ordenar productos por código" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('codigo')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                código
                {sortKey === 'codigo' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* Nombre */}
            <Tooltip content="Ordenar productos por nombre" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('nombre')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-4 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                nombre
                {sortKey === 'nombre' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* Stock */}
            <Tooltip content="Ordenar productos por stock disponible" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('stock')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                stock
                {sortKey === 'stock' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* Precio Base */}
            <Tooltip content="Ordenar productos por precio de lista" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('precio_lista')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                precio base
                {sortKey === 'precio_lista' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* Descuentos Fijos Headers */}
            {['desc1', 'desc2', 'desc3', 'desc4'].map((d, i) => (
              <Tooltip key={d} content={`Descuento fijo ${i + 1} para esta línea de productos`} position="bottom" variant="secondary" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                  {d}
                </div>
              </Tooltip>
            ))}

            {/* Manual 1 Header */}
            <Tooltip content="Descuento manual personalizable - se aplica a todos los productos" position="bottom" variant="warning" delay={200}>
              <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                <span className="hidden sm:inline">Manual 1</span>
                <span className="sm:hidden">M1</span>
              </div>
            </Tooltip>

            {/* Manual 2 Header */}
            {descManualCount >= 2 && (
              <Tooltip content="Segundo descuento manual personalizable" position="bottom" variant="warning" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                  <span className="hidden sm:inline">Manual 2</span>
                  <span className="sm:hidden">M2</span>
                </div>
              </Tooltip>
            )}

            {/* Manual 3 Header */}
            {descManualCount >= 3 && (
              <Tooltip content="Tercer descuento manual personalizable" position="bottom" variant="warning" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                  <span className="hidden sm:inline">Manual 3</span>
                  <span className="sm:hidden">M3</span>
                </div>
              </Tooltip>
            )}

            {/* Sin Descuentos Header */}
            <Tooltip content="Marcar para omitir descuentos fijos y ocultos (mantiene descuentos manuales)" position="bottom" variant="danger" delay={200}>
              <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-1 py-2 border-r border-primary-600 flex items-center justify-center w-full h-full">
                <div className="flex items-center justify-center">
                  <span className="hidden md:inline">sin desc.</span>
                  <span className="md:hidden">?</span>
                </div>
              </div>
            </Tooltip>

            {/* S/IGV Header */}
            <Tooltip content="Ordenar productos por precio sin IGV" position="bottom" variant="success" delay={200}>
              <button
                onClick={() => handleSort('neto')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                <span className="hidden sm:inline">s/igv</span>
                <span className="sm:hidden">s/I</span>
                {sortKey === 'neto' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>

            {/* C/IGV Header */}
            <Tooltip content="Ordenar productos por precio con IGV incluido" position="bottom" variant="primary" delay={200}>
              <button
                onClick={() => handleSort('final')}
                className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-sm shadow-md px-2 py-2 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full"
              >
                <span className="hidden sm:inline">c/igv</span>
                <span className="sm:hidden">c/I</span>
                {sortKey === 'final' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Filas de datos Desktop */}
          <div className="contents overflow-y-auto max-h-[540px]">
            {data.map((r, dataIndex) => (
              <div key={r.codigo} className="contents h-12">
                {/* Orden */}
                <div className="px-2 py-2 font-mono text-xs text-gray-500 border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  {r.orden}
                </div>

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

                {/* Nombre */}
                <Tooltip content={r.nombre} position="right" variant="secondary" delay={500} className="w-full">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${(r.stock || 0) > 20 ? 'bg-success-100 text-success-800' :
                      (r.stock || 0) > 10 ? 'bg-warning-100 text-warning-800' :
                        'bg-danger-100 text-danger-800'
                      }`}>
                      {r.stock || 0}
                    </span>
                  </Tooltip>
                </div>

                {/* Precio Base */}
                <div className="px-2 py-2 text-right tabular-nums font-mono text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  <Tooltip content="Precio de lista sin descuentos" position="top" variant="secondary" delay={200}>
                    {formatMoney(r.precio_lista)}
                  </Tooltip>
                </div>

                {/* Descuentos Fijos */}
                {[r.desc1, r.desc2, r.desc3, r.desc4].map((d, i) => (
                  <div key={i} className={`px-1 py-2 text-right tabular-nums font-mono text-sm border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full ${d > 0 ? 'font-bold text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
                    <Tooltip content={`Descuento fijo ${i + 1}: ${d ? parseFloat(d).toFixed(2) : '0.00'}%`} position="top" variant="secondary" delay={200}>
                      {d ? parseFloat(d).toFixed(2) : ''}
                    </Tooltip>
                  </div>
                ))}

                {/* Manual 1 */}
                <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  <Tooltip content="Descuento manual 1 - se aplica siempre" position="top" variant="warning" delay={200}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`w-14 border rounded px-1 py-1 text-right tabular-nums text-sm transition-colors ${r.descManual1 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300 text-gray-600'}`}
                      placeholder="0.00"
                      defaultValue={r.descManual1 > 0 ? r.descManual1.toFixed(2) : ''}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        let valStr = e.target.value.replace(',', '.');
                        let val = parseFloat(valStr);
                        if (isNaN(val)) val = 0;
                        if (val !== r.descManual1) {
                          updateRow(r.idx, 'descManual1', val);
                        }
                        e.target.value = val > 0 ? val.toFixed(2) : '';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                    />
                  </Tooltip>
                </div>

                {/* Manual 2 */}
                {descManualCount >= 2 && (
                  <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Descuento manual 2 - se aplica siempre" position="top" variant="warning" delay={200}>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-14 border rounded px-1 py-1 text-right tabular-nums text-sm transition-colors ${r.descManual2 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300 text-gray-600'}`}
                        placeholder="0.00"
                        defaultValue={r.descManual2 > 0 ? r.descManual2.toFixed(2) : ''}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                          let valStr = e.target.value.replace(',', '.');
                          let val = parseFloat(valStr);
                          if (isNaN(val)) val = 0;
                          if (val !== r.descManual2) {
                            updateRow(r.idx, 'descManual2', val);
                          }
                          e.target.value = val > 0 ? val.toFixed(2) : '';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                      />
                    </Tooltip>
                  </div>
                )}

                {/* Manual 3 */}
                {descManualCount >= 3 && (
                  <div className="px-1 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Descuento manual 3 - se aplica siempre" position="top" variant="warning" delay={200}>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-14 border rounded px-1 py-1 text-right tabular-nums text-sm transition-colors ${r.descManual3 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300 text-gray-600'}`}
                        placeholder="0.00"
                        defaultValue={r.descManual3 > 0 ? r.descManual3.toFixed(2) : ''}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                          let valStr = e.target.value.replace(',', '.');
                          let val = parseFloat(valStr);
                          if (isNaN(val)) val = 0;
                          if (val !== r.descManual3) {
                            updateRow(r.idx, 'descManual3', val);
                          }
                          e.target.value = val > 0 ? val.toFixed(2) : '';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                      />
                    </Tooltip>
                  </div>
                )}

                {/* Sin Descuentos */}
                <div className="px-2 py-2 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                  <Tooltip content="Marcar para ignorar descuentos fijos y globales (mantiene manuales)" position="top" variant="danger" delay={200}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                      checked={r.sinDescuentos || false}
                      onChange={(e) => updateRow(r.idx, 'sinDescuentos', e.target.checked)}
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
            {/* Primera fila - Headers móviles */}
            <div className="contents h-10">
              {/* Orden */}
              <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">#</div>

              {/* Código */}
              <Tooltip content="Ordenar productos por código" position="bottom" variant="primary" delay={200}>
                <button onClick={() => handleSort('codigo')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  código
                  {sortKey === 'codigo' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>

              {/* Nombre */}
              <Tooltip content="Ordenar productos por nombre" position="bottom" variant="primary" delay={200}>
                <button onClick={() => handleSort('nombre')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-2 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  nombre
                  {sortKey === 'nombre' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>

              {/* Stock */}
              <Tooltip content="Ordenar productos por stock disponible" position="bottom" variant="primary" delay={200}>
                <button onClick={() => handleSort('stock')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  stock
                  {sortKey === 'stock' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>

              {/* Precio Base */}
              <Tooltip content="Ordenar productos por precio de lista" position="bottom" variant="primary" delay={200}>
                <button onClick={() => handleSort('precio_lista')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  precio base
                  {sortKey === 'precio_lista' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>

              {/* Descuentos Headers */}
              {['d1', 'd2', 'd3', 'd4'].map((d, i) => (
                <Tooltip key={d} content={`Descuento fijo ${i + 1}`} position="bottom" variant="secondary" delay={200}>
                  <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">{d}</div>
                </Tooltip>
              ))}

              {/* Manual Headers */}
              <Tooltip content="Descuento manual 1" position="bottom" variant="warning" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M1</div>
              </Tooltip>
              {descManualCount >= 2 && (
                <Tooltip content="Descuento manual 2" position="bottom" variant="warning" delay={200}>
                  <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M2</div>
                </Tooltip>
              )}
              {descManualCount >= 3 && (
                <Tooltip content="Descuento manual 3" position="bottom" variant="warning" delay={200}>
                  <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">M3</div>
                </Tooltip>
              )}

              {/* Sin Desc Header */}
              <Tooltip content="Sin descuentos" position="bottom" variant="danger" delay={200}>
                <div className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center w-full h-full">?</div>
              </Tooltip>

              {/* S/IGV Header */}
              <Tooltip content="Ordenar por precio sin IGV" position="bottom" variant="success" delay={200}>
                <button onClick={() => handleSort('neto')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 border-r border-primary-600 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  s/igv
                  {sortKey === 'neto' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>

              {/* C/IGV Header */}
              <Tooltip content="Ordenar por precio con IGV" position="bottom" variant="primary" delay={200}>
                <button onClick={() => handleSort('final')} className="sticky top-0 z-10 bg-primary-800 text-white font-bold text-xs shadow-md px-1 py-1 flex items-center justify-center hover:bg-primary-700 transition-colors w-full h-full">
                  c/igv
                  {sortKey === 'final' && <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </Tooltip>
            </div>

            {/* Filas de datos móviles */}
            <div className="contents overflow-y-auto max-h-[400px]">
              {data.map((r, dataIndex) => (
                <div key={r.codigo} className="contents h-10">
                  {/* Orden */}
                  <div className="px-1 py-1 font-mono text-xs text-gray-500 border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    {r.orden}
                  </div>

                  {/* Código */}
                  <div className="px-1 py-1 font-mono text-xs border-r border-gray-200 border-b flex items-center justify-start hover:bg-gray-50 h-full">
                    <div className="flex items-center gap-1">
                      {r.sinDescuentos && (
                        <Tooltip content="Producto en lista negra" position="top" variant="danger" delay={200}>
                          <span className="text-red-500 font-bold text-xs">🚫</span>
                        </Tooltip>
                      )}
                      <span className="truncate">{r.codigo}</span>
                    </div>
                  </div>

                  {/* Nombre */}
                  <Tooltip content={r.nombre} position="right" variant="secondary" delay={500} className="w-full">
                    <div className="px-2 py-1 border-r border-gray-200 border-b flex items-start hover:bg-gray-50 h-full">
                      <div className="font-medium text-xs break-words line-clamp-1 hover:line-clamp-none hover:whitespace-normal transition-all duration-200 cursor-help w-full truncate">
                        {r.nombre}
                      </div>
                    </div>
                  </Tooltip>

                  {/* Stock */}
                  <div className="px-1 py-1 text-right border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip
                      content={`Stock: ${r.stock || 0}`}
                      position="top"
                      variant={(r.stock || 0) > 20 ? 'success' : (r.stock || 0) > 10 ? 'warning' : 'danger'}
                      delay={200}
                    >
                      <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${(r.stock || 0) > 20 ? 'bg-success-100 text-success-800' : (r.stock || 0) > 10 ? 'bg-warning-100 text-warning-800' : 'bg-danger-100 text-danger-800'}`}>
                        {r.stock || 0}
                      </span>
                    </Tooltip>
                  </div>

                  {/* Precio Base */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Precio de lista" position="top" variant="secondary" delay={200}>
                      {formatMoney(r.precio_lista)}
                    </Tooltip>
                  </div>

                  {/* Descuentos Fijos */}
                  {[r.desc1, r.desc2, r.desc3, r.desc4].map((d, i) => (
                    <div key={i} className="px-1 py-1 text-right tabular-nums font-mono text-gray-500 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      <Tooltip content={`Desc ${i + 1}: ${d}%`} position="top" variant="secondary" delay={200}>
                        {d ? parseFloat(d).toFixed(2) : ''}
                      </Tooltip>
                    </div>
                  ))}

                  {/* Manual 1 */}
                  <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Manual 1" position="top" variant="warning" delay={200}>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-12 border rounded px-1 py-0.5 text-right tabular-nums text-xs ${r.descManual1 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300'}`}
                        placeholder="0.00"
                        defaultValue={r.descManual1 > 0 ? r.descManual1.toFixed(2) : ''}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                          let valStr = e.target.value.replace(',', '.');
                          let val = parseFloat(valStr);
                          if (isNaN(val)) val = 0;
                          if (val !== r.descManual1) {
                            updateRow(r.idx, 'descManual1', val);
                          }
                          e.target.value = val > 0 ? val.toFixed(2) : '';
                        }}
                      />
                    </Tooltip>
                  </div>

                  {/* Manual 2 */}
                  {descManualCount >= 2 && (
                    <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      <Tooltip content="Manual 2" position="top" variant="warning" delay={200}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`w-12 border rounded px-1 py-0.5 text-right tabular-nums text-xs ${r.descManual2 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300'}`}
                          placeholder="0.00"
                          defaultValue={r.descManual2 > 0 ? r.descManual2.toFixed(2) : ''}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            let valStr = e.target.value.replace(',', '.');
                            let val = parseFloat(valStr);
                            if (isNaN(val)) val = 0;
                            if (val !== r.descManual2) {
                              updateRow(r.idx, 'descManual2', val);
                            }
                            e.target.value = val > 0 ? val.toFixed(2) : '';
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}

                  {/* Manual 3 */}
                  {descManualCount >= 3 && (
                    <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                      <Tooltip content="Manual 3" position="top" variant="warning" delay={200}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`w-12 border rounded px-1 py-0.5 text-right tabular-nums text-xs ${r.descManual3 > 0 ? 'border-blue-400 bg-blue-50 font-bold text-blue-700' : 'border-gray-300'}`}
                          placeholder="0.00"
                          defaultValue={r.descManual3 > 0 ? r.descManual3.toFixed(2) : ''}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            let valStr = e.target.value.replace(',', '.');
                            let val = parseFloat(valStr);
                            if (isNaN(val)) val = 0;
                            if (val !== r.descManual3) {
                              updateRow(r.idx, 'descManual3', val);
                            }
                            e.target.value = val > 0 ? val.toFixed(2) : '';
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}

                  {/* Sin Descuentos */}
                  <div className="px-1 py-1 text-center border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="Sin desc" position="top" variant="danger" delay={200}>
                      <input
                        type="checkbox"
                        className="w-3 h-3 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                        checked={r.sinDescuentos || false}
                        onChange={(e) => updateRow(r.idx, 'sinDescuentos', e.target.checked)}
                      />
                    </Tooltip>
                  </div>

                  {/* S/IGV */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono text-success-600 text-xs border-r border-gray-200 border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="S/IGV" position="top" variant="success" delay={200}>
                      {(() => {
                        const priceCalc = calculatePrice(r, descOcultos);
                        return formatMoney(priceCalc.neto);
                      })()}
                    </Tooltip>
                  </div>

                  {/* C/IGV */}
                  <div className="px-1 py-1 text-right tabular-nums font-mono font-bold text-primary-600 text-xs border-b flex items-center justify-center hover:bg-gray-50 h-full">
                    <Tooltip content="C/IGV" position="top" variant="primary" delay={200}>
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