export function shouldAutoLoadOpenRouterModels(
  currentModel: string | null | undefined,
  fallbackModels: string[]
) {
  const normalizedModel = currentModel?.trim()
  if (!normalizedModel) {
    return false
  }

  return !fallbackModels.includes(normalizedModel)
}
