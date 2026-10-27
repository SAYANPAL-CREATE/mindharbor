# MindHarbor — Guided Mental Wellbeing Web App

A polished, responsive, local-first mental wellbeing website created with **HTML, CSS and vanilla JavaScript**. No frameworks, build tools, cloud account or paid API are needed. Suitable for static deployment using **GitHub Pages**.

## Important scope

**MindHarbor is a research/education prototype, not a clinician, generative AI system, medical device, or emergency service.** Its conversational assistant, Mindy, uses **local rule-based emotion keyword matching** and guided prompts. It does not diagnose mental disorders or infer probabilities from user text. It does not use or claim a trained predictive machine learning model.

The depression screening uses the adult **PHQ-9**, the anxiety screening uses the adult **GAD-7**, and the four stress prompts are **original and unvalidated**. Displayed percentages are normalized point totals (e.g., PHQ-9 9/27 = 33%), **not the chance of depression or anxiety**. Consultation guidance is conservative and never guarantees that someone is safe or needs no help. PHQ-9 item nine or possible safety statements trigger immediate support messaging.

This prototype is intended for adults (18+). Content in English only. Before providing it to real patients, consult licensed mental health professionals, conduct formal usability/security/accessibility and clinical validation, review local law and privacy obligations, and create real clinical escalation and incident response processes. Static hosting **cannot** supply professional monitoring, real-time triage, or reliable detection of suicidal ideation.

## What's included

- A landing overview, fully functional guided chat interface, assessment and results pages.
- Structured PHQ-9 (9), GAD-7 (7), exploratory stress (4) and daily-life-impact (1) questions.
- Three scored indicators with severity descriptors, careful interpretation, professional support guidance, and individual self-care suggestions.
- Live assessment progress, keyboard-accessible controls, mobile responsive layout, and dark mode.
- Breathing timer (4–4–6) and interactive 5–4–3–2–1 grounding tool.
- Print / **Save as PDF** via browser print dialog and JSON export.
- On-device privacy by default: no chat text is persisted and **reports are saved only if users explicitly opt in**. Local storage is unencrypted; do not use this option on shared devices.
- India helplines: **112** for emergencies and **Tele-MANAS 14416** for free 24/7 mental-health support.
- No server, tracking analytics, external fonts or API credentials.

## Preview locally

For quickest local preview, open `index.html` in your browser. Everything runs without an internet connection. Alternatively:

```bash
cd mindharbor-website
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy using GitHub Pages

1. Create a **new GitHub repository**, e.g. `mindharbor`.
2. Upload the files **inside this folder** (`index.html`, `styles.css`, `logic.js`, `app.js`, `favicon.svg`, and so forth) to the **repository root**.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, with branch **main** and folder **/(root)**. Save.
5. Visit the GitHub Pages URL shown in the Pages settings. Example: `https://YOUR-USERNAME.github.io/mindharbor/`.

To develop a true language-model assistant later, use a separate secure backend with a protected provider API key, clinically reviewed prompting and safety controls, verified consent, appropriate security, data retention policies, and crisis escalation. **Never place an API key in `app.js` or the HTML**, and don't assume that model-generated advice is medically validated. GitHub Pages hosts only the static frontend; it cannot securely keep backend secrets.

## Preview screenshots

The `previews/` folder contains screenshots of the home page, chat, completed report, care toolkit, and mobile layout. These are sample interface views, not medical or patient data.

## Files

| File | Role |
| --- | --- |
| `index.html` | Semantic layout, pages, panels and help contacts |
| `styles.css` | Visual design, mobile and print layouts, dark theme |
| `logic.js` | Structured question definitions, scoring and local text patterns |
| `app.js` | Chat flow, UI interaction, report rendering, privacy and exercises |
| `favicon.svg` | Brand icon |
| `tests/test-scoring.js` | Automated scoring and edge case checks with Node.js |

## Scoring references and limitations

- PHQ-9 scoring ranges: 0–4 minimal; 5–9 mild; 10–14 moderate; 15–19 moderately severe; 20–27 severe. A positive response to the self-harm item warrants prompt human follow-up, independently of other scores.
- GAD-7 ranges: 0–4 minimal; 5–9 mild; 10–14 moderate; 15–21 severe.
- Original stress check: 0–3 lower, 4–7 middle, 8–12 higher **exploratory range**. These are *display categories only, not clinical cut-offs*.
- For each: display percentage = `round(100 × raw score / maximum score)`. No diagnostic probabilities or clinical performance are claimed.
- Consultation guidance also considers daily functioning and safety flags. It is a supportive prompt, not a clinical decision.
- See: [American Thoracic Society — Anxiety & Depression Outcome Measures](https://site.thoracic.org/assemblies/pr/outcome-measures/anxiety-and-depression-outcome-measures), [PHQ and GAD licensing](https://support.apple.com/en-ae/105070), and [Government of India — Tele-MANAS](https://dghs.mohfw.gov.in/national-mental-health-programme.php).

The initial implementation and test data are **not** evidence of clinical predictive accuracy. Prospective validation using appropriate ethics and consent is necessary before clinical claims.

## Data and privacy

- Free-text messages are processed in browser memory and cleared on refresh.
- Screen results remain in memory unless users switch on optional **Remember completed reports**.
- Optional local saving writes only numeric answer codes, a possible safety flag and completion time to the browser's `localStorage` (not full chat transcripts); this is **not encrypted**.
- JSON exports contain sensitive health-related personal information; store carefully.
- The site does not share your inputs with the creator; however, the static hosting service may have its usual infrastructure logs. This code does not implement telemetry.
- If future versions add third-party AI, authentication, clinician access or hosted patient storage, this privacy description must be revised and the implementation thoroughly assessed.

## Run tests

Requires Node.js 18+:

```bash
node --test tests/test-scoring.js
```

## License

Custom MindHarbor site code is provided as a prototype; you may modify it for your project. PHQ-9 and GAD-7 remain their original instruments with their respective attributions. Verify jurisdiction-specific clinical, accessibility, privacy, medical-device and questionnaire licensing obligations before live patient use.
