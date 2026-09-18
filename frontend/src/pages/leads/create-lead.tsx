import { zodResolver } from "@hookform/resolvers/zod";
import { type LeadSource, leadSourceSchema } from "@sales/shared";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppShell from "../../components/app-shell.tsx";
import Button from "../../components/button.tsx";
import FormField from "../../components/form-field.tsx";
import Select from "../../components/select.tsx";
import Textarea from "../../components/textarea.tsx";
import { useToast } from "../../components/toast.tsx";

const createLeadFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  description: z.string().optional(),
  email: z.email("E-mail inválido"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  jobTitle: z.string().optional(),
  responsibleId: z.string().min(1, "Selecione um vendedor responsável"),
  source: z.enum(leadSourceSchema.options, {
    message: "Selecione a origem do lead",
  }),
  whatsapp: z.string().min(1, "Telefone é obrigatório"),
});

type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;

const LEAD_SOURCE_OPTIONS: Array<{ label: string; value: LeadSource }> = [
  { label: "Indicação", value: "referral" },
  { label: "Inbound", value: "inbound" },
  { label: "Outbound", value: "outbound" },
  { label: "Outro", value: "other" },
];

const SELLER_OPTIONS = [
  { id: "seller-1", name: "Rodrigo Ramos" },
  { id: "seller-2", name: "Ana Souza" },
  { id: "seller-3", name: "Carlos Lima" },
];

function CreateLeadPage() {
  const { toast } = useToast();

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
      jobTitle: "",
      responsibleId: "",
      whatsapp: "",
    },
    mode: "onChange",
    resolver: zodResolver(createLeadFormSchema),
  });

  function onSubmit() {
    toast("Lead salvo com sucesso", "success");
    reset();
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
                  label="Nome da Empresa / Condomínio"
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
                  label="Telefone"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
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
              name="jobTitle"
              // biome-ignore lint/performance/noJsxPropsBind: Controller render is the standard RHF pattern
              render={({ field }) => (
                <FormField
                  error={errors.jobTitle?.message}
                  id="jobTitle"
                  label="Cargo"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  placeholder="Ex: Gerente Geral / Síndico"
                  ref={field.ref}
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
                      value={field.value}
                    >
                      <option value="">Atribuir a um vendedor</option>
                      {SELLER_OPTIONS.map((seller) => (
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
                    label="Observações e Histórico Preliminar"
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
            <Button type="submit">Salvar Lead</Button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

export default CreateLeadPage;
