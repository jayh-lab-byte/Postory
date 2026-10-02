---
name: Postory Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#b4136d'
  on-secondary: '#ffffff'
  secondary-container: '#fd56a7'
  on-secondary-container: '#600037'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cd'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0053'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  canvas-base: '#FFFFFF'
  canvas-subtle: '#F8FAFC'
  canvas-surface: '#F1F5F9'
  text-display: '#0F172A'
  text-primary: '#1E293B'
  text-secondary: '#64748B'
  text-tertiary: '#94A3B8'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
  sky-vivid: '#3B82F6'
  coral-vivid: '#F43F5E'
  state-verified: '#059669'
  state-verified-bg: '#ECFDF5'
  state-observed: '#0284C7'
  state-observed-bg: '#F0F9FF'
  state-unknown: '#D97706'
  state-unknown-bg: '#FFFBEB'
  platform-blog: '#03C75A'
  platform-instagram: '#E1306C'
  platform-facebook: '#1877F2'
  platform-threads: '#000000'
  platform-youtube: '#FF0000'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system delivers a high-trust, editorial-grade creative environment tailored for multi-channel content creators, marketers, and growth operators. Balancing the rigor of a factual IDE with the effortless fluidity of consumer publishing tools, the interface communicates clarity, structural transparency, and dynamic energy.

The aesthetic fuses **Modern Corporate SaaS** precision with vibrant **Creative Acceleration**. Crisp, light-reflective canvases in pure white and slate tint serve as an unobtrusive workspace, while the logo's energetic tri-color gradient (electric sky blue, sunset coral pink, and luminous warm orange) marks moments of AI synthesis, high-impact calls to action, and live export states.

The emotional goal is quiet confidence: eliminating the anxiety of AI hallucinations through explicit verification indicators, strict alignment cues, and tactile visual states.

## Colors

The color palette centers on a structured neutral system anchored by `#0F172A` deep ink for typography and `#FFFFFF` / `#F8FAFC` for content surfaces.

The chromatic brand expression draws directly from the core symbol mark:
- **Primary Sky (`#2563EB` / `#3B82F6`)**: Applied to primary interface drivers, interactive text cursors, active navigation indicators, and verified data highlights.
- **Secondary Sunset Coral (`#EC4899` / `#F43F5E`)**: Used for creative triggers, AI generation triggers, transformational steps, and promotional markers.
- **Tertiary Amber (`#F59E0B`)**: Reserved for attention cues, draft highlights, and unreviewed warnings.

### Verification & Platform Semantic Palettes
- **Fact Integrity Triad**:
  - `VERIFIED`: Forest green (`#059669` on `#ECFDF5`) designates confirmed, source-grounded statements.
  - `OBSERVED`: Precision cyan-blue (`#0284C7` on `#F0F9FF`) marks visual facts extracted directly from image telemetry.
  - `UNKNOWN`: Amber ochre (`#D97706` on `#FFFBEB`) marks generated inferences requiring creator review.
- **Platform Badges**: High-fidelity platform tokens ensure that preview cards match target ecosystems (Naver Green, Instagram Berry, Facebook Royal, Threads Jet Black, YouTube Vermilion). State must never be communicated through color alone; accompany every semantic hue with a typed label or symbolic icon.

## Typography

The typography system is engineered for dual-context publishing: dense editorial work benches and rapid mobile inspection. The primary font is Inter (with native system-fallback to Pretendard for Hangul script purity).

- **Headlines**: Weighted at `600` and `700` with subtle negative tracking (`-0.02em`) to maintain tightness in condensed workspace headers and modal titles.
- **Editorial Body**: Styled with expansive line heights (`1.625` on long-form editorial views) to facilitate readability during proofreading and draft generation. Paragraphs in preview tabs receive explicit bottom margins equivalent to `space-md`.
- **Labels & Metatags**: Formatted with slightly increased tracking (`0.02em` - `0.04em`) and uppercase rendering for verification badges (`VERIFIED`, `OBSERVED`, `UNKNOWN`) to maximize rapid scanning.
- **Monospace Variant**: JetBrains Mono is deployed strictly for character/token counts, raw HTML tags, and clipboard MIME payload previews.

## Layout & Spacing

The layout model adapts across three main environments:

1. **Desktop Workspace (>= 1280px)**: A 3-column fixed-ratio productivity grid:
   - **Left Panel (280px)**: Multi-platform navigation selector, media source asset drawer, and structured outline.
   - **Center Panel (Flex 1, min 580px)**: Real-time Markdown/WYSIWYG editor and feed simulator canvas.
   - **Right Panel (340px)**: Quality assurance inspection, tri-state fact ledger, and copy/export command hub.
2. **Tablet Split (768px - 1279px)**: Collapses into a 2-column configuration where the right inspector is accessible through a responsive slide-over drawer.
3. **Mobile Screen (320px - 767px)**: Strict single-column stack. Zero horizontal scroll is enforced at all viewports down to 320px width. Workspace panels transition into a bottom sticky segmented tab bar (`Story` | `Blog` | `SNS` | `Shorts` | `Audit`).

Margins follow a 4px/8px incremental base rhythm. Section padding uses `space-lg` to separate functional units, while discrete controls within action bars are separated by `space-sm`.

## Elevation & Depth

Visual hierarchy is constructed through crisp tonal stepping and precise ambient boundary borders rather than heavy, dramatic shadows.

- **Level 0 (Canvas Base)**: `#F8FAFC` slate white background.
- **Level 1 (Card & Workspace Panels)**: `#FFFFFF` surface framed with a 1px crisp hairline border in `#E2E8F0`. Layered with a minimal micro-ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Floating Action Bars, Dropdowns, Popovers)**: `#FFFFFF` surface with `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Level 3 (Modal Overlays & System Drawers)**: `#FFFFFF` with backdrop blur (`backdrop-filter: blur(8px)`) against a neutral tint (`rgba(15, 23, 42, 0.35)`).
- **Interactive Focus & Active Elevation**: Active editing blocks never use heavy dropshadows; depth is signaled through an inner-tinted border ring (`box-shadow: 0 0 0 2px #2563EB`) accompanied by a subtle ambient rise.

## Shapes

The interface utilizes a rounded geometry system (Scale `2`, with base radius at `0.5rem` / `8px`):
- **Base Components (Inputs, Buttons, Segmented Chips)**: `0.5rem` (`8px`) radius provides an approachable yet structured SaaS aesthetic.
- **Surface Cards & Editor Panels**: `0.75rem` (`12px`) to `1rem` (`16px`) radius, creating distinct visual framing around content areas and preview viewports.
- **Platform Badges & Status Indicators**: Full pill capsules (`9999px`) to distinguish metadata and classification flags from interactive form controls.
- **Media Thumbnails & Placeholder Blocks**: `0.5rem` (`8px`) inner radius with subtle `1px inset` outline to isolate light-colored imagery from pure white cards.

## Components

### Buttons
- **Primary AI Action**: Gradient fill from `#2563EB` (Sky) across `#EC4899` (Sunset Pink), white text, `8px` radius, hover brightness transition (`105%`), active scale `0.98`.
- **Secondary (Editorial)**: White fill, `1px solid #E2E8F0`, `#1E293B` text, subtle hover to `#F8FAFC`.
- **Tertiary / Ghost**: Transparent fill, `#64748B` text, hover `#F1F5F9`.
- **Clipboard MIME Actions**: Dual-button grouped segment (`Copy Plain` vs `Rich HTML for SmartEditor`) with distinct iconography.

### Status Indicators & Badges (Tri-State Fact System)
- **VERIFIED**: Green pill (`#ECFDF5`), `#059669` text, `CheckCircle` icon (14px), text in `label-sm`.
- **OBSERVED**: Blue pill (`#F0F9FF`), `#0284C7` text, `Eye` icon (14px), text in `label-sm`.
- **UNKNOWN**: Amber pill (`#FFFBEB`), `#D97706` text, `AlertTriangle` icon (14px), text in `label-sm`.
- *Rule*: Always display icon + label to ensure accessibility across color-deficient displays.

### Platform Badges
- Pill container with `4px` padding, displaying official brand icon followed by platform name (`Naver Blog`, `Instagram`, `Threads`, `X`, `Shorts`). In active preview mode, badge takes a subtle tonal border reflecting the platform hue.

### Input Fields & Editor Blocks
- Standard text input uses `#FFFFFF` background, `1px solid #CBD5E1`, `8px` radius, and `12px 14px` padding. Focus transitions to `2px solid #2563EB` without layout shift.
- Modular Paragraph Blocks in the content editor feature a hover-activated left rail (`3px solid transparent` -> `3px solid #3B82F6`) allowing reordering and inline fact tagging.

### Cards & Action Drawers
- **Missing Information Question Card**: Prominent card with a light amber accent border (`#FDE68A`), radio options with custom unchecked rings (`#CBD5E1`) and filled brand centers (`#2563EB`), followed by inline action controls (`[사실 입력]`, `[건너뛰기]`).
- **Interactive Review Accordion**: Structured row with red-line modification indicators, collapsible context history, and immediate resolution actions (`[삭제]`, `[대체]`).