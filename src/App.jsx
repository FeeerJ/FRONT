import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage'
import Dashboard from './modules/templates/components/Dashboard';
import ProtectedRoute from './modules/auth/components/ProtectedRoute';
import ListOrdersPage from './modules/orders/pages/ListOrdersPage';
import Home from './modules/home/pages/Home';
import ListProductsPage from './modules/products/pages/ListProductsPage';
import ClientProductPage from './modules/products/pages/ClientListProductPage';
import CreateProductPage from './modules/products/pages/CreateProductPage';
import CartPage from './modules/products/pages/CartPage';

function App() {
  const router = createBrowserRouter([
    /* AREA CLIENTE */
    {
      path: '/',
      element: <><Outlet /></>,
      children: [
        {
          path: '/',
          element: < ClientProductPage/>,
        },
        {
          path: '/cart',
          element: <CartPage/>,
        },
      ],
    },
    /* AREA USUARIO */
    {
      path: '/signup',
      element: <RegisterPage />,
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
     /* AREA ADMIN */
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
      children: [
        {
          path: '/admin/home',
          element: <Home />,
        },
        {
          path: '/admin/products',
          element: <ListProductsPage />,
        },
        {
          path: '/admin/products/create',
          element: <CreateProductPage />,
        },
        {
          path: '/admin/orders',
          element: <ListOrdersPage />,
        },
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
