import React from 'react';

const categories = [
    { id: 'vinifan', name: '🎨 Vinifan' },
    { id: 'viniball', name: '🏀 Viniball' },
    { id: 'representadas', name: '🏢 Representadas' },
];

export default function CategoryFilter({ categoriasActivas, setCategoriasActivas }) {
    const toggleCategory = (id) => {
        setCategoriasActivas(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Categorías Principales</label>
            <div className="grid grid-cols-3 gap-2">
                {categories.map(({ id, name }) => (
                    <button
                        key={id}
                        onClick={() => toggleCategory(id)}
                        className={`w-full px-2 py-3 rounded-lg text-xs sm:text-sm font-bold transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${categoriasActivas[id]
                                ? 'bg-blue-600 text-white shadow-md active:bg-blue-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                            }`}
                    >
                        {name}
                    </button>
                ))}
            </div>
        </div>
    );
}