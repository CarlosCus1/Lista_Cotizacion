import { describe, it, expect } from 'vitest';
import catalogo from '../catalogo.json';

describe('Catálogo de Productos', () => {
  it('debe ser un array de productos', () => {
    expect(Array.isArray(catalogo)).toBe(true);
  });

  it('debe tener al menos un producto', () => {
    expect(catalogo.length).toBeGreaterThan(0);
  });

  it('cada producto debe tener las propiedades correctas', () => {
    catalogo.forEach(product => {
      expect(product).toHaveProperty('codigo');
      expect(product).toHaveProperty('linea');
      expect(product).toHaveProperty('nombre');
      expect(product).toHaveProperty('precio');
      expect(product).toHaveProperty('desc1');
      expect(product).toHaveProperty('desc2');
      expect(product).toHaveProperty('desc3');
      expect(product).toHaveProperty('desc4');

      // Validaciones adicionales de tipos de datos
      expect(typeof product.codigo).toBe('string');
      expect(typeof product.linea).toBe('string');
      expect(typeof product.nombre).toBe('string');
      expect(typeof product.precio).toBe('number');
      expect(typeof product.desc1).toBe('number');
      expect(typeof product.desc2).toBe('number');
      expect(typeof product.desc3).toBe('number');
      expect(typeof product.desc4).toBe('number');
    });
  });

  it('los precios deben ser números positivos', () => {
    catalogo.forEach(product => {
      expect(product.precio).toBeGreaterThan(0);
    });
  });

  it('los descuentos deben estar entre 0 y 100', () => {
    catalogo.forEach(product => {
      expect(product.desc1).toBeGreaterThanOrEqual(0);
      expect(product.desc1).toBeLessThanOrEqual(100);
      expect(product.desc2).toBeGreaterThanOrEqual(0);
      expect(product.desc2).toBeLessThanOrEqual(100);
      expect(product.desc3).toBeGreaterThanOrEqual(0);
      expect(product.desc3).toBeLessThanOrEqual(100);
      expect(product.desc4).toBeGreaterThanOrEqual(0);
      expect(product.desc4).toBeLessThanOrEqual(100);
    });
  });

  it('los códigos deben ser únicos', () => {
    const codigos = catalogo.map(product => product.codigo);
    const codigosUnicos = new Set(codigos);
    expect(codigosUnicos.size).toBe(codigos.length);
  });
});
