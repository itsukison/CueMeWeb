import type { Metadata } from "next";
import { Inter, Russo_One } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { GA_TRACKING_ID, GTM_ID } from "@/lib/analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const russoOne = Russo_One({
  variable: "--font-russo-one",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CueMe - AI面接対策ツール | 面接カンニング・AI会議サポート",
  description: "AI面接対策の決定版！面接カンニング機能でリアルタイム回答支援。転職面接・就活面接の成功率85%向上。AI会議ツールとしても活用可能。無料ダウンロード開始。",
  keywords: [
    "AI面接",
    "面接対策",
    "面接カンニング", 
    "AI会議ツール",
    "面接練習",
    "転職面接",
    "就活面接",
    "面接支援",
    "AI面接対策",
    "面接アプリ",
    "面接準備",
    "オンライン面接",
    "面接質問",
    "面接回答",
    "就職活動"
  ],
  authors: [{ name: "CueMe Team" }],
  creator: "CueMe",
  publisher: "CueMe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.cueme.ink'),
  alternates: {
    canonical: '/',
    languages: {
      'ja-JP': '/',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: "CueMe - AI面接対策ツール | 面接カンニング・AI会議サポート",
    description: "AI面接対策の決定版！面接カンニング機能でリアルタイム回答支援。転職面接・就活面接の成功率85%向上。",
    url: 'https://www.cueme.ink',
    siteName: 'CueMe',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CueMe AI面接対策ツール',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CueMe - AI面接対策ツール | 面接カンニング・AI会議サポート",
    description: "AI面接対策の決定版！面接カンニング機能でリアルタイム回答支援。転職面接・就活面接の成功率85%向上。",
    images: ['/og-image.jpg'],
    creator: '@cueme_app',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
  classification: 'AI面接対策ツール',
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="canonical" href="https://www.cueme.ink" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#013220" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CueMe" />
        <meta name="application-name" content="CueMe" />
        <meta name="msapplication-TileColor" content="#013220" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data for Japanese SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CueMe",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Windows, macOS, Linux",
              "description": "AI面接対策ツール。面接カンニング機能でリアルタイム回答支援。転職面接・就活面接の成功率向上。",
              "url": "https://www.cueme.ink",
              "downloadUrl": "https://www.cueme.ink/download",
              "softwareVersion": "2.0",
              "datePublished": "2024-01-01",
              "dateModified": "2025-01-01",
              "author": {
                "@type": "Organization",
                "name": "CueMe Team"
              },
              "publisher": {
                "@type": "Organization",
                "name": "CueMe",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.cueme.ink/logo.png"
                }
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "keywords": "AI面接,面接対策,面接カンニング,AI会議ツール,転職面接,就活面接"
            })
          }}
        />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CueMe",
              "url": "https://www.cueme.ink",
              "logo": "https://www.cueme.ink/logo.png",
              "description": "AI面接対策ツールの開発・提供企業",
              "foundingDate": "2024",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["Japanese", "English"]
              },
              "sameAs": [
                "https://twitter.com/cueme_app"
              ]
            })
          }}
        />

        {/* FAQ Schema for Japanese SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "CueMeは面接カンニングツールですか？",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CueMeは面接対策・練習ツールです。リアルタイムで回答のヒントを表示し、面接準備をサポートします。"
                  }
                },
                {
                  "@type": "Question", 
                  "name": "AI面接対策の効果はありますか？",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "はい、CueMeユーザーの85%が面接通過率の向上を報告しています。AI生成の質問で効率的な対策が可能です。"
                  }
                },
                {
                  "@type": "Question",
                  "name": "オンライン面接でも使用できますか？",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "はい、ZoomやTeamsなどのオンライン面接でもご利用いただけます。AI会議ツールとしても活用可能です。"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${russoOne.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
        <Analytics />

        {/* Google Analytics */}
        {GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
