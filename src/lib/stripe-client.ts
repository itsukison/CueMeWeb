import { loadStripe } from '@stripe/stripe-js'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables')
}

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export const PLAN_NAMES = {
  FREE: 'Free',
  BASIC: 'Basic', 
  PREMIUM: 'Premium',
} as const

export type PlanName = keyof typeof PLAN_NAMES