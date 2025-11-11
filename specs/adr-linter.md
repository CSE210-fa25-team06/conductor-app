# Architecture Decision Record (ADR) Accessibility and Linting Choices

**ADR #:** 5  
**Title:** Accessibility and Linting Choice  
**Date:** 2025-11-09  
**Status:** [Proposed | Accepted | Rejected | Superseded by ADR-XXX]

---

## 1. Context
The Conductor application will be used by instructors, TAs, and students of varying technical backgrounds and abilities. To maintain code quality and accessibility standards, the project must adopt consistent linting and testing tools.  

Accessibility is important since the system must be usable by students registered with the Office for Students with Disabilities (OSD) and meet WCAG 2.1 guidelines. The linting setup should also prevent style and code inconsistencies to ensure maintainable and readable code across developers.  

Key constraints include:

- Accessibility compliance with WCAG 2.1 guidelines.  
- Integration with GitHub Actions for automated testing and linting.  
- Tools must be easy to configure, lightweight, and open-source.  
- Should support HTML, CSS, and JavaScript.  
- Must fit within the existing Node.js + Express workflow.  

---

## 2. Decision
The team decided to use the following tools for accessibility and code linting:

- **Pa11y** for accessibility testing.  
- **Stylelint** for CSS linting.  
- **ESLint** for JavaScript linting.  

These tools were selected because they are lightweight, easily integrated into CI/CD pipelines, and do not depend on any specific frontend framework. All three tools will run automatically through GitHub Actions before merges to maintain accessibility and style consistency.

---

## 3. Alternatives Considered
- **Option 1:** Axe Core for Accessibility  
Axe Core provides strong browser integration but requires more setup and is not as straightforward to automate in command-line CI environments. Pa11y offers simpler configuration for batch accessibility tests.  

- **Option 2:** Lighthouse  
Lighthouse offers broad performance and SEO checks but is heavier and less focused on accessibility-specific issues. It is better suited for production audits than regular CI checks.  

- **Option 3:** JSHint for JavaScript Linting  
JSHint is simpler but less configurable compared to ESLint. It lacks rule support and integration with most editors.  

- **Option 4:** Manual Accessibility Checks  
Manual testing ensures accuracy but is not scalable or consistent across all developers. Automated Pa11y checks enforce accessibility standards early in development.  

---

## 4. Consequences
**Positive Outcomes**
- Automated accessibility checks integrated into CI/CD workflows.  
- Consistent code formatting and reduced merge conflicts.  
- Improved maintainability through shared linting rules.  
- Early detection of accessibility and syntax errors before deployment.  

**Negative Outcomes**
- Slight increase in CI runtime due to additional linting steps.  
- Developers need to occasionally update rule configurations as the codebase evolves.  
- Pa11y may not detect all edge-case accessibility issues which will require periodic manual testing.  

**Impact on Other Systems**
- The CI/CD pipeline will trigger Pa11y, ESLint, and Stylelint on every pull request or push.  
- Failing linting or accessibility checks will block merges until fixed.  
- Documentation in the repository will include setup steps for running these tools locally.  

---

## 5. Implementation Notes
- **Pa11y** will test HTML output for WCAG 2.1 compliance.  
- **Stylelint** configuration file (`.stylelintrc`) will enforce consistent styling and responsive design rules.  
- **ESLint** configuration file (`.eslintrc.json`) will enforce variable naming, syntax, and formatting rules. 
- Configure GitHub Actions to automatically run all linters and accessibility tests before merging.  
- Periodic manual accessibility testing will supplement automated checks.  

---

## 6. References
- [Pa11y Documentation](https://pa11y.org/)  
- [ESLint Documentation](https://eslint.org/docs/latest/)  
- [Stylelint Documentation](https://stylelint.io/)  
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)  
- [ADR-1: Overall System Architecture](adr.md)
