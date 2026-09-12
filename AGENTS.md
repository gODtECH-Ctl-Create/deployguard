# FORGE Agent Contract

You are operating inside a repository that follows gODtECH FORGE.

## First principles

- Understand the user's actual outcome before changing code.
- Inspect the repository and relevant project context before making architectural decisions.
- Do not start implementing merely because a request contains a feature description.
- Identify missing information, but do not ask for information that can be safely inferred, inspected, or researched.
- Challenge unnecessary scope, weak assumptions, duplicated functionality, and over-engineering.
- Prefer the smallest robust solution that satisfies the real requirement.
- Use model reasoning for judgment; use deterministic tooling for facts, validation, and repeatable checks.

## FORGE system

The `.forge/` directory contains the installed framework and project-specific operating layer. In the FORGE source repository, the canonical bundled copy lives at `forge/framework/.forge/`; consuming projects receive it as `.forge/`. Read only the relevant workflow, intelligence modules, policies, context, decisions, and verification guidance for the task.

Never modify FORGE's core rules simply to make a task easier. Project context may evolve; framework guardrails do not get weakened to bypass quality requirements.

## Before implementation

1. Read the relevant `.forge/workflows/` procedure.
2. Read only the `.forge/intelligence/` modules needed for the task.
3. Read applicable `.forge/policies/`, especially Git/delivery, AI efficiency, and provenance rules.
4. Inspect existing project structure, dependencies, configuration, and conventions.
5. Determine the required product, market, architecture, design, security, quality, deployment, and documentation context.
6. If the project is entering planning or architecture and the README does not yet exist, initialize it using `.forge/workflows/README-GENERATION.md` and the appropriate `.forge/templates/readme/` template.
7. Record material decisions, assumptions, and unresolved risks in `.forge/`.

## Git and delivery

- Treat `main` and other protected branches as non-direct-write branches.
- Meaningful work must follow `.forge/workflows/GIT.md`.
- Create or link an issue when the work is material.
- Use a dedicated branch for implementation.
- Do not force-push shared history or bypass repository safeguards.
- Verify before opening a pull request and follow the repository's normal review and merge process.

## AI efficiency

- Follow `.forge/policies/AI-EFFICIENCY.md`.
- Reuse verified project context and prior decisions.
- Prefer deterministic tools, local inspection, and executable checks before model reasoning.
- Load modules selectively and avoid repeating unchanged analysis.
- Do not save credits by weakening material quality, security, or verification requirements.

## Product README rule

The project README is created early and maintained throughout the lifecycle. It must be written for the actual product, not copied from another repository or treated as a generic starter document.

The agent must:

- derive the README from verified project context and the real repository;
- select the appropriate README pattern for the product type;
- give the product its own identity, narrative, visual language, architecture, capabilities, and status;
- add required gODtECH FORGE provenance without replacing the product's own branding;
- update the README when meaningful product, architecture, design, security, deployment, or status changes occur;
- never invent features, commands, metrics, links, assets, or production claims.

## During implementation

- Preserve existing behavior unless a change is intentional.
- Fix root causes rather than symptoms.
- Avoid unnecessary dependencies and architectural complexity.
- Treat authentication, authorization, secrets, user data, and external inputs as security-sensitive.
- Keep interfaces, types, migrations, documentation, README, project context, and provenance consistent with implementation.

## Before completion

Do not declare work complete until the applicable checks have been run. At minimum, evaluate:

- linting
- type checking
- tests
- production build
- security checks
- accessibility and responsive behavior for user-facing interfaces
- visual verification when UI changes are involved
- README accuracy when product-facing or documentation changes are involved

If a required check cannot run, state that explicitly and identify why.

## Communication

Be direct. Report what changed, what was verified, what remains uncertain, material trade-offs, and any blocked checks. Do not hide failures behind confident wording.
