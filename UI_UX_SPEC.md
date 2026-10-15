# UI/UX & Design System Specification — AKStack Multi-Course LMS

---

## 1. Visual Design Language: AKStack Dark Matte
- **Aesthetic:** Minimalist, high-density, dark matte engineering interface with emerald accents.
- **Backgrounds:**
  - Base canvas: `bg-zinc-950` (`#09090b`)
  - Elevated cards & containers: `bg-zinc-900/40` to `bg-zinc-900/80`
  - Subtle borders: `border-zinc-800` (`#27272a`)
- **Typography:**
  - Primary font: Inter / modern sans-serif
  - Monospace font: JetBrains Mono / font-mono for slugs, prices, formulas, and order badges.
- **Accents & Status Tokens:**
  - Primary brand / success: `emerald-500` / `emerald-400`
  - Preview / Info: `blue-500` / `blue-400`
  - Warning / Locked: `amber-500` / `amber-400`
  - Danger / Delete: `red-500` / `red-400`

---

## 2. Essential Component States
1. **Loading State:** Content skeletons with subtle shimmer matching `bg-zinc-900`.
2. **Empty State:** Dotted borders (`border-dashed border-zinc-800`) with clear primary action button.
3. **Completed State:** Solid emerald badge with checkmark (`✓`) in sidebar and player.
4. **Locked State:** Darkened row with lock icon (`🔒`), linking to course sales page with `?locked=true`.
5. **Preview State:** Blue badge `Free Preview` indicating accessible content without purchase.

---

## 3. Responsive Breakpoints & Accessibility
- **Desktop (>= 1024px):** Fixed-width dynamic hierarchy sidebar (w-80) on the left, central scrollable lesson player.
- **Mobile (< 768px):** Collapsible drawer navigation, full-width touch targets (minimum 44px height), responsive formulas without horizontal clipping.
- **Accessibility (WCAG 2.1 AA):** All interactive buttons include explicit `aria-label` or visible text; high-contrast color pairings.
