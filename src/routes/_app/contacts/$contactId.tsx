import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/contacts/$contactId")({
  component: EditContactPage,
})

type ContactData = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  taxId: string | null
  notes: string | null
}

function EditContactPage() {
  const { tm } = useI18n()
  const { contactId } = Route.useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trpc.contacts.get
      .query({ id: contactId })
      .then((data) => setContact(data as ContactData))
      .catch(() => setError(tm({ en: "Contact not found", da: "Kontakt blev ikke fundet" })))
      .finally(() => setLoading(false))
  }, [contactId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const form = new FormData(e.currentTarget)

    try {
      await trpc.contacts.update.mutate({
        id: contactId,
        name: form.get("name") as string,
        email: (form.get("email") as string) || "",
        phone: (form.get("phone") as string) || undefined,
        company: (form.get("company") as string) || undefined,
        address: (form.get("address") as string) || undefined,
        city: (form.get("city") as string) || undefined,
        state: (form.get("state") as string) || undefined,
        zip: (form.get("zip") as string) || undefined,
        country: (form.get("country") as string) || undefined,
        taxId: (form.get("taxId") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      })
      navigate({ to: "/contacts" })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to update contact", da: "Kunne ikke opdatere kontakt" })
      )
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          {error ?? tm({ en: "Contact not found", da: "Kontakt blev ikke fundet" })}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/contacts" })}
        >
          {tm({ en: "Back to Contacts", da: "Tilbage til kontakter" })}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{tm({ en: "Edit Contact", da: "Rediger kontakt" })}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">{tm({ en: "Name", da: "Navn" })} *</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={120}
                defaultValue={contact.name}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{tm({ en: "Email", da: "E-mail" })}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  maxLength={254}
                  defaultValue={contact.email ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{tm({ en: "Phone", da: "Telefon" })}</Label>
                <Input
                  id="phone"
                  name="phone"
                  maxLength={40}
                  pattern="^\+?[0-9()\-\s.]{6,20}$"
                  title={tm({ en: "Enter a valid phone number", da: "Indtast et gyldigt telefonnummer" })}
                  defaultValue={contact.phone ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">{tm({ en: "Company", da: "Virksomhed" })}</Label>
              <Input
                id="company"
                name="company"
                maxLength={120}
                defaultValue={contact.company ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">{tm({ en: "Address", da: "Adresse" })}</Label>
              <Input
                id="address"
                name="address"
                maxLength={240}
                defaultValue={contact.address ?? ""}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">{tm({ en: "City", da: "By" })}</Label>
                <Input
                  id="city"
                  name="city"
                  maxLength={120}
                  defaultValue={contact.city ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">{tm({ en: "State", da: "Region" })}</Label>
                <Input
                  id="state"
                  name="state"
                  maxLength={120}
                  defaultValue={contact.state ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">{tm({ en: "ZIP", da: "Postnr." })}</Label>
                <Input
                  id="zip"
                  name="zip"
                  maxLength={20}
                  defaultValue={contact.zip ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">{tm({ en: "Country", da: "Land" })}</Label>
                <Input
                  id="country"
                  name="country"
                  maxLength={80}
                  defaultValue={contact.country ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taxId">{tm({ en: "Tax ID", da: "CVR/VAT-nummer" })}</Label>
              <Input
                id="taxId"
                name="taxId"
                maxLength={40}
                defaultValue={contact.taxId ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{tm({ en: "Notes", da: "Noter" })}</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={5000}
                defaultValue={contact.notes ?? ""}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/contacts" })}
            >
              {tm({ en: "Cancel", da: "Annuller" })}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? tm({ en: "Saving...", da: "Gemmer..." })
                : tm({ en: "Save Changes", da: "Gem ændringer" })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
