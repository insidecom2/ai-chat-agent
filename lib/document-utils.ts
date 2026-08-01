export async function extractImageText(file: File | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('tha+eng')

  try {
    const result = await worker.recognize(file)
    return result.data.text.trim()
  } finally {
    await worker.terminate()
  }
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url,
  ).toString()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
  }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (text) {
      pages.push(`Page ${pageNumber}:\n${text}`)
      continue
    }

    // Scanned pages have no text layer, so render them and run OCR.
    if (pageNumber > 20) continue
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const context = canvas.getContext('2d')
    if (!context) continue

    await page.render({ canvas, canvasContext: context, viewport }).promise
    const pageText = await extractImageText(canvas)
    if (pageText) pages.push(`Page ${pageNumber}:\n${pageText}`)
  }

  return pages.join('\n\n').trim().slice(0, 60000)
}
