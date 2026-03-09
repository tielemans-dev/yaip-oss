import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access"

const statement = {
  ...defaultStatements,
  invoice: ["create", "read", "update", "delete", "send"],
  quote: ["create", "read", "update", "delete", "send"],
  contact: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
} as const

export const ac = createAccessControl(statement)

export const admin = ac.newRole({
  ...adminAc.statements,
  invoice: ["create", "read", "update", "delete", "send"],
  quote: ["create", "read", "update", "delete", "send"],
  contact: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
})

export const member = ac.newRole({
  ...memberAc.statements,
  invoice: ["create", "read", "update", "send"],
  quote: ["create", "read", "update", "send"],
  contact: ["create", "read", "update"],
  settings: ["read"],
})

export const accountant = ac.newRole({
  invoice: ["read"],
  quote: ["read"],
  contact: ["read"],
  settings: ["read"],
})
