# Architecture Decision Record (ADR) Frontend Technology Choices

**ADR #:** 2  
**Title:** Frontend Technology Choice  
**Date:** 20205-11-09  
**Status:** [Proposed | Accepted | Rejected | Superseded by ADR-XXX]

---

## 1. Context
The Conductor application requires a simple, accessible, and maintainable frontend for instructors and students to manage course coordination tasks such as attendance, journals, and group activities. The frontend must work reliably across devices, remain lightweight for quick load times, and avoid frameworks that might complicate setup or future maintenance.

Since this project will be reused by different course staff in future quarters, the chosen technology must require minimal technical onboarding and stay compatible with core web standards.

Key constraints include:

- Five-week development timeline.
- Requirement to use standard web technologies (HTML, CSS, JavaScript).
- Need for accessible and mobile-friendly design compliant with WCAG.
- Long-term maintainability by future instructors with limited technical expertise.
---

## 2. Decision
The frontend will use standard HTML, CSS, and vanilla JavaScript, with HTMX to introduce dynamic interactivity without a full client-side framework.

HTMX enables partial-page updates, form submissions, and asynchronous content loading through simple HTML attributes rather than large JavaScript bundles. This approach supports progressive enhancement, where the core functionality remains intact even if JavaScript is disabled.

---

## 3. Alternatives Considered
- **Option 1:** React Framework  
React offers reusable components and strong community support but introduces a large dependency chain. It increases bundle size, setup complexity, and maintenance cost. It also requires developers to understand JSX, build tooling, and state management, which may be excessive for a small instructional system meant for easy deployment. Also, not many of us are familiar with the React Framework.

- **Option 2:** Vue or Angular
Both provide structure and reactive data handling but share the same drawbacks as React—framework overhead, constant version updates, and steeper learning curves for non-experts. Also, not many of us are familiar with Vue or Angular.

- **Option 3:** Server-Rendered HTML Only (No HTMX)
Relying purely on server-rendered pages would simplify the architecture but reduce interactivity. Without asynchronous updates, every user action would trigger a full page reload, leading to a slower and less responsive experience.

---

## 4. Consequences
Positive Outcomes
- Lightweight and fast interface with minimal dependencies.
- Low learning curve for future instructors and maintainers.
- Easier debugging since all logic stays close to standard web behavior.
- HTMX keeps interactivity high without turning the app into a single-page application.

Negative Outcomes
- Some team members may need to learn HTMX syntax.
- Complex dynamic behavior (like real-time collaboration) would require more manual implementation compared to modern frameworks.

Impact on Other Systems
HTMX relies on server endpoints returning HTML fragments, so backend routes must support hypermedia responses. The design will follow MVC principles where the backend renders HTML snippets for updates instead of returning JSON APIs.
---

## 5. Implementation Notes
- Structure pages following MVC separation between templates and logic.
- Use HTMX attributes for partial-page updates.
- Maintain accessibility by ensuring semantic HTML and proper ARIA labels.
- Keep styling modular using CSS classes validated by Stylelint.
- Integrate Pa11y for accessibility testing and ESLint for JS linting in CI.

---

## 6. References
- [Design doc link](https://github.com/CSE210-fa25-team06/conductor-app/blob/main/specs/pitch/design-spec.pdf)
- [HTMX Documentation](https://htmx.org/docs/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.1)
- [ADR-1: Overall System Architecture](adr.md)