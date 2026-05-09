# PawMind — Notion workspace blueprint

Create **four Notion databases** and share each with your internal integration (same token as `NOTION_TOKEN`).

Property names below match what PawMind expects out of the box. You can rename columns in Notion — then adjust ingest mappings in `apps/pawmind-api/src/pawmind_api/main.py` if needed.

## 1. Dogs

| Property | Type |
|----------|------|
| Name | Title |
| Breed | Text |
| Age | Number |
| Weight | Number |
| Allergies | Text |
| Chronic Conditions | Text |
| Profile Image | Files & media |

## 2. Medical Records

| Property | Type |
|----------|------|
| Name | Title |
| Diagnosis | Text |
| Symptoms | Text |
| Treatment | Text |
| Vet Notes | Text |
| Date | Date |
| Body Part | Text (e.g. `left_knee`, `skin`, `spine`) |
| Severity | Select (`mild`, `moderate`, `high`, `severe`) |
| Status | Select (`active`, `resolved`) |
| Medications | Text |

## 3. Medications

| Property | Type |
|----------|------|
| Medication Name | Title |
| Dosage | Text |
| Frequency | Text |
| Start Date | Date |
| End Date | Date |

## 4. Consultations

| Property | Type |
|----------|------|
| Consultation Date | Title or Date (title works for quick demos) |
| Vet Name | Text |
| Notes | Text |
| Follow Up Required | Checkbox |

Copy each database ID from its URL into `apps/pawmind-api/.env` as documented in `.env.example`.

After seeding rows, run **Sync → Qdrant** from the PawMind dashboard or `POST /sync/notion-to-qdrant`.
