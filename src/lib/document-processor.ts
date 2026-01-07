/**
 * Document Processor Service
 * 
 * Handles document text extraction and chunking for RAG pipeline.
 * Supports PDF and plain text files.
 */

// Note: Dynamic import to handle PDF parsing
let pdfParse: any = null;

async function loadPdfParse() {
    if (!pdfParse) {
        pdfParse = (await import('pdf-parse')).default;
    }
    return pdfParse;
}

export interface ChunkResult {
    content: string;
    chunkIndex: number;
    charStart: number;
    charEnd: number;
}

export interface ProcessedDocument {
    fullText: string;
    chunks: ChunkResult[];
    totalChunks: number;
}

export interface ChunkingConfig {
    chunkSize: number;      // Target chunk size in characters
    chunkOverlap: number;   // Overlap between chunks
    minChunkSize: number;   // Minimum chunk size to keep
}

const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
    chunkSize: 500,      // 500 characters per chunk
    chunkOverlap: 100,   // 100 character overlap
    minChunkSize: 50,    // Don't create chunks smaller than 50 chars
};

/**
 * Extract text from a document buffer
 */
export async function extractText(
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    console.log(`[DocumentProcessor] Extracting text from ${mimeType}`);

    if (mimeType === 'application/pdf') {
        const parsePdf = await loadPdfParse();
        const data = await parsePdf(buffer);
        console.log(`[DocumentProcessor] Extracted ${data.text.length} characters from PDF`);
        return cleanText(data.text);
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        const text = buffer.toString('utf-8');
        console.log(`[DocumentProcessor] Extracted ${text.length} characters from text file`);
        return cleanText(text);
    }

    throw new Error(`Unsupported file type: ${mimeType}. Supported types: PDF, TXT, MD`);
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
    return text
        // Normalize whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove excessive spaces
        .replace(/ {2,}/g, ' ')
        // Trim each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
}

/**
 * Chunk text into smaller segments for embedding
 * Uses sentence-aware chunking to avoid breaking mid-sentence
 */
export function chunkText(
    text: string,
    config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
    const { chunkSize, chunkOverlap, minChunkSize } = config;
    const chunks: ChunkResult[] = [];

    // Split into sentences (Japanese and English)
    const sentences = text.split(/(?<=[。.!?！？\n])/);

    let currentChunk = '';
    let currentStart = 0;
    let charPosition = 0;

    for (const sentence of sentences) {
        // If adding this sentence would exceed chunk size
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            // Save current chunk
            chunks.push({
                content: currentChunk.trim(),
                chunkIndex: chunks.length,
                charStart: currentStart,
                charEnd: charPosition,
            });

            // Start new chunk with overlap
            const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
            currentChunk = currentChunk.slice(overlapStart) + sentence;
            currentStart = charPosition - (currentChunk.length - sentence.length);
        } else {
            currentChunk += sentence;
        }

        charPosition += sentence.length;
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length >= minChunkSize) {
        chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunks.length,
            charStart: currentStart,
            charEnd: charPosition,
        });
    }

    console.log(`[DocumentProcessor] Created ${chunks.length} chunks from ${text.length} characters`);
    return chunks;
}

/**
 * Process a document: extract text and chunk it
 */
export async function processDocument(
    buffer: Buffer,
    mimeType: string,
    config?: ChunkingConfig
): Promise<ProcessedDocument> {
    const fullText = await extractText(buffer, mimeType);
    const chunks = chunkText(fullText, config);

    return {
        fullText,
        chunks,
        totalChunks: chunks.length,
    };
}

/**
 * Supported MIME types for document processing
 */
export const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
];

/**
 * Check if a file type is supported
 */
export function isSupported(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType);
}
