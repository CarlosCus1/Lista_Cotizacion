
import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { calculatePrice, calculateCompoundHiddenDiscount } from './hooks/usePriceCalculator.js';
import { useDebounce } from './hooks/useDebounce.js';
import catalogData from '../public/catalogo-base.json';
import discountData from '../public/descuentos-fijos.json';
import stockData from '../public/stock.json';
import noDiscountData from '../public/sin-descuentos.json';
import { formatMoney, formatTimeAgo } from './utils/formatters.js';
import CategoryFilter from './components/CategoryFilter.jsx'; 
  
export default App; 
