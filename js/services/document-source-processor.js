/** PDF extraction and rendering boundary for AI reference files. */
const DocumentSourceProcessor = (() => {
    'use strict';

    const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    function create(options = {}) {
        let pdfjs = options.pdfjs || null;
        const documentRef = options.documentRef || globalThis.document;

        async function ensurePdfJs() {
            if (pdfjs) return pdfjs;
            if (globalThis.window?.pdfjsLib) {
                pdfjs = globalThis.window.pdfjsLib;
                return pdfjs;
            }
            if (!documentRef) throw new Error('No se puede cargar PDF.js fuera de un documento web.');

            await new Promise((resolve, reject) => {
                const existing = documentRef.querySelector(`script[src="${PDF_JS_URL}"]`);
                if (existing) {
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', () => reject(new Error('No se pudo cargar PDF.js')), { once: true });
                    return;
                }
                const script = documentRef.createElement('script');
                script.src = PDF_JS_URL;
                script.onload = resolve;
                script.onerror = () => reject(new Error('No se pudo cargar PDF.js'));
                documentRef.head.appendChild(script);
            });

            pdfjs = globalThis.window?.pdfjsLib;
            if (!pdfjs) throw new Error('PDF.js no quedó disponible después de cargar el script.');
            pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
            return pdfjs;
        }

        async function extractText(arrayBuffer, maxCharacters = 30000) {
            const library = await ensurePdfJs();
            const pdf = await library.getDocument({ data: arrayBuffer }).promise;
            const pages = [];
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ');
                pages.push(`--- PÁGINA ${pageNumber} ---\n${text}`);
            }
            return pages.join('\n').trim().slice(0, maxCharacters);
        }

        async function renderImages(arrayBuffer, maxPages = 4) {
            const library = await ensurePdfJs();
            const pdf = await library.getDocument({ data: arrayBuffer }).promise;
            const images = [];
            const pageCount = Math.min(pdf.numPages, maxPages);

            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
                try {
                    const page = await pdf.getPage(pageNumber);
                    const viewport = page.getViewport({ scale: 1.2 });
                    const canvas = documentRef.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport }).promise;
                    images.push({
                        base64: canvas.toDataURL('image/jpeg', 0.8).split(',')[1],
                        type: 'image/jpeg'
                    });
                } catch (error) {
                    console.error(`[PDF Render Page Error] No se pudo renderizar la página ${pageNumber}`, error);
                }
            }
            return images;
        }

        return { extractText, renderImages };
    }

    let defaultProcessor = null;
    function current() {
        if (!defaultProcessor) defaultProcessor = create();
        return defaultProcessor;
    }

    return {
        create,
        extractText: (buffer, limit) => current().extractText(buffer, limit),
        renderImages: (buffer, maxPages) => current().renderImages(buffer, maxPages)
    };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = DocumentSourceProcessor;
if (typeof window !== 'undefined') window.DocumentSourceProcessor = DocumentSourceProcessor;
