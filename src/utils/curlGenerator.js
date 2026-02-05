/**
 * Generate cURL command from HAR entry
 */
export function generateCurl(entry) {
  if (!entry || !entry.request) return ''

  const { method, url, headers, postData } = entry.request

  // Start with basic curl command
  let curl = `curl -X ${method} '${url}'`

  // Add headers (skip common auto-generated headers)
  const skipHeaders = ['host', 'connection', 'content-length', 'user-agent']

  if (headers && headers.length > 0) {
    headers.forEach(h => {
      if (!skipHeaders.includes(h.name.toLowerCase())) {
        // Escape single quotes in header values
        const escapedValue = h.value.replace(/'/g, "'\\''")
        curl += ` \\\n  -H '${h.name}: ${escapedValue}'`
      }
    })
  }

  // Add request body if present
  if (postData && postData.text) {
    // Escape single quotes in body
    const escapedBody = postData.text.replace(/'/g, "'\\''")
    curl += ` \\\n  -d '${escapedBody}'`
  }

  return curl
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}
