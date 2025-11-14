import React, { useState } from 'react';

/**
 * Componente de tooltip profesional y corporativo
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Elemento que activa el tooltip
 * @param {string} props.content - Contenido del tooltip
 * @param {string} props.position - Posición del tooltip: 'top', 'bottom', 'left', 'right'
 * @param {string} props.variant - Variante de color: 'primary', 'secondary', 'success', 'warning', 'danger'
 * @param {number} props.delay - Retraso en ms antes de mostrar el tooltip
 * @returns {JSX.Element}
 */
export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  variant = 'primary',
  delay = 300,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const variantClasses = {
    primary: 'bg-blue-800 text-white border-blue-600',
    secondary: 'bg-gray-800 text-white border-gray-600',
    success: 'bg-green-700 text-white border-green-600',
    warning: 'bg-yellow-600 text-white border-yellow-500',
    danger: 'bg-red-700 text-white border-red-600'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent'
  };

  const arrowBorderClasses = {
    top: 'border-t-gray-800',
    bottom: 'border-t-gray-800',
    left: 'border-l-gray-800',
    right: 'border-r-gray-800'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`
            absolute z-50 px-3 py-2 text-sm font-medium rounded-md shadow-lg
            border whitespace-nowrap
            ${positionClasses[position]}
            ${variantClasses[variant]}
            animate-fade-in
          `}
          role="tooltip"
        >
          {content}
          <div 
            className={`
              absolute w-0 h-0 
              ${arrowClasses[position]}
              ${variant === 'primary' ? arrowBorderClasses[position] : ''}
            `}
          />
        </div>
      )}
    </div>
  );
}