import type {
  ComputedLine,
  CountryProfile,
  TaxComputationInput,
  TaxComputationOutput,
} from "./country-profile"

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function lineGrossFromInput(quantity: number, unitPrice: number): number {
  return round2(quantity * unitPrice)
}

export function computeDocumentTotals(
  _profile: CountryProfile,
  input: TaxComputationInput
): TaxComputationOutput {
  const rate = input.taxRate / 100

  let subtotalNet = 0
  let totalTax = 0
  let totalGross = 0
  const lines: ComputedLine[] = []

  for (const item of input.items) {
    const lineGrossInput = lineGrossFromInput(item.quantity, item.unitPrice)

    if (input.pricesIncludeTax) {
      const lineNet = round2(lineGrossInput / (1 + rate))
      const lineTax = round2(lineGrossInput - lineNet)
      const unitPriceNet = round2(item.quantity > 0 ? lineNet / item.quantity : 0)
      const unitPriceGross = round2(item.quantity > 0 ? lineGrossInput / item.quantity : 0)
      subtotalNet += lineNet
      totalTax += lineTax
      totalGross += lineGrossInput
      lines.push({
        description: item.description,
        quantity: item.quantity,
        unitPriceNet,
        unitPriceGross,
        lineNet,
        lineTax,
        lineGross: lineGrossInput,
        taxRate: input.taxRate,
      })
      continue
    }

    const lineNet = lineGrossInput
    const lineTax = round2(lineNet * rate)
    const lineGross = round2(lineNet + lineTax)
    const unitPriceNet = round2(item.quantity > 0 ? lineNet / item.quantity : 0)
    const unitPriceGross = round2(item.quantity > 0 ? lineGross / item.quantity : 0)
    subtotalNet += lineNet
    totalTax += lineTax
    totalGross += lineGross
    lines.push({
      description: item.description,
      quantity: item.quantity,
      unitPriceNet,
      unitPriceGross,
      lineNet,
      lineTax,
      lineGross,
      taxRate: input.taxRate,
    })
  }

  return {
    subtotalNet: round2(subtotalNet),
    totalTax: round2(totalTax),
    totalGross: round2(totalGross),
    lines,
  }
}
