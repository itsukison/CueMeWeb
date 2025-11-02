Landing Page Color Redesign Plan
Overview
Update the landing page to use the new color palette from color.MD, maintaining the existing layout structure while improving colors, spacing, borders, and corner rounding consistency.

Color Mapping Strategy
Background & Surfaces
App canvas: #F3F2F1 (currently #F7F7EE)
Primary cards/surfaces: #FEFEFE 
Secondary sections: #EDECEA
Subtle backgrounds: #F3F7EF
Accent Colors
Primary accent (lime green): #D8F9B8 (replacing dark green #013220 in accent uses)
Light accent tint: #EAFBDD
Dark sections: #2B2D2D (primary text color, used for final CTA)
Text & Icons
Primary text: #2B2D2D (replacing pure black)
Muted text: #2B2D2D with 70% opacity
On dark backgrounds: White text
Borders & Dividers
Subtle borders: #EDECEA or #F3F7EF
Border width: 1px
Corner radius: 12-16px consistently
Section-Specific Changes
1. Navbar
Update text colors to #2B2D2D
Update CTA button to use lime accent #D8F9B8 with dark text
Ensure proper hover states with light accent #EAFBDD
2. Hero Section
Background: #F3F2F1
Update "CueMe" brand text accent color from #013220 to #2B2D2D or keep as brand color
Update badge/button borders to match new palette
Update bottom green shape to use lime green #D8F9B8
3. Secret Bar & Voice Input Section (First Dark Section)
Background: #D8F9B8 (primary lime accent)
Update text to dark #2B2D2D for contrast
Update icon colors appropriately
Add container-like styling with rounded corners (16px) and padding
Update border to #EDECEA
4. Q&A Preparation Section
Background: #F3F2F1
Update accent colors from dark green to lime #D8F9B8
Update card backgrounds and borders
Cards should use #FEFEFE with consistent 16px radius
5. Chat Interface Section
Background: #EDECEA (secondary container)
Add container styling with rounded corners (16px) and padding
Update text colors to #2B2D2D
Update accent highlights to lime green
Cards should have subtle borders
6. Testimonials Section  
Background: #F3F2F1
Update accent colors from #013220 to lime green
Cards use #FEFEFE with 16px radius
Update star fill colors to lime green
Update icon backgrounds to light accent #EAFBDD
7. Download Section
Background: #F3F2F1
Update heading colors to #2B2D2D
Update cards with proper borders and radius
System requirements card uses #EDECEA
8. Final CTA Section
Background: #2B2D2D (dark gray)
Add container styling with rounded corners (16px) and generous padding
Text remains white for contrast
Update accent text to lime green #D8F9B8
Update primary button to white background with dark text
9. Footer
Background: #F3F2F1
Update text colors to #2B2D2D
Update link hover states
Update divider to #EDECEA
Implementation Files
Primary Files
/Users/itsukison/Desktop/CueMe/CueMeWeb/tailwind.config.js - Add custom color palette
/Users/itsukison/Desktop/CueMe/CueMeWeb/src/app/globals.css - Update CSS variables
/Users/itsukison/Desktop/CueMe/CueMeWeb/src/components/landing-page.tsx - Main redesign work
/Users/itsukison/Desktop/CueMe/CueMeWeb/src/components/download-section.tsx - Update colors
Design Guidelines to Follow
Spacing tokens: 4px, 8px, 16px, 24px, 40-64px
Generous vertical spacing for airy aesthetic
Consistent corner radius: 12-16px
Minimal shadows: Only for modals/floating elements
Accent restraint: Lime should appear in <10% of screen area
Contrast through tone: Use light/dark shifts, not harsh lines
Key Implementation Details
Replace all inline style={{backgroundColor: "#013220"}} with appropriate new colors
Replace all inline style={{color: "#013220"}} with #2B2D2D or lime accents
Update all border-black and similar hardcoded borders to use new palette
Ensure all rounded corners use consistent values (12-16px)
Update hover states to use #EAFBDD for lime elements
Convert two major dark sections to container-style with rounded corners and padding
Maintain visual hierarchy through layering: #F3F2F1 → #EDECEA → #FEFEFE