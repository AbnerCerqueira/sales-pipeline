import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    []
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    []
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
    []
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfirmPassword(e.target.value),
    []
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Crie sua conta corporativa para começar" />

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="name"
            label="Nome completo"
            onChange={handleNameChange}
            placeholder="Seu nome"
            required
            type="text"
            value={name}
          />

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
            minLength={6}
            onChange={handlePasswordChange}
            placeholder="Mínimo 6 caracteres"
            required
            type="password"
            value={password}
          />

          <FormField
            id="confirmPassword"
            label="Confirmar senha"
            minLength={6}
            onChange={handleConfirmPasswordChange}
            placeholder="Repita a senha"
            required
            type="password"
            value={confirmPassword}
          />

          <Button type="submit">Criar conta</Button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Já tem uma conta?{" "}
          <Link
            className="font-medium text-orange-500 transition-colors hover:text-orange-400"
            to="/login"
          >
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
