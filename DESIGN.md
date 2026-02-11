# Design System: In DO Time 2.0
**Project ID:** [Local Project]

## 1. Visual Theme & Atmosphere
The design system for **In DO Time 2.0** is centered around the "Midnight Mountain Expedition" aesthetic. It combines the sleek, modern feel of high-end SaaS applications with a rugged, atmospheric atmosphere.
- **Atmosphere:** Moody, focused, and professional. The use of "Mountain Night" and "Mountain Day" themes provides a dynamic experience that feels alive.
- **Density:** Medium-low density. The UI prioritizes clarity and focus on time-tracking data by utilizing ample whitespace and large, prominent headings.
- **Philosophy:** "Glassmorphism" is the core principle. Components appear as semi-transparent glass panes floating over atmospheric backgrounds, creating depth through blur and subtle borders rather than heavy shadows.

## 2. Color Palette & Roles

### Accent Colors
*   **Vibrant Trail Lime (#84cc16):** The primary brand color. Used for primary actions (Add Client, Submit), active states, toggles, and highlights. It represents energy and progress.
*   **Amber Dusk (#D97706):** Functional accent color for active timers. It provides a warm, urgent contrast to indicate that time is currently being tracked.
*   **Danger Red (#f87171):** Reserved for destructive actions (Delete, Cancel) and error states.

### Background & Surface
*   **Glacier Night Overlay (rgba(15, 23, 42, 0.9)):** The base dark mode overlay. It creates a deep, midnight-blue foundation for the dark theme.
*   **Frosted Glass Surface (rgba(255, 255, 255, 0.06)):** The default surface for cards and components. Provides a semi-transparent, blurred backdrop.
*   **Surface Hover (rgba(255, 255, 255, 0.10)):** A slightly brighter surface state for interactive elements like cards and list items.

### Typography Colors
*   **Peak Header White (#ffffff):** Used for main headings to ensure maximum visibility and prominence.
*   **Crisp Snow White (#f3f4f6):** The primary body text color in dark mode, providing high readability against dark backgrounds.
*   **Mist Slate Gray (#94a3b8):** Secondary text color for labels, descriptions, and metadata.
*   **Shadow Slate (#64748b):** Muted text color for "Trail Markers" and auxiliary information.

## 3. Typography Rules
*   **Primary Font:** **Outfit** – a modern geometric sans-serif that balances technical precision with a friendly, approachable character.
*   **Heading Style:** Large, bold headings that anchor each section. Headings are often pure white (#ffffff).
*   **Body Type:** Regular weight with a relaxed line-height (1.65) to ensure comfort during long usage sessions.
*   **Secondary Styling:** "Trail Markers" use uppercase text with 0.1em letter-spacing and a triangular prefix (▲), evoking the feeling of a hiking trail or progress path.

## 4. Component Stylings
*   **Buttons:**
    *   **Primary:** Pill-shaped (`rounded-full`) with generous horizontal padding. Features a pulse-glow animation (`animate-pulse-glow`) to draw attention.
    *   **Secondary:** Ghost or semi-transparent styles that gain opacity on hover.
*   **Cards/Containers:** 
    *   **Style:** Known as the "Glass" utility. Uses `backdrop-filter: blur(24px)` and a thin 1px border (`var(--border)`).
    *   **Shape:** Generously rounded corners (`1.25rem` or `rounded-2xl`).
*   **Inputs/Forms:** 
    *   **Fields:** Semi-transparent backgrounds with subtle borders that highlight with the accent color on focus.
    *   **Checkboxes:** Custom-themed with **Vibrant Trail Lime**.

## 5. Layout Principles
*   **Spacing Strategy:** Uses a generous scale to prevent the UI from feeling cramped. Elements are separated by clear margins to maintain a "focused" feel.
*   **Grid Alignment:** Strong central alignment for content containers, often confined to a max-width layout to ensure readability on wide screens.
*   **Responsive Design:** Components stack vertically on mobile, with margins and padding adjusting to maintain the atmospheric feel even on smaller devices.
*   **Transitions:** Universal 200ms ease transitions for background, border, and color changes, with a slower 500ms transition for theme switching.
