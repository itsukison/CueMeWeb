/**
 * Document Processor Service
 * 
 * Handles document text extraction and chunking for RAG pipeline.
 * Supports PDF and plain text files using pdf2json for PDF processing.
 */

import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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
 * Extract text from a PDF using pdf2json
 * Uses event-based API as recommended by the library maintainers
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    console.log(`[DocumentProcessor] Extracting text from PDF using pdf2json`);
    
    // pdf2json requires a file path, so we write buffer to a temp file first
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    try {
        // Write buffer to temporary file
        await fs.writeFile(tempFilePath, buffer);
        console.log(`[DocumentProcessor] Wrote PDF to temp file: ${tempFilePath}`);
        
        // Parse with pdf2json using event-based API
        const text = await new Promise<string>((resolve, reject) => {
            // Bypass TypeScript type checking as recommended by library docs
            // See: https://github.com/modesty/pdf2json/issues/273
            const pdfParser = new (PDFParser as any)(null, 1);
            
            pdfParser.on('pdfParser_dataError', (error: any) => {
                console.error('[DocumentProcessor] PDF parsing error:', error.parserError);
                reject(new Error(error.parserError));
            });
            
            pdfParser.on('pdfParser_dataReady', () => {
                try {
                    const extractedText = (pdfParser as any).getRawTextContent();
                    console.log(`[DocumentProcessor] Extracted ${extractedText.length} characters from PDF`);
                    resolve(extractedText);
                } catch (error) {
                    reject(error);
                }
            });
            
            pdfParser.loadPDF(tempFilePath);
        });
        
        return cleanText(text);
    } catch (error) {
        console.error(`[DocumentProcessor] PDF extraction failed:`, error);
        throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        // Always clean up temp file
        try {
            await fs.unlink(tempFilePath);
            console.log(`[DocumentProcessor] Cleaned up temp file: ${tempFilePath}`);
        } catch (cleanupError) {
            console.warn(`[DocumentProcessor] Failed to clean up temp file: ${tempFilePath}`, cleanupError);
        }
    }
}

/**
 * Extract text from a document buffer
 */
export async function extractText(
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    console.log(`[DocumentProcessor] Extracting text from ${mimeType}`);

    if (mimeType === 'application/pdf') {
        return await extractTextFromPdf(buffer);
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        const text = buffer.toString('utf-8');
        console.log(`[DocumentProcessor] Extracted ${text.length} characters from text file`);
        return cleanText(text);
    }

    throw new Error(`Unsupported file type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`);
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
