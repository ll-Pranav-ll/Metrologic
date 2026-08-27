# Verification Notes

The primary workspace routes were reviewed at desktop (1440 × 1100) and field-mobile (390 × 844) viewports. Dashboard, New Scan, and Scan History retain readable hierarchy and working responsive navigation at both breakpoints. The mobile scan station preserves the camera/upload actions, drag-and-drop intake surface, inspection notes field, and primary extraction action without horizontal overflow.

The live Scan History route was also opened in a browser session. Entering `Pulse` into the labelled brand search field reduced the visible record count from five to one and returned only the PulsePure inspection. This confirms the user-facing history filter is wired through the inspection repository.

The filtered PulsePure row was opened through its accessible row action, displaying the inspection drawer with all seven green rule cards, tabs, notes, evidence-region control, and report exports. Selecting **PDF Preview** generated an in-app embedded document viewer showing the official-style compliance report.

Primary navigation was then confirmed to reach **New Scan**, where the browser exposes named Camera and Upload actions, a keyboard-operable “Upload package-label images” intake surface, and the labelled opening-notes field. The scanner’s backend analyze and retained-report paths are additionally covered in the inspection-router contract suite.

Following the modal refactor, the live history register exposes each retained inspection as a named keyboard-operable row action, ready to open an accessible detail dialog.

The selected record now opens in a labelled modal dialog with the full inspection workspace inside its focus-managed boundary. Pressing **Escape** dismissed the dialog and returned to the inspection register, confirming keyboard-close behavior.

The JSON export action was triggered from the accessible dialog for a retained inspection, exercising the client-side inspection-summary download path. PDF rendering was separately exercised through the in-app preview, while report persistence is covered by the router contract test.

The scanner’s real multi-file input handler accepted a controlled PNG fixture (`label-fixture.png`) and reported it as a staged `image/png` file, exercising the client-side upload intake and preview state path without submitting user content to Gemini.

The staged fixture then appeared as an evidence thumbnail, incremented the scanner count to one of six images, and enabled the **Extract & inspect package** action.

The Camera control was exercised with a controlled `getUserMedia` denial. The scanner invoked the fallback capture-file input, confirming that a field device without live camera permission can continue through the image-picker path.

The retained inspection was reopened in the accessible dialog to complete the remaining CSV and generated-PDF export checks.

The CSV export action was triggered from the retained record. The **PDF report** action then generated the official-style document, displayed the success confirmation, triggered the download, and invoked the retained-report persistence path.

The live-capture workflow was exercised with a controlled `MediaStream` and synthetic canvas frame. The camera preview opened, **Capture frame** produced a staged `field-capture-…` image, and the scanner returned to the standard evidence-preview workflow without requiring physical camera hardware.

Keyboard verification confirmed that the scanner intake receives focus and that **Enter** invokes the same file-picker action as pointer upload. The history rows, Radix tabs, modal dialog with Escape close, close action, and keyboard-flag control use their labelled focusable controls and visible focus states; the dialog primitive supplies focus trapping while open.

The full retained register was reloaded with each inspection still exposed as a labelled row action before the focused evidence-flagging check.

Inside the accessible inspection dialog, the **Flag region** control was activated and changed to **Click image**, confirming that the evidence-flagging mode is a reachable, labelled control. Records with retained evidence expose the focusable image target and its Enter/Space flag placement behavior; seeded examples intentionally contain no image bytes.

A controlled `e2e-label.png` fixture was staged through the live scanner to execute the server-side Gemini extraction, storage, and evidence-flagging flow end to end.

The first live extraction check surfaced a provider deprecation response for `gemini-2.5-flash`. The server extraction service was immediately routed to the API-specified current Flash model, `gemini-3.6-flash`, before the workflow was rerun.

The server refresh reset the transient client staging state as expected; the controlled image fixture was prepared again for the current-model retry.

The restaged fixture was visible in the scanner with the extraction action enabled after the model-routing update.

The current-model live run completed successfully. Gemini returned the expected all-missing extraction for the blank controlled image, the rule engine produced seven failures and a non-compliant result, and the stored inspection displayed its retained evidence image through the application storage path.

With flag mode active on the live record, the retained evidence image became a focusable target carrying the descriptive “Add an evidence-region flag at the center of this image” label.

Pressing **Enter** on the focused live evidence image created one flagged visual region. Saving the inspection then exercised the persisted notes-and-flags update path for the retained record.

The save operation completed and the live inspection retained the flagged-region marker in its evidence view.

For keyboard navigation, the Dashboard control received focus and **Enter** changed the active route from New Scan to the Dashboard view.

The Scan History control was likewise focused and activated with **Enter**, routing successfully from the Dashboard to the retained inspection register.

The live retained-evidence inspection was opened in the accessible dialog for direct keyboard interaction testing across the evidence-detail tabs.

The focused **Summary** tab responded to **ArrowRight** by moving focus and activating **Extracted Data**, which displayed the structured declaration fields without pointer input.

From the tab row, **End** moved to and activated **PDF Preview**. The official-style report then generated and rendered inside the embedded document viewer, completing the keyboard tab activation check across the tab sequence.

The Dashboard’s sidebar **New Scan** control was then focused in preparation for its explicit Enter-key route activation check.

Pressing **Enter** on the focused New Scan control routed successfully from Dashboard to the field capture station.

The live inspection detail dialog was reopened with its persisted evidence marker before focusing and activating the Raw JSON tab by keyboard.

The Raw JSON tab received focus and **Enter** activated it, rendering the stored extraction and seven-rule evaluation payload without pointer input.

The automated suite verifies the Gemini credential, seven-rule evaluator, seeded repository filtering and dashboard metrics, plus tRPC contracts for list, get, analyze, update-notes, and saved-report procedures. The interface has visible focus treatment for keyboard-operable upload intake, inspection rows, evidence-region flagging, controls, tabs, and dismiss actions.

## Mobile bug trace

The scanner previously assigned the camera stream through a `setTimeout(0)` after toggling camera modal state, without explicitly attaching and playing the stream after the video element mounted. Mobile autoplay policies also require a muted inline video for reliable preview playback. The fix will attach the stream in a camera-open effect, set `muted` and `playsInline`, and call `play()` defensively.

The record detail dialog already had an overflow rule, but its content was the direct child of a grid-based dialog surface. The fix will make the dialog shell clip overflow and give an explicit inner wrapper full vertical scrolling with touch overscroll containment.

The refreshed history detail dialog now renders with an explicit inner `overflow-y-auto` surface. A live retained record opened successfully and the dialog showed its own vertical scrollbar, confirming that the record card can be scrolled independently on constrained viewports.

Post-fix camera verification passed in the live scanner: the authorized synthetic media stream was attached to the mounted video element (`hasStream: true`), with `muted: true`, `playsInline: true`, and `autoplay: true`. The synthetic stream intentionally contained no tracks/frames, so its measured dimensions remained 0; this is expected for the hardware-free test and does not represent the prior lifecycle bug.

A reproducible browser measurement of the open inspection detail found `overflowY: auto`, `overscrollBehavior: contain`, `clientHeight: 1060`, and `scrollHeight: 1207`, with `isScrollable: true`. This confirms the card content now has an independent vertical scroll region rather than being clipped by the dialog surface.

A second post-fix camera check used a canvas-backed stream with one active video track and a 640×480 visible color-bar frame. The live camera dialog opened successfully; the subsequent readiness measurement will confirm whether the browser exposed frame metadata to the video element.

The canvas-backed stream exposed one active video track, but the sandbox browser’s media pipeline did not surface frame metadata (`readyState: 0`, `videoWidth: 0`, `videoHeight: 0`). This environment limitation prevents a truthful pixel-level non-black preview claim. The production fix remains wired for real device streams; physical-phone confirmation is still recommended because only a device camera can provide that final hardware-specific proof.

The user subsequently confirmed that the repaired camera preview works on their phone, completing the outstanding physical-device verification.

## Vercel deployment preparation

Vercel now has a server-side `GEMINI_API_KEY` secret configured independently for its Production and Preview environments. The credential remains outside the client bundle and repository. The new Vercel build command emits the Vite single-page application to `dist`, while the `api/[...path].ts` serverless entry exports the same Express app factory used in local development.

The external-deployment build completed successfully, TypeScript validation passed, and Vitest passed all seven test files and thirteen tests. The added HTTP-level regression test starts the exported Express app and confirms that `GET /api/trpc/system.health` returns the public `{ ok: true }` response through the Vercel-compatible API path.

Persistent inspection creation, evidence uploads, generated-report retention, and historical records still require infrastructure that is specific to the original Manus runtime: an external MySQL/TiDB-compatible `DATABASE_URL` and a replacement for the Forge-based object storage backend. These are not configured in Vercel yet, so a deployed build can truthfully be verified only for static UI delivery and public API routing until the durable services are supplied and migrated.

The first Vercel build of the Git-triggered configuration correctly ran the Vite build but could not find the configured repository-level `dist` output directory. Vite had resolved the relative path below its `client` root. The Vercel-only Vite configuration now resolves `dist` from the repository root. A clean local rebuild confirmed that `dist/index.html` exists at that exact location; TypeScript and all thirteen Vitest tests still pass. The external Vercel deployment must now be retried from this corrected revision.

The corrected external build reached `READY` and the deployment root returned `200 OK` with `text/html`, confirming that it now serves the Vite application rather than the earlier bundled server JavaScript. The initial API request was instead rewritten to the SPA fallback and rendered the application’s 404 page, so Vercel routing was refined to route `/api/:path*` to the catch-all function before the SPA rewrite. The clean local Vercel build, TypeScript validation, and expanded Vitest suite now pass with fourteen tests; production API re-verification is pending the new Git-triggered deployment.

The API-first production deployment reached `READY`, but its first health request invoked the function and returned Vercel `500 FUNCTION_INVOCATION_FAILED`. This proves the path now reaches the serverless runtime while an import-time or startup dependency still needs to be isolated. The authenticated Vercel request-specific log view was opened for diagnosis; the project’s grouped runtime-error endpoint had not yet indexed a matching error.

The request-specific Vercel log identified the failure as `ERR_MODULE_NOT_FOUND` for the workspace import of `server/app` from the compiled API route. The Vercel build now bundles `server/app.ts` to `server/_generated/vercel-app.mjs` with internal dependencies included, while retaining runtime packages as managed dependencies. The API entry imports that generated ESM bundle. A clean local Vercel build produced both the nonempty handler bundle and repository-level `dist/index.html`; TypeScript and all fourteen Vitest tests pass. The repaired bundle must still be deployed and exercised in Vercel.
