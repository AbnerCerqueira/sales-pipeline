import { zodResolver } from "@hookform/resolvers/zod";
import type { DealDTO } from "@sales/shared";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useUpdateDealMutation } from "../hooks/use-deals.ts";
import { useSellersQuery } from "../hooks/use-sellers.ts";
import {
  type UpdateDealFormInput,
  updateDealFormSchema,
} from "../lib/deal-form-schema.ts";
import { DEAL_STATUS_OPTIONS } from "../lib/deal-options.ts";
import {
  formatCurrencyInput,
  nextCurrencyValue,
  parseCurrency,
} from "../lib/masks.ts";
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

interface UpdateDealModalProps {
  deal: DealDTO;
  onClose: () => void;
}

function UpdateDealModal({ deal, onClose }: UpdateDealModalProps) {
  const { toast } = useToast();
  const updateDealMutation = useUpdateDealMutation();
  const sellersQuery = useSellersQuery();

  const form = useForm<UpdateDealFormInput>({
    defaultValues: {
      description: deal.description ?? "",
      expectedCloseDate: deal.expectedCloseDate?.slice(0, 10) ?? "",
      responsibleId: deal.responsible.id,
      status: deal.status,
      title: deal.title,
      value: formatCurrencyInput(deal.value),
    },
    mode: "onChange",
    resolver: zodResolver(updateDealFormSchema),
  });

  const handleClose = useCallback(() => {
    if (!updateDealMutation.isPending) {
      onClose();
    }
  }, [onClose, updateDealMutation.isPending]);

  function onSubmit(data: UpdateDealFormInput) {
    const value = parseCurrency(data.value ?? "");

    updateDealMutation.mutate(
      {
        data: {
          description: data.description || null,
          expectedCloseDate: data.expectedCloseDate || null,
          responsibleId: data.responsibleId,
          status: data.status,
          title: data.title,
          value,
        },
        id: deal.id,
      },
      {
        // Erro já é tostado pelo onError do hook (que também cobre o drop no kanban).
        onSuccess: () => {
          toast("Negócio atualizado com sucesso", "success");
          onClose();
        },
      }
    );
  }

  return (
    // biome-ignore lint/performance/noJsxPropsBind: needs closure over handleClose to block close while pending
    <Dialog onOpenChange={(open) => !open && handleClose()} open>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Editar negócio</DialogTitle>
          <DialogDescription>
            {deal.lead.companyName} — responsável atual: {deal.responsible.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    // biome-ignore lint/performance/noJsxPropsBind: FormField render is the standard RHF pattern
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormLabel>Fechamento previsto em</FormLabel>
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
                          emptyLabel="Selecione o vendedor"
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
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalhes da negociação..."
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
              <Button
                disabled={updateDealMutation.isPending}
                onClick={handleClose}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button loading={updateDealMutation.isPending} type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateDealModal;
