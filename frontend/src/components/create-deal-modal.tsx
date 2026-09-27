import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateDealInput } from "@sales/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useCreateDealMutation } from "../hooks/use-deals.ts";
import { useSellersQuery } from "../hooks/use-sellers.ts";
import {
  type CreateDealFormInput,
  createDealFormSchema,
} from "../lib/deal-form-schema.ts";
import { DEAL_STATUS_OPTIONS } from "../lib/deal-options.ts";
import { nextCurrencyValue, parseCurrency } from "../lib/masks.ts";
import { LeadCombobox } from "./lead-combobox.tsx";
import { SellerCombobox } from "./seller-combobox.tsx";
import { useToast } from "./toast.tsx";
import { Button } from "./ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface CreateDealModalProps {
  onClose: () => void;
}

function CreateDealModal({ onClose }: CreateDealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDealMutation = useCreateDealMutation();
  const sellersQuery = useSellersQuery();

  const form = useForm<CreateDealFormInput>({
    defaultValues: {
      description: "",
      expectedCloseDate: "",
      leadId: "",
      responsibleId: "",
      status: "open",
      title: "",
      value: "",
    },
    mode: "onChange",
    resolver: zodResolver(createDealFormSchema),
  });

  const handleClose = useCallback(() => {
    if (!createDealMutation.isPending) {
      onClose();
    }
  }, [createDealMutation.isPending, onClose]);

  function onSubmit(data: CreateDealFormInput) {
    const input: CreateDealInput = {
      description: data.description || null,
      expectedCloseDate: data.expectedCloseDate || null,
      leadId: data.leadId,
      responsibleId: data.responsibleId || undefined,
      status: data.status,
      title: data.title,
      value: parseCurrency(data.value ?? ""),
    };

    createDealMutation.mutate(input, {
      onError: (error) => {
        toast(error.message);
      },
      onSuccess: () => {
        toast("Negócio criado com sucesso", "success");
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        form.reset();
        onClose();
      },
    });
  }

  return (
    // biome-ignore lint/performance/noJsxPropsBind: needs closure over handleClose to block close while pending
    <Dialog onOpenChange={(open) => !open && handleClose()} open>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Novo negócio</DialogTitle>
          <DialogDescription>
            Vincule o negócio a uma lead e acompanhe a negociação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <h2 className="font-semibold text-[11px] text-zinc-500 uppercase tracking-widest">
                Informações do negócio
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="leadId"
                    // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Lead
                          <span className="ml-0.5 text-orange-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <LeadCombobox
                            emptyLabel="Selecionar lead"
                            // biome-ignore lint/performance/noJsxPropsBind: needs form.setValue for responsible
                            onSelect={(lead) => {
                              form.setValue(
                                "responsibleId",
                                lead.responsible.id
                              );
                            }}
                            onValueChange={field.onChange}
                            placeholder="Buscar lead por nome ou empresa..."
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Título
                        <span className="ml-0.5 text-orange-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Plano anual FitLife Centro"
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
                  name="value"
                  // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground text-sm">
                            R$
                          </span>
                          <Input
                            className="pl-9"
                            inputMode="numeric"
                            placeholder="0,00"
                            type="text"
                            {...field}
                            // biome-ignore lint/performance/noJsxPropsBind: mask needs the input event to format the value before updating form state
                            onChange={(event) => {
                              const isDelete =
                                event.nativeEvent instanceof InputEvent &&
                                (event.nativeEvent.inputType ===
                                  "deleteContentBackward" ||
                                  event.nativeEvent.inputType ===
                                    "deleteContentForward");
                              field.onChange(
                                nextCurrencyValue(
                                  field.value ?? "",
                                  event.target.value,
                                  isDelete
                                )
                              );
                            }}
                            value={field.value ?? ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedCloseDate"
                  // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de fechamento prevista</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="dd/mm/aaaa"
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEAL_STATUS_OPTIONS.map((option) => (
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
                      <FormLabel>Vendedor responsável</FormLabel>
                      <FormControl>
                        <SellerCombobox
                          emptyLabel="Padrão: vendedor da lead"
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
                            placeholder="Ex: Cliente pediu proposta com desconto para pagamento à vista..."
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
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 px-6">
              <Button onClick={handleClose} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button loading={createDealMutation.isPending} type="submit">
                Salvar negócio
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDealModal;
