# ChatVault

## Current State
New project. Only scaffolded backend (empty actor) and no frontend code yet.

## Requested Changes (Diff)

### Add
- Full ChatVault web app: paste a ChatGPT or Grok share link, fetch the page HTML via backend HTTP outcalls, parse the chat messages, display a styled live preview, and export as HTML, PDF, or Word (.docx)
- Backend: HTTP outcall endpoint that accepts a URL string and returns the raw HTML content of the page
- Frontend: hero landing page with link input + Fetch & Preview button
- Live chat preview panel rendering parsed messages (user + assistant) with avatars, timestamps, code blocks
- Export panel with three options: self-contained HTML download, PDF (browser print), Word (.docx via docx.js)
- SEO meta tags (title, description, og:image, og:title, twitter:card, canonical URL, sitemap-friendly)
- Dark-themed premium SaaS UI matching the design preview
- Manual paste fallback: if the URL fetch fails or is blocked, the user can paste raw chat text manually

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Select `http-outcalls` component
2. Generate Motoko backend with one function: `fetchUrl(url: Text): async Text` that uses HTTP outcalls to fetch the URL and return the response body
3. Build frontend:
   - Landing hero with centered URL input + "Fetch & Preview" gradient button
   - On submit: call backend `fetchUrl`, parse returned HTML to extract chat messages
   - Parse strategy: look for JSON embedded in Next.js `__NEXT_DATA__` script tag (ChatGPT), or structured HTML elements for Grok; fallback to best-effort HTML parsing
   - Chat preview component with message bubbles, avatars, code block rendering (highlight.js or prism), LaTeX support (KaTeX)
   - Manual paste textarea fallback if parsing fails
   - Export options panel:
     - HTML: generate self-contained HTML string with inline styles, trigger download
     - PDF: window.print() with print-specific CSS injected
     - Word: use `docx` npm package to generate .docx blob
   - Full SEO: helmet meta tags, og:image, twitter:card, JSON-LD structured data
   - Responsive, works on mobile/tablet/desktop
4. Deploy
