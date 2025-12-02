import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../auth/hook/useAuth';
import Button from '../../shared/components/Button';

function Dashboard() {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const { singout } = useAuth();

  const logout = () => {
    singout();
    navigate('/login');
  };

  useEffect(() => {
    document.body.style.overflow = openMenu ? 'hidden' : 'auto';
  }, [openMenu]);

  const getLinkStyles = ({ isActive }) =>
    `
      pl-4 w-full block pt-4 pb-4 rounded-4xl transition hover:bg-gray-100
      ${isActive ? 'bg-purple-200 hover:bg-purple-100' : ''}
    `;

  const renderLogoutButton = (mobile = false) => (
    <Button
      className={`${mobile ? 'block w-full sm:hidden' : 'hidden sm:block'}`}
      onClick={logout}
    >
      Cerrar sesión
    </Button>
  );

  return (
    <div
      className="
        h-full grid grid-cols-1 grid-rows-[auto_1fr]
        sm:gap-3 sm:grid-cols-[256px_1fr]
      "
    >
      {/* HEADER */}
      <header
        className="
          flex items-center justify-between p-4 shadow rounded bg-white
          sm:col-span-2
        "
      >
        <span>Admin Dashboard</span>
        {renderLogoutButton()}
        <button
          className="bg-transparent border-none sm:hidden"
          onClick={() => setOpenMenu(!openMenu)}
        >
          {openMenu ? <span>&#215;</span> : <span>&#9776;</span>}
        </button>
      </header>

      {/* OVERLAY (solo mobile) */}
      {openMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[9998] sm:hidden"
          onClick={() => setOpenMenu(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`
    fixed z-[9999] sm:relative sm:z-auto
    top-0 left-0 h-full w-64
    bg-white shadow-xl p-6 rounded-r-2xl
    transform transition-transform duration-300
    ${openMenu ? 'translate-x-0' : '-translate-x-full'}
    sm:translate-x-0
  `}
      >
        <nav>
          <ul className="flex flex-col">

            <li>
              <NavLink
                to="/admin/home"
                className={getLinkStyles}
                onClick={() => setOpenMenu(false)}
              >
          Principal
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/products"
                className={getLinkStyles}
                onClick={() => setOpenMenu(false)}
              >
          Productos
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/orders"
                className={getLinkStyles}
                onClick={() => setOpenMenu(false)}
              >
          Ordenes
              </NavLink>
            </li>

          </ul>
          <hr className="opacity-15 mt-4" />
        </nav>

        {renderLogoutButton(true)}
      </aside>

      {/* MAIN */}
      <main className="p-5 overflow-y-scroll">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
