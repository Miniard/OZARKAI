/**
 * Détecte si un email contient un reçu/facture dans son corps
 * Utilise une approche par patterns et scoring
 */

interface DetectionResult {
  hasReceipt: boolean
  confidence: number
  reasons: string[]
}

export function detectReceiptInEmailBody(
  subject: string,
  bodyText: string,
  bodyHtml?: string
): DetectionResult {
  const reasons: string[] = []
  let score = 0

  // Normaliser le texte pour l'analyse
  const text = (subject + ' ' + bodyText).toLowerCase()

  // === CRITÈRES OBLIGATOIRES ===

  // 1. Présence de montant avec devise (€, $, EUR, USD)
  const amountPatterns = [
    /\d+[,.\s]*\d*\s*€/gi,           // 29.99€, 29,99 €
    /€\s*\d+[,.\s]*\d*/gi,           // €29.99
    /\$\s*\d+[,.\s]*\d*/gi,          // $29.99
    /\d+[,.\s]*\d*\s*\$$/gi,         // 29.99$
    /\d+[,.\s]*\d*\s*(EUR|USD|GBP)/gi, // 29.99 EUR
  ]

  const hasAmount = amountPatterns.some((pattern) => pattern.test(text))
  
  if (hasAmount) {
    score += 30
    reasons.push('Montant détecté')
  } else {
    // Sans montant, c'est probablement pas un reçu
    return { hasReceipt: false, confidence: 0, reasons: ['Aucun montant détecté'] }
  }

  // 2. Mots-clés de reçu/facture
  const receiptKeywords = [
    'facture',
    'reçu',
    'receipt',
    'invoice',
    'order',
    'commande',
    'payment',
    'paiement',
    'total',
    'montant',
    'confirmation',
  ]

  const keywordCount = receiptKeywords.filter((keyword) =>
    text.includes(keyword)
  ).length

  if (keywordCount >= 2) {
    score += 25
    reasons.push(`${keywordCount} mots-clés trouvés`)
  }

  // 3. Patterns de structure de reçu
  const structurePatterns = [
    /sous-total|subtotal/gi,
    /tva|vat|tax/gi,
    /quantit[eé]|quantity|qty/gi,
    /(prix|price)\s*(unitaire|unit)/gi,
    /num[eé]ro\s*(de\s*)?(facture|commande|order|invoice)/gi,
  ]

  const structureMatches = structurePatterns.filter((pattern) =>
    pattern.test(text)
  ).length

  if (structureMatches >= 2) {
    score += 20
    reasons.push(`Structure de reçu détectée (${structureMatches} patterns)`)
  }

  // 4. Vérifier la présence de tableaux dans le HTML
  if (bodyHtml) {
    const hasTable = /<table/i.test(bodyHtml)
    const hasMultipleTables = (bodyHtml.match(/<table/gi) || []).length >= 2
    
    if (hasTable) {
      score += 10
      reasons.push('Tableau HTML détecté')
    }
    
    if (hasMultipleTables) {
      score += 5
      reasons.push('Plusieurs tableaux (structure de reçu)')
    }
  }

  // === CRITÈRES BONUS ===

  // 5. Phrases typiques de confirmation d'achat
  const confirmationPhrases = [
    'merci pour votre achat',
    'thank you for your purchase',
    'your order',
    'votre commande',
    'order confirmation',
    'confirmation de commande',
    'payment successful',
    'paiement réussi',
    'transaction',
  ]

  const hasConfirmation = confirmationPhrases.some((phrase) =>
    text.includes(phrase)
  )

  if (hasConfirmation) {
    score += 15
    reasons.push('Phrase de confirmation trouvée')
  }

  // 6. Date récente dans le corps
  const datePatterns = [
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, // 27/11/2025
    /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g,   // 2025-11-27
  ]

  const hasDate = datePatterns.some((pattern) => pattern.test(text))
  
  if (hasDate) {
    score += 10
    reasons.push('Date détectée')
  }

  // === SCORING FINAL ===

  // Score minimum pour considérer comme reçu : 50
  const minimumScore = 50
  const hasReceipt = score >= minimumScore

  return {
    hasReceipt,
    confidence: Math.min(score / 100, 1), // Normaliser entre 0 et 1
    reasons,
  }
}

/**
 * Extrait le texte brut d'un message Gmail
 */
export function extractEmailBody(message: any): { text: string; html: string | null } {
  let bodyText = ''
  let bodyHtml: string | null = null

  function extractFromPart(part: any) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8')
    }

    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8')
    }

    if (part.parts) {
      part.parts.forEach(extractFromPart)
    }
  }

  extractFromPart(message.payload)

  // Fallback to snippet if no body found
  if (!bodyText && message.snippet) {
    bodyText = message.snippet
  }

  return { text: bodyText, html: bodyHtml }
}

/**
 * Nettoie le HTML d'un email pour le rendu
 * Enlève les scripts, trackers, etc.
 */
export function cleanEmailHtml(html: string): string {
  // Remove scripts
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove tracking pixels
  cleaned = cleaned.replace(/<img[^>]*src=["'][^"']*track[^"']*["'][^>]*>/gi, '')
  
  // Remove external stylesheets (keep inline styles)
  cleaned = cleaned.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
  
  // Add a max-width container for better rendering
  cleaned = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${cleaned}
      </body>
    </html>
  `
  
  return cleaned
}
