import { zodResolver } from "@hookform/resolvers/zod";
import { createLeadSchema, leadSourceSchema } from "@sales/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateLeadMutation } from "../hooks/use-leads.ts";
import { useSellersQuery } from "../hooks/use-sellers.ts";
import { LEAD_SOURCE_OPTIONS } from "../lib/lead-options.ts";
import { formatWhatsApp } from "../lib/masks.ts";
import { SellerCombobox } from "./seller-combobox.tsx";
import { useToast } from "./toast.tsx";
import { Button } from "./ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form.tsx";
import { Input } from "./ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";
import { Textarea } from "./ui/textarea.tsx";

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

  const form = useForm<CreateLeadFormInput>({
    defaultValues: {
      companyName: "",
      description: "",
      email: "",
      fullName: "",
      responsibleId: "",
      source: undefined,
      whatsapp: "",
    },
    mode: "onChange",
    resolver: zodResolver(createLeadFormSchema),
  });

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
        form.reset();
        onClose();
      },
    });
  }

  return (
    // biome-ignore lint/performance/noJsxPropsBind: needs closure over handleClose to block close while pending
    <Dialog onOpenChange={(open) => !open && handleClose()} open>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha os dados do potencial cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <h2 className="font-semibold text-[11px] text-zinc-500 uppercase tracking-widest">
              Informações do contato
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome Completo
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Roberto Carlos da Silva"
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
                name="companyName"
                // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome da Empresa
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Academia FitLife Centro"
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
                      E-mail
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="contato@empresa.com.br"
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
                name="whatsapp"
                // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      WhatsApp
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="(11) 99999-8888"
                        required
                        type="tel"
                        {...field}
                        // biome-ignore lint/performance/noJsxPropsBind: mask needs the input event to format the value before updating form state
                        onChange={(event) =>
                          field.onChange(formatWhatsApp(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Origem do Lead
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleId"
                // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vendedor Responsável
                      <span className="ml-0.5 text-orange-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <SellerCombobox
                        emptyLabel="Atribuir a um vendedor"
                        isPending={sellersQuery.isPending}
                        onValueChange={field.onChange}
                        placeholder="Buscar vendedor..."
                        sellers={sellersQuery.data}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Cliente demonstrou interesse inicial em esteiras profissionais..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3 border-zinc-800/60 border-t pt-5">
              <Button onClick={handleClose} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button loading={createLeadMutation.isPending} type="submit">
                Salvar Lead
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateLeadModal;
