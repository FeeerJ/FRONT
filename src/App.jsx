import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import Dashboard from './modules/templates/components/Dashboard';
import ProtectedRoute from './modules/shared/components/ProtectedRoute'; /* Cambiamos la ubicacion del protectedRoute */
import ListOrdersPage from './modules/orders/pages/ListOrdersPage';
import Home from './modules/home/pages/Home';
import ListProductsPage from './modules/products/pages/ListProductsPage';
import ClientProductPage from './modules/products/pages/ClientListProductPage';
import CreateProductPage from './modules/products/pages/CreateProductPage';
import CartPage from './modules/cart/pages/CartPage';
import Header from './modules/shared/components/Header';
import RootLayout from './modules/shared/components/RootLayout.jsx';

function App() {
  const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,   // ✔ Aca metemos el Header
    children: [
      { path: '/', element: <ClientProductPage /> },
      { path: '/cart', element: <CartPage /> },
    ],
  },
  {
    path: '/signup',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    children: [
      { path: '/admin/home', element: <Home /> },
      { path: '/admin/products', element: <ListProductsPage /> },
      { path: '/admin/products/create', element: <CreateProductPage /> },
      { path: '/admin/orders', element: <ListOrdersPage /> },
    ],
  },
]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
