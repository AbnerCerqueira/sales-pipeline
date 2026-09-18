import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLeadSchema,
  type LeadSource,
  leadSourceSchema,
} from "@sales/shared";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppShell from "../../components/app-shell.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";
import Select from "../../components/select.tsx";
import Textarea from "../../components/textarea.tsx";
import { useToast } from "../../components/toast.tsx";
import { useCreateLeadMutation } from "../../hooks/use-leads.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { formatWhatsApp } from "../../lib/masks.ts";

const createLeadFormSchema = createLeadSchema.extend({
  responsibleId: z.uuid("Selecione um vendedor responsável"),
  source: z.enum(leadSourceSchema.options, {
    message: "Selecione a origem do lead",
  }),
});

type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;

const LEAD_SOURCE_OPTIONS: Array<{ label: string; value: LeadSource }> = [
  { label: "Indicação", value: "referral" },
  { label: "Inbound", value: "inbound" },
  { label: "Outbound", value: "outbound" },
  { label: "Outro", value: "other" },
];

function CreateLeadPage() {
  const { toast } = useToast();
  const createLeadMutation = useCreateLeadMutation();
  const sellersQuery = useSellersQuery();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLeadFormInput>({
    defaultValues: {
      companyName: "",
      description: "",
      email: "",
      fullName: "",
      location: "",
      responsibleId: "",
      whatsapp: "",
    },
    mode: "onChange",
    resolver: zodResolver(createLeadFormSchema),
  });

  useEffect(() => {
    if (sellersQuery.isError && sellersQuery.error) {
      toast(sellersQuery.error.message);
    }
  }, [sellersQuery.isError, sellersQuery.error, toast]);

  useEffect(() => {
    if (createLeadMutation.isError && createLeadMutation.error) {
      toast(createLeadMutation.error.message);
    }
  }, [createLeadMutation.isError, createLeadMutation.error, toast]);

  useEffect(() => {
    if (createLeadMutation.isSuccess) {
      toast("Lead salvo com sucesso", "success");
      reset();
    }
  }, [createLeadMutation.isSuccess, reset, toast]);

  function onSubmit(data: CreateLeadFormInput) {
    createLeadMutation.mutate(data);
  }

  function handleCancel() {
    reset();
  }

  return (
    <AppShell>
      <header className="border-zinc-800/60 border-b bg-black px-6 py-6 md:px-8">
        <h1 className="font-bold text-2xl text-white tracking-tight">
          Criar Novo Lead
        </h1>
      </header>

      <main className="px-4 py-8 md:px-8">
        <form
          className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <h2 className="font-semibold text-lg text-white">
            Informações Gerais do Contato
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <Controller
              control={control}
              name="fullName"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.fullName?.message}
                  id="fullName"
                  label="Nome Completo"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  placeholder="Ex: Roberto Carlos da Silva"
                  ref={field.ref}
                  required
                  type="text"
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="companyName"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.companyName?.message}
                  id="companyName"
                  label="Nome da Empresa"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  placeholder="Ex: Academia FitLife Centro"
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
                  label="E-mail"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  placeholder="contato@empresa.com.br"
                  ref={field.ref}
                  required
                  type="email"
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="whatsapp"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.whatsapp?.message}
                  id="whatsapp"
                  inputMode="numeric"
                  label="WhatsApp"
                  onBlur={field.onBlur}
                  // biome-ignore lint/performance/noJsxPropsBind: mask needs the input event to format the value before updating form state
                  onChange={(event) =>
                    field.onChange(formatWhatsApp(event.target.value))
                  }
                  placeholder="(11) 99999-8888"
                  ref={field.ref}
                  required
                  type="tel"
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="location"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.location?.message}
                  id="location"
                  label="Localização"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  placeholder="Ex: São Paulo, SP — Centro"
                  ref={field.ref}
                  required
                  type="text"
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="source"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.source?.message}
                  id="source"
                  label="Origem do Lead"
                  required
                >
                  <Select
                    error={errors.source?.message}
                    id="source"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Selecione a origem</option>
                    {LEAD_SOURCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            />

            <div className="md:col-span-2">
              <Controller
                control={control}
                name="responsibleId"
                // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
                render={({ field }) => (
                  <FormField
                    error={errors.responsibleId?.message}
                    id="responsibleId"
                    label="Vendedor Responsável"
                    required
                  >
                    <Select
                      error={errors.responsibleId?.message}
                      id="responsibleId"
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <option value="">Atribuir a um vendedor</option>
                      {sellersQuery.isPending ? (
                        <option disabled value="">
                          Carregando vendedores...
                        </option>
                      ) : null}
                      {sellersQuery.data?.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Controller
                control={control}
                name="description"
                // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
                render={({ field }) => (
                  <FormField
                    error={errors.description?.message}
                    id="description"
                    label="Observações"
                  >
                    <Textarea
                      error={errors.description?.message}
                      id="description"
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder="Ex: Cliente demonstrou interesse inicial em esteiras profissionais..."
                      value={field.value}
                    />
                  </FormField>
                )}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              // biome-ignore lint/performance/noJsxPropsBind: handler resets form state defined in this component
              onClick={handleCancel}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button loading={createLeadMutation.isPending} type="submit">
              Salvar Lead
            </Button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

export default CreateLeadPage;
