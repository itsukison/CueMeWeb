import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil', // Use the latest API version
  typescript: true,
})

// Pricing configuration for Japan
export const PRICING_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 750, // 750 yen
    currency: 'jpy',
    interval: 'month' as const,
  },
  PREMIUM: {
    name: 'Premium', 
    price: 2500, // 2500 yen
    currency: 'jpy',
    interval: 'month' as const,
  },
} as const

// Create Stripe products and prices (run this once in setup)
export async function createStripeProducts() {
  try {
    // Create Basic plan product
    const basicProduct = await stripe.products.create({
      name: 'CueMe Basic Plan',
      description: '5 files (20 QnAs each) + 200 questions per month',
    })

    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: PRICING_PLANS.BASIC.price,
      currency: PRICING_PLANS.BASIC.currency,
      recurring: {
        interval: PRICING_PLANS.BASIC.interval,
      },
    })

    // Create Premium plan product
    const premiumProduct = await stripe.products.create({
      name: 'CueMe Premium Plan',
      description: '20 files (50 QnAs each) + 1000 questions per month',
    })

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: PRICING_PLANS.PREMIUM.price,
      currency: PRICING_PLANS.PREMIUM.currency,
      recurring: {
        interval: PRICING_PLANS.PREMIUM.interval,
      },
    })

    return {
      basic: {
        product: basicProduct.id,
        price: basicPrice.id,
      },
      premium: {
        product: premiumProduct.id,
        price: premiumPrice.id,
      },
    }
  } catch (error) {
    console.error('Error creating Stripe products:', error)
    throw error
  }
}

// Helper function to create checkout session
export async function createCheckoutSession({
  priceId,
  userId,
  successUrl,
  cancelUrl,
  userEmail,
}: {
  priceId: string
  userId: string
  successUrl: string
  cancelUrl: string
  userEmail?: string
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  }

  // Add customer email if provided
  if (userEmail) {
    sessionParams.customer_email = userEmail
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

// Helper function to create billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}