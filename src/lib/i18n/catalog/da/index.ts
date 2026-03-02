import { daAuthMessages } from "./auth"
import { daCatalogMessages } from "./catalog"
import { daDashboardMessages } from "./dashboard"
import { daEmailMessages } from "./email"
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
  ...daDashboardMessages,
  ...daEmailMessages,
  ...daNavMessages,
  ...daPdfMessages,
  ...daRootMessages,
  ...daSetupMessages,
  ...daStatusMessages,
  ...daUiMessages,
  ...daUserMessages,
} as const
