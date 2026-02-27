import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../../trpc/client"
import {
  formatCurrency as formatCurrencyIntl,
  formatDate as formatDateIntl,
} from "../../../lib/i18n/format"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog"
import { Plus, Trash2, FileText } from "lucide-react"
import { useI18n } from "../../../lib/i18n/react"

export const Route = createFileRoute("/_app/quotes/")({
  component: QuotesListPage,
})

type Quote = {
  id: string
  number: string
  status: string
  issueDate: string
  expiryDate: string
  total: number
  currency: string
  contact: { name: string }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  expired: { label: "Expired", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
}

function formatCurrency(amount: number, currency: string) {
  return formatCurrencyIntl(amount, currency)
}

function formatDate(dateStr: string, locale?: string) {
  return formatDateIntl(dateStr, locale, undefined, { month: "short" })
}

function StatusBadge({ status, tm }: { status: string; tm: (messages: { en: string } & Record<string, string | undefined>) => string }) {
  const config = statusConfig[status] ?? statusConfig.draft
  return (
    <Badge variant="outline" className={config.className}>
      {tm({
        en: config.label,
        da:
          config.label === "Draft"
            ? "Kladde"
            : config.label === "Sent"
              ? "Sendt"
              : config.label === "Accepted"
                ? "Accepteret"
                : config.label === "Rejected"
                  ? "Afvist"
                  : "Udløbet",
      })}
    </Badge>
  )
}

function QuotesListPage() {
  const { tm, locale } = useI18n()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadQuotes() {
    try {
      const data = await trpc.quotes.list.query()
      setQuotes(data as unknown as Quote[])
    } catch {
      // Auth or org errors handled by layout
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await trpc.quotes.delete.mutate({ id })
      setQuotes((prev) => prev.filter((q) => q.id !== id))
    } catch {
      // Silently fail
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{tm({ en: "Quotes", da: "Tilbud" })}</h1>
        </div>
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{tm({ en: "Quotes", da: "Tilbud" })}</h1>
        <Button asChild>
          <Link to="/quotes/new">
            <Plus />
            {tm({ en: "New Quote", da: "Nyt tilbud" })}
          </Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">{tm({ en: "No quotes yet", da: "Ingen tilbud endnu" })}</h2>
          <p className="text-muted-foreground mb-4">
            {tm({
              en: "Create your first quote to start sending proposals to your clients.",
              da: "Opret dit første tilbud for at sende forslag til dine kunder.",
            })}
          </p>
          <Button asChild>
            <Link to="/quotes/new">
              <Plus />
              {tm({ en: "Create Quote", da: "Opret tilbud" })}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tm({ en: "Number", da: "Nummer" })}</TableHead>
                <TableHead>{tm({ en: "Contact", da: "Kontakt" })}</TableHead>
                <TableHead>{tm({ en: "Issue Date", da: "Udstedelsesdato" })}</TableHead>
                <TableHead>{tm({ en: "Expiry Date", da: "Udløbsdato" })}</TableHead>
                <TableHead className="text-right">{tm({ en: "Total", da: "Total" })}</TableHead>
                <TableHead>{tm({ en: "Status", da: "Status" })}</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/quotes/$quoteId",
                      params: { quoteId: quote.id },
                      search: { emailWarning: undefined },
                    })
                  }
                >
                  <TableCell className="font-medium">{quote.number}</TableCell>
                  <TableCell>{quote.contact.name}</TableCell>
                  <TableCell>{formatDate(quote.issueDate, locale)}</TableCell>
                  <TableCell>{formatDate(quote.expiryDate, locale)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(quote.total, quote.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={quote.status} tm={tm} />
                  </TableCell>
                  <TableCell>
                    {quote.status === "draft" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled={deleting === quote.id}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{tm({ en: "Delete quote", da: "Slet tilbud" })}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {tm({
                                en: `Are you sure you want to delete quote ${quote.number}? This action cannot be undone.`,
                                da: `Er du sikker på, at du vil slette tilbud ${quote.number}? Denne handling kan ikke fortrydes.`,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tm({ en: "Cancel", da: "Annuller" })}</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(quote.id)}
                            >
                              {tm({ en: "Delete", da: "Slet" })}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
