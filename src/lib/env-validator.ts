interface EnvironmentConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GEMINI_API_KEY: string
  OPENAI_API_KEY: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private validated = false
  private config: EnvironmentConfig | null = null

  static getInstance(): EnvironmentValidator {
    if (!this.instance) {
      this.instance = new EnvironmentValidator()
    }
    return this.instance
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('Missing NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('Missing SUPABASE_SERVICE_ROLE_KEY - Required for document processing')
    }

    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      errors.push('Missing GEMINI_API_KEY - Required for text extraction')
    }

    if (!process.env.OPENAI_API_KEY) {
      errors.push('Missing OPENAI_API_KEY - Required for embeddings')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    this.validated = errors.length === 0

    if (this.validated) {
      this.config = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    }

    return { valid: this.validated, errors }
  }

  getConfig(): EnvironmentConfig {
    if (!this.validated || !this.config) {
      const result = this.validate()
      if (!result.valid) {
        throw new Error(`Environment validation failed: ${result.errors.join(', ')}`)
      }
    }
    return this.config!
  }

  isValid(): boolean {
    if (!this.validated) {
      const result = this.validate()
      return result.valid
    }
    return this.validated
  }
}

export const envValidator = EnvironmentValidator.getInstance()
