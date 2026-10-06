import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@sales/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth-layout.tsx";
import BrandHeader from "../../components/brand-header.tsx";
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
import { useAuth } from "../../context/auth.tsx";
import { useLoginMutation } from "../../hooks/use-auth.ts";
import { useErrorToast } from "../../hooks/use-error-toast.ts";

function LoginPage() {
  const loginMutation = useLoginMutation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useErrorToast(loginMutation);

  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onSuccess: ({ token }) => {
        queryClient.clear();
        login(token);
        navigate("/deals", { replace: true });
      },
    });
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <BrandHeader subtitle="Entre na sua conta para continuar" />

        <Form {...form}>
          <form
            className="w-full space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
                      placeholder="Sua senha"
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
              loading={loginMutation.isPending}
              type="submit"
            >
              Entrar no CRM
            </Button>
          </form>
        </Form>

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
