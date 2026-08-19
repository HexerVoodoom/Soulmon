# Threat Model — <product / feature>

> Produced by `security-architect`. **Standard:** OWASP ASVS L`<1|2|3>` · STRIDE + LINDDUN ·
> LGPD/GDPR by design. Keep it specific to *this* system — a generic checklist is not a threat model.
> Status: `draft | reviewed | accepted` · Owner: `<name>` · Last reviewed: `<date>`

## 1. Scope & data classification

- **System / feature under model:** `<what, and its boundary — what's in vs out>`
- **Compliance regime in scope:** `LGPD (Lei 13.709/2018)` `[+ GDPR / sector rules if applicable]`
- **Data handled** (classify every store & flow):

| Data element | Classification (public / internal / confidential / **regulated-PII**) | Lawful basis (LGPD) | Retention | Minimized? |
| --- | --- | --- | --- | --- |
| `<e.g. e-mail>` | regulated-PII | `<consent / contract / legit. interest>` | `<period>` | `<y/n — why>` |

## 2. Architecture & trust boundaries

- **Data-flow diagram:** `<link or ASCII — entry points, processes, data stores, external deps>`
- **Trust boundaries:** `<where trust level changes — client↔API, service↔service, app↔third-party>`
- **Actors:** `<legitimate roles>` + **abuse case:** `<the malicious/over-privileged actor>`
- **Assets to protect:** `<credentials, PII, tenant data, money, availability, integrity of X>`

## 3. Threats (STRIDE per boundary)

| # | Boundary / asset | STRIDE class | Threat (specific) | Likelihood × Impact | Control (see §5) | Residual |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `<API edge>` | Spoofing | `<...>` | `<H/M/L × H/M/L>` | `C1` | `<low/accepted>` |
| T2 | `<data store>` | Tampering | `<...>` | | | |
| T3 | | Repudiation | | | | |
| T4 | | Info disclosure | | | | |
| T5 | | Denial of service | | | | |
| T6 | | Elevation of privilege | | | | |

## 4. Privacy threats (LINDDUN) & privacy-by-design

- **Linkability / Identifiability / Non-repudiation / Detectability / Disclosure / Unawareness / Non-compliance:** `<the ones that apply, per data element>`
- **Subject-rights (DSR) flows:** access · rectification · deletion · portability — `<how each is served>`
- **Data that should not be collected at all:** `<call it out>`

## 5. Controls & ASVS mapping

| ID | Control | Standard ref (ASVS §, ISO 27001 Annex A, SOC 2 TSC) | Owner | Status |
| --- | --- | --- | --- | --- |
| C1 | `<e.g. OIDC + short-lived tokens, MFA for admin>` | `ASVS V2 / A.9` | `<eng>` | `<planned/done>` |
| C2 | `<encryption at rest + KMS key rotation>` | `ASVS V6 / A.10` | | |
| C3 | `<input validation + output encoding>` | `ASVS V5` | | |
| C4 | `<audit logging + tamper-evidence>` | `ASVS V7 / SOC2 CC7>` | | |
| C5 | `<tenant isolation / authЗ model>` | `ASVS V4` | | |

- **Target ASVS level:** `L<1|2|3>` — rationale: `<data sensitivity / risk>`.
- **Secrets:** managed via `<vault/secrets manager>`; **none in code or git history** (assert).

## 6. Supply chain & SDLC gates

- **SBOM:** `<generated how>` · **Dependencies:** pinned + scanned (`<tool>`) · **Provenance:** `<SLSA level>`
- **CI security gates (fail-closed):** secret scan · dependency/SCA scan · SAST · `<other>` — build **fails** on criticals.
- **NIST SSDF alignment:** `<the practices covered>`

## 7. Residual-risk register (what we're accepting, explicitly)

| Risk | Why accepted (rationale) | Owner | Revisit when |
| --- | --- | --- | --- |
| `<...>` | `<cost / stage / low likelihood>` | `<name>` | `<trigger>` |

## 8. Verdict

- **Ship / don't-ship:** `<call>` — the top residual risks are `<...>`.
- **Single highest-leverage control** (most blast-radius reduction): `<...>`.
- **Handoffs:** `qa-sweeper` tests controls `C<..>`; engineers implement `C<..>`; revisit at `<phase>`.
