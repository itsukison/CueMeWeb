// Google Analytics and Tag Manager configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

// Google Analytics pageview tracking
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Google Analytics event tracking
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom events for CueMe
export const trackDownload = (platform: string) => {
  event({
    action: 'download',
    category: 'engagement',
    label: platform,
  })
}

export const trackSignup = () => {
  event({
    action: 'sign_up',
    category: 'conversion',
  })
}

export const trackLogin = () => {
  event({
    action: 'login',
    category: 'engagement',
  })
}

export const trackSubscription = (plan: string) => {
  event({
    action: 'subscribe',
    category: 'conversion',
    label: plan,
  })
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string
        event_category?: string
        event_label?: string
        value?: number
      }
    ) => void
  }
}