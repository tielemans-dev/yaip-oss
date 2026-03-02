import { daAuthMessages } from "./auth"
import { daBillingMessages } from "./billing"
import { daCatalogMessages } from "./catalog"
import { daContactsMessages } from "./contacts"
import { daDashboardMessages } from "./dashboard"
import { daEmailMessages } from "./email"
import { daInvoicesMessages } from "./invoices"
import { daInvitationMessages } from "./invitation"
import { daNavMessages } from "./nav"
import { daPdfMessages } from "./pdf"
import { daQuotesMessages } from "./quotes"
import { daRootMessages } from "./root"
import { daSetupMessages } from "./setup"
import { daStatusMessages } from "./status"
import { daUiMessages } from "./ui"
import { daUserMessages } from "./user"

export const daCatalog = {
  ...daAuthMessages,
  ...daBillingMessages,
  ...daCatalogMessages,
  ...daContactsMessages,
  ...daDashboardMessages,
  ...daEmailMessages,
  ...daInvoicesMessages,
  ...daInvitationMessages,
  ...daNavMessages,
  ...daPdfMessages,
  ...daQuotesMessages,
  ...daRootMessages,
  ...daSetupMessages,
  ...daStatusMessages,
  ...daUiMessages,
  ...daUserMessages,
} as const
