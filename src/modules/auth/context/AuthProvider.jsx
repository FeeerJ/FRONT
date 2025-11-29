import React, { createContext, useState } from 'react';
import { login } from '../services/login'; // Asumimos esta función de fetch

// ====================================================================
// UTILIDAD: Decodificación JWT (Conceptual)
// Asumimos que el 'role' está en el payload del JWT
// ====================================================================

// Función para decodificar el token y extraer el rol (necesita jwt-decode o función utilitaria)
const decodeToken = (token) => {
    try {
        // En una aplicación real, instalarías 'jwt-decode' (npm install jwt-decode)
        // Por simplicidad, usamos la decodificación manual y asumimos que la claim es 'role'
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        // Asumimos que la claim de roles se llama 'role' o 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        const roleClaim = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        
        // Retornamos el objeto de usuario con el token y el rol
        return { 
            token, 
            role: Array.isArray(roleClaim) ? roleClaim[0] : roleClaim // Maneja si el rol es un array o string
        };
    } catch (e) {
        console.error("Error decodificando token:", e);
        // Retornar un rol por defecto o nulo si falla la decodificación
        return { token, role: null }; 
    }
};


const AuthContext = createContext();

function AuthProvider({ children }) {
    // CAMBIO 1: Estado para el objeto de usuario (token y role)
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Inicializar el estado decodificando el token guardado al cargar la aplicación
            return decodeToken(token);
        }
        return null; // Si no hay token, el usuario es null
    });

    // isAuthenticated ahora es un valor derivado del objeto user
    const isAuthenticated = Boolean(user);
    
    const singout = () => {
        localStorage.clear();
        setUser(null); // Limpiar el objeto de usuario
    };

    const singin = async (username, password) => {
        // 1. Llamada al servicio de login
        const { data, error } = await login(username, password);

        if (error) {
            return { error }; // Retorna el error si falla
        }

        // data puede ser una cadena (token) o un objeto { token: '...' }
        const token = typeof data === 'string' ? data : data?.token;

        if (!token) {
            return { error: { frontendErrorMessage: 'No se recibió token del servidor' } };
        }

        // 2. Decodificar el token para obtener el rol y el token
        const newUser = decodeToken(token);

        // 3. Actualizar el LocalStorage y el estado global (setUser)
        localStorage.setItem('token', token);
        setUser(newUser);

        // 4. Retorna el objeto de usuario para que el LoginForm lo use
        return { error: null, user: newUser };
    };
    return (
        <AuthContext.Provider
            value={ {
                isAuthenticated,
                user, // EXPORNER EL OBJETO USER COMPLETO
                singin,
                singout,
            } }
        >
            {children}
        </AuthContext.Provider>
    );
};

export {
    AuthProvider,
    AuthContext,
};