import React, { createContext, useState } from 'react';
import { login } from '../services/login'; // Asumimos esta función de fetch

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
        const decoded = decodeToken(token);
        console.debug('[Auth] signin: decoded', decoded);

        // 3. Si el backend devuelve customerId explícito en la respuesta useDataCustomerId lo tomamos
        const dataCustomerId = (typeof data === 'object' && data?.customerId) ? data.customerId : null;
        const dataUsername = (typeof data === 'object' && data?.username) ? data.username : null;

        // Preferimos el customerId decodificado del token si es GUID válido, si no, usamos el que venga en la respuesta
        const effectiveCustomerId = decoded.customerId || dataCustomerId || null;


        const newUser = { ...decoded, customerId: effectiveCustomerId };
        if (dataUsername) {
            newUser.username = dataUsername;
        }
        console.debug('[Auth] signin: dataCustomerId=', dataCustomerId, 'effectiveCustomerId=', effectiveCustomerId);

        // 4. Actualizar el LocalStorage y el estado global (setUser)
        localStorage.setItem('token', token);
        if (effectiveCustomerId) {
            try { localStorage.setItem('customerId', effectiveCustomerId); } catch (e) {}
        }
        if (dataUsername) {
            try { localStorage.setItem('username', dataUsername); } catch (e) {}
        }
        // Si cambia la sesión (username distinto al previo), borrar el carrito para evitar mezclar items
        try {
            const prevUsername = localStorage.getItem('username');
            const newUsername = dataUsername || username;
            if (prevUsername && prevUsername !== newUsername) {
                try { localStorage.removeItem('cart'); } catch (e) {}
                try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {}
            }
        } catch (e) {
            // no bloquear el signin por problemas de localStorage
            console.debug('[Auth] error comprobando cambio de username para limpiar carrito', e);
        }

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