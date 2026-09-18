import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    []
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
    []
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Entre na sua conta para continuar" />

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="email"
            label="E-mail profissional"
            onChange={handleEmailChange}
            placeholder="voce@empresa.com.br"
            required
            type="email"
            value={email}
          />

          <FormField
            id="password"
            label="Senha"
            onChange={handlePasswordChange}
            placeholder="Sua senha"
            required
            type="password"
            value={password}
          />

          <Button type="submit">Entrar no CRM</Button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Não tem uma conta?{" "}
          <Link
            className="font-medium text-orange-500 transition-colors hover:text-orange-400"
            to="/register"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
