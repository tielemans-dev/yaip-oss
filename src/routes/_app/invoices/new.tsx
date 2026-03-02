import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import { applyCatalogItemToLineItem, type CatalogItemOption } from "../../../lib/catalog"
import { formatCurrency as formatCurrencyIntl } from "../../../lib/i18n/format"
import { useOrgCurrency } from "../../../hooks/use-org-currency"
import { LocalizedDateField } from "../../../components/localized-date-field"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Plus, Sparkles, Trash2 } from "lucide-react"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/invoices/new")({
  component: NewInvoicePage,
})

type Contact = { id: string; name: string }

type LineItem = {
  description: string
  quantity: number
  unitPrice: number
  catalogItemId?: string
}

type RuntimeCapabilities = {
  aiInvoiceDraft: {
    enabled: boolean
    byok: boolean
  }
}

function NewInvoicePage() {
  const { tm, locale } = useI18n()
  const currency = useOrgCurrency()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState(0)
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, catalogItemId: undefined },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([])
  const [aiCapabilities, setAiCapabilities] = useState<RuntimeCapabilities | null>(null)
  const [loadingAiCapabilities, setLoadingAiCapabilities] = useState(true)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiInfo, setAiInfo] = useState<string | null>(null)

  useEffect(() => {
    trpc.contacts.list
      .query()
      .then((data) => setContacts(data as Contact[]))
      .catch(() => {})
      .finally(() => setLoadingContacts(false))
  }, [])

  useEffect(() => {
    trpc.catalog.list
      .query()
      .then((data) => setCatalogItems(data as CatalogItemOption[]))
      .catch(() => {})
      .finally(() => setLoadingCatalog(false))
  }, [])

  useEffect(() => {
    trpc.runtime.capabilities
      .query()
      .then((data) => setAiCapabilities(data as RuntimeCapabilities))
      .catch(() => {})
      .finally(() => setLoadingAiCapabilities(false))
  }, [])

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, catalogItemId: undefined },
    ])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function applyCatalogItem(index: number, catalogItemId: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        return applyCatalogItemToLineItem(item, catalogItemId, catalogItems)
      })
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxAmount = subtotal * taxRate / 100
  const total = subtotal + taxAmount

  async function handleGenerateInvoiceDraftFromAi() {
    setAiError(null)
    setAiInfo(null)

    const prompt = aiPrompt.trim()
    if (!prompt) {
      setAiError(tm({ en: "Please describe the invoice first.", da: "Beskriv først fakturaen." }))
      return
    }

    setAiGenerating(true)
    try {
      const result = await trpc.ai.generateInvoiceDraft.mutate({
        prompt,
        mode: "byok",
      })
      const draft = result.draft

      if (draft.dueDate) {
        setDueDate(draft.dueDate)
      }
      if (draft.notes) {
        setNotes(draft.notes)
      }
      if (typeof draft.taxRate === "number") {
        setTaxRate(draft.taxRate)
      }
      if (draft.items.length > 0) {
        setItems(
          draft.items.map((item) => ({
            ...applyCatalogItemToLineItem(
              {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                catalogItemId: undefined,
              },
              item.catalogItemId || "",
              catalogItems
            ),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            catalogItemId: item.catalogItemId,
          }))
        )
      }

      if (draft.contactId && contacts.some((contact) => contact.id === draft.contactId)) {
        setContactId(draft.contactId)
      } else if (draft.contactName) {
        const matchedContact = contacts.find(
          (contact) => contact.name.trim().toLowerCase() === draft.contactName?.trim().toLowerCase()
        )
        if (matchedContact) {
          setContactId(matchedContact.id)
        } else {
          setAiInfo(
            tm({
              en: `Draft generated. Contact \"${draft.contactName}\" was not matched automatically.`,
              da: `Kladde genereret. Kontakt \"${draft.contactName}\" blev ikke matchet automatisk.`,
            })
          )
        }
      }
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to generate draft from AI.", da: "Kunne ikke generere kladde med AI." })
      )
    } finally {
      setAiGenerating(false)
    }
  }

  async function handleSubmit(sendImmediately: boolean) {
    setError(null)

    if (!contactId) {
      setError(tm({ en: "Please select a contact", da: "Vælg venligst en kontakt" }))
      return
    }
    if (!dueDate) {
      setError(tm({ en: "Please set a due date", da: "Angiv venligst en forfaldsdato" }))
      return
    }
    if (items.some((item) => !item.description.trim())) {
      setError(
        tm({
          en: "All line items must have a description",
          da: "Alle linjer skal have en beskrivelse",
        })
      )
      return
    }

    setSaving(true)
    try {
      const invoice = await trpc.invoices.create.mutate({
        contactId,
        dueDate,
        taxRate,
        notes: notes || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })

      let emailWarning: string | undefined
      if (sendImmediately) {
        const result = await trpc.invoices.send.mutate({ id: invoice.id })
        if (result.emailSkipReason) emailWarning = result.emailSkipReason
      }

      navigate({
        to: "/invoices/$invoiceId",
        params: { invoiceId: invoice.id },
        search: { emailWarning },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to create invoice", da: "Kunne ikke oprette faktura" })
      )
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{tm({ en: "New Invoice", da: "Ny faktura" })}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="aiPrompt">{tm({ en: "Draft with AI", da: "Kladde med AI" })}</Label>
            <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              rows={4}
              placeholder={tm({
                en: "Example: Create an invoice for Acme for 8 hours of design at 1200 DKK/hour, due in 14 days.",
                da: "Eksempel: Opret en faktura til Acme for 8 timers design á 1200 DKK/time, forfalder om 14 dage.",
              })}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateInvoiceDraftFromAi}
                disabled={
                  aiGenerating ||
                  loadingAiCapabilities ||
                  !aiCapabilities?.aiInvoiceDraft.enabled ||
                  !aiCapabilities?.aiInvoiceDraft.byok
                }
              >
                <Sparkles className="size-4" />
                {aiGenerating
                  ? tm({ en: "Generating...", da: "Genererer..." })
                  : tm({ en: "Generate Draft", da: "Generer kladde" })}
              </Button>
              {loadingAiCapabilities && (
                <p className="text-xs text-muted-foreground">
                  {tm({ en: "Checking AI availability...", da: "Tjekker AI-tilgængelighed..." })}
                </p>
              )}
              {!loadingAiCapabilities &&
                (!aiCapabilities?.aiInvoiceDraft.enabled || !aiCapabilities?.aiInvoiceDraft.byok) && (
                  <p className="text-xs text-muted-foreground">
                    {tm({
                      en: "AI BYOK is currently disabled for this distribution.",
                      da: "AI BYOK er i øjeblikket deaktiveret for denne distribution.",
                    })}
                  </p>
                )}
            </div>
            {aiError && <p className="text-sm text-destructive">{aiError}</p>}
            {aiInfo && <p className="text-sm text-muted-foreground">{aiInfo}</p>}
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
              <Label>{tm({ en: "Contact", da: "Kontakt" })} *</Label>
              {loadingContacts ? (
                <p className="text-sm text-muted-foreground py-2">
                  {tm({ en: "Loading contacts...", da: "Indlæser kontakter..." })}
                </p>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {tm({
                    en: "No contacts found. Create one first.",
                    da: "Ingen kontakter fundet. Opret en kontakt først.",
                  })}
                </p>
              ) : (
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={tm({ en: "Select a contact", da: "Vælg en kontakt" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">{tm({ en: "Due Date", da: "Forfaldsdato" })} *</Label>
              <LocalizedDateField
                id="dueDate"
                value={dueDate}
                onChange={setDueDate}
                locale={locale}
                placeholder={tm({ en: "Select a date", da: "Vælg en dato" })}
                clearLabel={tm({ en: "Clear", da: "Ryd" })}
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="grid gap-3">
            <Label>{tm({ en: "Line Items", da: "Linjer" })}</Label>
            <div className="rounded-md border">
              <div className="grid grid-cols-[180px_1fr_80px_100px_100px_40px] gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
                <span>{tm({ en: "Item", da: "Vare" })}</span>
                <span>{tm({ en: "Description", da: "Beskrivelse" })}</span>
                <span>{tm({ en: "Qty", da: "Antal" })}</span>
                <span>{tm({ en: "Unit Price", da: "Enhedspris" })}</span>
                <span>{tm({ en: "Total", da: "Total" })}</span>
                <span />
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[180px_1fr_80px_100px_100px_40px] gap-2 p-3 border-b last:border-0 items-center"
                >
                  <Select
                    value={item.catalogItemId}
                    onValueChange={(value) => applyCatalogItem(index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingCatalog
                            ? tm({ en: "Loading items...", da: "Indlæser varer..." })
                            : catalogItems.length > 0
                              ? tm({ en: "Select item", da: "Vælg vare" })
                              : tm({ en: "No saved items", da: "Ingen gemte varer" })
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogItems.map((catalogItem) => (
                        <SelectItem key={catalogItem.id} value={catalogItem.id}>
                          {catalogItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={tm({ en: "Description", da: "Beskrivelse" })}
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="text-sm text-right pr-2">
                    {formatCurrencyIntl(item.quantity * item.unitPrice, currency, locale)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
              <Plus className="size-4" />
              {tm({ en: "Add Item", da: "Tilføj vare" })}
            </Button>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-64 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tm({ en: "Subtotal", da: "Subtotal" })}</span>
                <span>{formatCurrencyIntl(subtotal, currency, locale)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">{tm({ en: "Tax", da: "Moms" })}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate || ""}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 h-7 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                  <span className="ml-auto">{formatCurrencyIntl(taxAmount, currency, locale)}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{tm({ en: "Total", da: "Total" })}</span>
                <span>{formatCurrencyIntl(total, currency, locale)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">{tm({ en: "Notes", da: "Noter" })}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tm({
                en: "Payment terms, thank you note, etc.",
                da: "Betalingsbetingelser, takkenote osv.",
              })}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/invoices" })}
          >
            {tm({ en: "Cancel", da: "Annuller" })}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => handleSubmit(false)}
          >
            {saving
              ? tm({ en: "Saving...", da: "Gemmer..." })
              : tm({ en: "Save as Draft", da: "Gem som kladde" })}
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(true)}
          >
            {saving
              ? tm({ en: "Saving...", da: "Gemmer..." })
              : tm({ en: "Save & Send", da: "Gem og send" })}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
