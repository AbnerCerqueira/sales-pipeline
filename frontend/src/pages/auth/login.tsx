import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@sales/shared";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";
import { useToast } from "../../components/toast.tsx";
import { useLoginMutation } from "../../hooks/use-auth.ts";

function LoginPage() {
  const loginMutation = useLoginMutation();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (loginMutation.isError && loginMutation.error) {
      toast(loginMutation.error.message);
    }
  }, [loginMutation.isError, loginMutation.error, toast]);

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data);
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Entre na sua conta para continuar" />

        <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="email"
            // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
            render={({ field }) => (
              <FormField
                error={errors.email?.message}
                id="email"
                label="E-mail profissional"
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="voce@empresa.com.br"
                ref={field.ref}
                required
                type="email"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
            render={({ field }) => (
              <FormField
                error={errors.password?.message}
                id="password"
                label="Senha"
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="Sua senha"
                ref={field.ref}
                required
                type="password"
                value={field.value}
              />
            )}
          />

          <Button loading={loginMutation.isPending} type="submit">
            Entrar no CRM
          </Button>
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
