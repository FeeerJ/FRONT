import React, { createContext, useState } from 'react';
import { login } from '../services/authService'; // Asumimos esta función de fetch

// ====================================================================
// UTILIDAD: Decodificación JWT (Conceptual)
// Asumimos que el 'role' está en el payload del JWT
// ====================================================================

// Función para decodificar el token y extraer claims útiles (rol y customerId)
const decodeToken = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));

        // Role puede venir en varias claims
        const roleClaim = payload.role || payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        // Buscar customerId en varias posibles claims comunes
        const idCandidates = [
            'nameidentifier', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
            'sub', 'id', 'userId', 'user_id', 'customerId'
        ];
        let customerId = null;
        for (const key of idCandidates) {
            if (payload[key]) {
                customerId = payload[key];
                break;
            }
        }

        // Validar que customerId tenga formato GUID (si viene en otro formato, no lo tomamos)
        if (customerId && typeof customerId === 'string') {
            const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (!guidRegex.test(customerId)) {
                // Si el valor encontrado no es un GUID, no lo asumimos como customerId
                customerId = null;
            }
        } else {
            customerId = null;
        }

        return {
            token,
            role: Array.isArray(roleClaim) ? roleClaim[0] : roleClaim,
            customerId
        };
    } catch (e) {
        console.error('Error decodificando token:', e);
        return { token, role: null, customerId: null };
    }
};


const AuthContext = createContext();

function AuthProvider({ children }) {
    // CAMBIO 1: Estado para el objeto de usuario (token y role)
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            console.debug('[Auth] init: token found');
            const decoded = decodeToken(token);
            console.debug('[Auth] init: decoded payload', decoded);
            // Asegurarnos de que si existe customerId lo tengamos en localStorage también
            if (decoded.customerId) {
                try { localStorage.setItem('customerId', decoded.customerId); } catch (e) {}
            }
            // También recuperar username previo si existe
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
                decoded.username = storedUsername;
            }
            return decoded;
        }
        return null; // Si no hay token, el usuario es null
    });

    // isAuthenticated ahora es un valor derivado del objeto user
    const isAuthenticated = Boolean(user);
    
    const singout = () => {
        // No limpiar todo el localStorage: solo token y customerId
        try { localStorage.removeItem('token'); } catch (e) {}
        try { localStorage.removeItem('customerId'); } catch (e) {}
        try { localStorage.removeItem('username'); } catch (e) {}
        try { localStorage.removeItem('cart'); } catch (e) {}
        // Notificar a otros componentes que el carrito cambió
        try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {}
        setUser(null);
    };

 const singin = (loginData) => {
    const { token, username, customerId } = loginData;

    const newUser = {
        token,
        username,
        customerId
    };

    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("customerId", customerId);

    setUser(newUser);
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