import type {
  ComplianceError,
  CountryProfile,
  ValidationInput,
} from "./country-profile"

function hasTaxIds(values: ValidationInput["sellerTaxIds"]): boolean {
  return values.some((value) => value.value.trim().length > 0)
}

export function validateDocument(
  profile: CountryProfile,
  input: ValidationInput
): ComplianceError[] {
  const issues: ComplianceError[] = []

  if (input.taxRate < 0 || input.taxRate > 100) {
    issues.push({
      code: "INVALID_TAX_RATE",
      severity: "error",
      message: "Tax rate must be between 0 and 100",
      fieldPath: "taxRate",
    })
  }

  if (profile.requiresSellerTaxId && !hasTaxIds(input.sellerTaxIds)) {
    issues.push({
      code: "MISSING_SELLER_TAX_ID",
      severity: "error",
      message: "Seller tax identifier is required for this country profile",
      fieldPath: "sellerTaxIds",
      hint: "Add VAT/CVR/EIN to organization settings before sending",
    })
  }

  return issues
}
