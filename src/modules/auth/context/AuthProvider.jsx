import React, { createContext, useState } from 'react';

// Función para decodificar el token y extraer claims útiles (rol, customerId, username)
const decodeToken = (token) => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));

    // El rol puede venir en varias claims
    const roleClaim = payload.role || payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    // Extraer username / email tolerando que sub o emailaddress sea un email o nombre
    const usernameClaim = payload.unique_name || payload.name || payload.email || payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    // Busca customerId en varias posibles claims comunes
    const idCandidates = [
      'customerId', 'id', 'userId', 'user_id',
      'nameidentifier', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
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
      customerId,
      username: usernameClaim || null,
    };
  } catch (e) {
    console.error('Error decodificando token:', e);

    return { token, role: null, customerId: null, username: null };
  }
};

const AuthContext = createContext();

function AuthProvider({ children }) {
  // Estado para el objeto de usuario (token, role, customerId, username)
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    /* Si existe un token */
    if (token) {
      console.debug('[Auth] init: token found');
      const decoded = decodeToken(token); /* va a intentar decodificarlo */

      console.debug('[Auth] init: decoded payload', decoded);

      // Recuperar customerId desde localStorage o del token decodificado
      const storedCustomerId = localStorage.getItem('customerId');
      if (storedCustomerId) {
        decoded.customerId = storedCustomerId;
      } else if (decoded.customerId) {
        try { localStorage.setItem('customerId', decoded.customerId); } catch (e) {
          console.error('[Auth] Error guardando customerId en localStorage:', e);
        }
      }

      // Recuperar username desde localStorage o del token decodificado
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        decoded.username = storedUsername;
      } else if (decoded.username) {
        try { localStorage.setItem('username', decoded.username); } catch (e) {
          console.error('[Auth] Error guardando username en localStorage:', e);
        }
      }

      // Recuperar role desde localStorage o del token decodificado
      const storedRole = localStorage.getItem('role');
      if (storedRole) {
        decoded.role = storedRole;
      } else if (decoded.role) {
        try { localStorage.setItem('role', decoded.role); } catch (e) {
          console.error('[Auth] Error guardando role en localStorage:', e);
        }
      }

      return decoded;
    }

    return null; // Si no hay token, el usuario es null
  });

  // isAuthenticated ahora es un valor derivado del objeto user
  const isAuthenticated = Boolean(user);

  const singout = () => {
    // Limpiar localStorage: token, customerId, username, role y cart
    try { localStorage.removeItem('token'); } catch (e) {
      console.error('[Auth] Error removing token from localStorage:', e);
    }
    try { localStorage.removeItem('customerId'); } catch (e) {
      console.error('[Auth] Error removing customerId from localStorage:', e);
    }
    try { localStorage.removeItem('username'); } catch (e) {
      console.error('[Auth] Error removing username from localStorage:', e);
    }
    try { localStorage.removeItem('role'); } catch (e) {
      console.error('[Auth] Error removing role from localStorage:', e);
    }
    try { localStorage.removeItem('cart'); } catch (e) {
      console.error('[Auth] Error removing cart from localStorage:', e);
    }
    // Notificar a otros componentes que el carrito cambió
    try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {
      console.error('[Auth] Error dispatching cartUpdated event:', e);
    }
    setUser(null);
  };

  const singin = (loginData) => {
    const { token, username, customerId, role } = loginData;

    const newUser = {
      token,
      username,
      customerId,
      role,
    };

    localStorage.setItem('token', token);
    if (username) localStorage.setItem('username', username);
    if (customerId) localStorage.setItem('customerId', customerId);
    if (role) localStorage.setItem('role', role);

    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={ {
        isAuthenticated,
        user, // estas opciones de valores y funcionenen van a quedar disponibles para el resto de la app
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