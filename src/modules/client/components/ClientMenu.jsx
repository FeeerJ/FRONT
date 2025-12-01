import React from 'react';

const ClientMenu = ({ isOpen, onClose, onLogout, onGoToCart }) => {
    return (
        <>
            {/* Fondo oscuro */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-40 z-40"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={`
                    fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 
                    transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <div className="p-4 flex justify-end">
                    <button onClick={onClose} className="text-2xl font-bold">×</button>
                </div>

                <nav className="flex flex-col gap-4 p-6 text-lg">
                   

                    <button 
                        className="text-gray-800 hover:text-purple-600"
                        onClick={onLogout}
                    >
                        Cerrar sesión
                    </button>
                </nav>
            </div>
        </>
    );
};

export default ClientMenu;
