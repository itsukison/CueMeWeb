# AI面接チート Landing Page

A responsive landing page for the AI Interview Cheat Tool built with Next.js, TailwindCSS, and shadcn/ui.

## Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Japanese UI**: All text in Japanese as requested
- **Professional Styling**: Minimal design inspired by Coda.co
- **Custom Colors**: 
  - Background: `#F7F7EE` (cream)
  - Accent: `#013220` (dark green)
  - Text: `#000000` (black)

## Components Used

- **shadcn/ui**: Button, NavigationMenu, DropdownMenu
- **Lucide React**: Icons (ArrowDown, Settings, Rocket, DollarSign, etc.)
- **Inter Font**: Clean, professional typography

## Pages

- `/landing` - Main landing page
- `/` - Redirects to dashboard/login with link to landing page

## Structure

```
src/
├── components/
│   └── landing-page.tsx     # Main landing page component
├── app/
│   ├── landing/
│   │   └── page.tsx         # Landing page route
│   └── page.tsx             # Updated home page with landing link
```

## Development

```bash
cd cueme-dashboard
npm run dev
```

Visit `http://localhost:3000/landing` to see the landing page.

## Design Elements

1. **Navbar**: Logo, navigation links, language dropdown, CTA button
2. **Hero Section**: Pill CTA, main headline with icons, subheadline, download button
3. **Visual Elements**: Animated down arrow, curved green background shape
4. **Typography**: Bold headlines, clean body text, proper spacing

The landing page is fully responsive and ready for production use.