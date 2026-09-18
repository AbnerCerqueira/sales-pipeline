import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/login.tsx";
import RegisterPage from "./pages/auth/register.tsx";
import CreateLeadPage from "./pages/leads/create-lead.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<CreateLeadPage />} path="/leads/new" />
        <Route element={<Navigate replace to="/register" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
