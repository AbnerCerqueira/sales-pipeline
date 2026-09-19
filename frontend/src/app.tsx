import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/login.tsx";
import RegisterPage from "./pages/auth/register.tsx";
import ListLeadsPage from "./pages/leads/list-leads.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<ListLeadsPage />} path="/leads" />
        <Route element={<Navigate replace to="/leads" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
