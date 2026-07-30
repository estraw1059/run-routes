// Share a link via the native share sheet, falling back to the clipboard.
// Returns 'shared', 'copied', or null (user cancelled / nothing available).
export async function shareLink(title, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (err) {
      if (err.name === 'AbortError') return null
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return null
  }
}

export function routeUrl(routeId) {
  const base = window.location.origin + window.location.pathname
  return routeId ? `${base}#${routeId}` : base
}
