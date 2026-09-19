import { zodResolver } from "@hookform/resolvers/zod";
import { createLeadSchema, leadSourceSchema } from "@sales/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useErrorToast } from "../hooks/use-error-toast.ts";
import { useCreateLeadMutation } from "../hooks/use-leads.ts";
import { useSellersQuery } from "../hooks/use-sellers.ts";
import { LEAD_SOURCE_OPTIONS } from "../lib/lead-options.ts";
import { formatWhatsApp } from "../lib/masks.ts";
import Button from "./button.tsx";
import FormField from "./form-field.tsx";
import Modal from "./modal.tsx";
import Select from "./select.tsx";
import Textarea from "./textarea.tsx";
import { useToast } from "./toast.tsx";

const createLeadFormSchema = createLeadSchema.extend({
  responsibleId: z.uuid("Selecione um vendedor responsável"),
  source: z.enum(leadSourceSchema.options, {
    message: "Selecione a origem do lead",
  }),
});

type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;

interface CreateLeadModalProps {
  onClose: () => void;
}

function CreateLeadModal({ onClose }: CreateLeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      responsibleId: "",
      whatsapp: "",
    },
    mode: "onChange",
    resolver: zodResolver(createLeadFormSchema),
  });

  useErrorToast(sellersQuery);

  const handleClose = useCallback(() => {
    if (!createLeadMutation.isPending) {
      onClose();
    }
  }, [createLeadMutation.isPending, onClose]);

  function onSubmit(data: CreateLeadFormInput) {
    createLeadMutation.mutate(data, {
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: () => {
        toast("Lead salvo com sucesso", "success");
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        reset();
        onClose();
      },
    });
  }

  return (
    <Modal onClose={handleClose} title="Novo Lead">
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
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
            // biome-ignore lint/performance/noJsxPropsBind: mask needs the input event to format the value before updating form state
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
                    value={field.value ?? ""}
                  />
                </FormField>
              )}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button onClick={handleClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button loading={createLeadMutation.isPending} type="submit">
            Salvar Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateLeadModal;
