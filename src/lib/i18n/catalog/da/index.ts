import { daAuthMessages } from "./auth"
import { daCatalogMessages } from "./catalog"
import { daContactsMessages } from "./contacts"
import { daDashboardMessages } from "./dashboard"
import { daEmailMessages } from "./email"
import { daInvitationMessages } from "./invitation"
import { daNavMessages } from "./nav"
import { daPdfMessages } from "./pdf"
import { daRootMessages } from "./root"
import { daSetupMessages } from "./setup"
import { daStatusMessages } from "./status"
import { daUiMessages } from "./ui"
import { daUserMessages } from "./user"

export const daCatalog = {
  ...daAuthMessages,
  ...daCatalogMessages,
  ...daContactsMessages,
  ...daDashboardMessages,
  ...daEmailMessages,
  ...daInvitationMessages,
  ...daNavMessages,
  ...daPdfMessages,
  ...daRootMessages,
  ...daSetupMessages,
  ...daStatusMessages,
  ...daUiMessages,
  ...daUserMessages,
} as const
