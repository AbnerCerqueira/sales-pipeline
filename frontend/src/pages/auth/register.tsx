import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@sales/shared";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
import { useToast } from "../../components/toast.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form.tsx";
import { Input } from "../../components/ui/input.tsx";
import { useRegisterMutation } from "../../hooks/use-auth.ts";
import { useErrorToast } from "../../hooks/use-error-toast.ts";

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

  useErrorToast(registerMutation);

  const form = useForm<RegisterFormInput>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      name: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(registerFormSchema),
  });

  function onSubmit(data: RegisterFormInput) {
    const { confirmPassword: _, ...payload } = data;
    registerMutation.mutate(payload, {
      onSuccess: () => {
        toast("Conta criada com sucesso", "success");
        navigate("/login", { replace: true });
      },
    });
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Crie sua conta para acessar o sistema" />

        <Form {...form}>
          <form
            className="w-full space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome completo
                    <span className="ml-0.5 text-orange-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome"
                      required
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    E-mail profissional
                    <span className="ml-0.5 text-orange-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="voce@empresa.com.br"
                      required
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Senha
                    <span className="ml-0.5 text-orange-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      required
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirmar senha
                    <span className="ml-0.5 text-orange-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Repita a senha"
                      required
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
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
        </Form>

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
