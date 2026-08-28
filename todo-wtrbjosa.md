# Project TODO

- [x] Audit the existing Metrologic screens, components, and styling tokens before redesigning.
- [x] Translate the To-Do List app’s design philosophy into a Metrologic-specific visual system: restrained palette, strong whitespace, crisp surfaces, and expressive accent color.
- [x] Rework the main Metrologic app shell and navigation for a calmer, more legible inspection workflow.
- [x] Redesign inspection input, result, and history surfaces without changing their core behavior.
- [x] Add intentional micro-interactions and animated transitions inspired by the reference app, with reduced-motion support.
- [x] Preserve and verify authentication, inspection actions, data loading, and existing routes.
- [x] Validate responsive behavior at desktop and mobile breakpoints.
- [x] Add or update Vitest coverage for the changed UI-supporting behavior where applicable.
- [x] Run type checking, tests, and visual verification; fix any regressions.
- [x] Save a checkpoint with all completed items marked as done.
- [x] Verify the authentication flow still works after the UI overhaul, or document why auth is not part of the current user-facing flow.
- [x] Browser-verify key inspection actions after the redesign: analyze scan, save notes, open history detail via deep link, and export actions.
- [x] Capture and review the dashboard route at mobile width and fix any responsive issues found.
- [x] Harden scan-history deep links to hydrate the selected record from the browser query string.
- [x] Browser-verify the full analyze-scan workflow by staging at least one image in `/scan` and confirming the inspection result renders after mutation success.
- [x] Browser-verify at least one export completes successfully and document the observed result in the session notes.
