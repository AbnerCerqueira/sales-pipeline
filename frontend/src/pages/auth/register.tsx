import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@sales/shared";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";
import { useToast } from "../../components/toast.tsx";
import { useRegisterMutation } from "../../hooks/use-auth.ts";

const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormInput = z.infer<typeof registerFormSchema>;

function RegisterPage() {
  const registerMutation = useRegisterMutation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    mode: "onChange",
    resolver: zodResolver(registerFormSchema),
  });

  useEffect(() => {
    if (registerMutation.isError && registerMutation.error) {
      toast(registerMutation.error.message);
    }
  }, [registerMutation.isError, registerMutation.error, toast]);

  useEffect(() => {
    if (registerMutation.isSuccess) {
      toast("Conta criada com sucesso", "success");
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [registerMutation.isSuccess, navigate, toast]);

  function onSubmit(data: RegisterFormInput) {
    const { confirmPassword: _, ...payload } = data;
    registerMutation.mutate(payload);
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Crie sua conta corporativa para começar" />

        <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="name"
            // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
            render={({ field }) => (
              <FormField
                error={errors.name?.message}
                id="name"
                label="Nome completo"
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="Seu nome"
                ref={field.ref}
                required
                type="text"
                value={field.value}
              />
            )}
          />

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
                minLength={6}
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="Mínimo 6 caracteres"
                ref={field.ref}
                required
                type="password"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
            render={({ field }) => (
              <FormField
                error={errors.confirmPassword?.message}
                id="confirmPassword"
                label="Confirmar senha"
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="Repita a senha"
                ref={field.ref}
                required
                type="password"
                value={field.value}
              />
            )}
          />

          <Button
            className="w-full"
            loading={registerMutation.isPending}
            type="submit"
          >
            Criar conta
          </Button>
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
