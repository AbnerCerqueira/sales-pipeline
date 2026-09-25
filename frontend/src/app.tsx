import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { useAuth } from "./context/auth.tsx";
import LoginPage from "./pages/auth/login.tsx";
import RegisterPage from "./pages/auth/register.tsx";
import DealsKanbanPage from "./pages/deals/deals-kanban.tsx";
import ListLeadsPage from "./pages/leads/list-leads.tsx";

function RequireAuth() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

function RedirectIfAuthenticated() {
  const { token } = useAuth();

  if (token) {
    return <Navigate replace to="/leads" />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<ListLeadsPage />} path="/leads" />
          <Route element={<DealsKanbanPage />} path="/deals" />
        </Route>

        <Route element={<Navigate replace to="/leads" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
