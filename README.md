# MedChain Webb

Detta repo innehåller arbetsversionen av MedChain-webben.

## Så jobbar vi

- `main` är vår stabila huvudversion.
- Johan jobbar i branchen `johan-test`.
- Kollegor jobbar i egna separata brancher.
- Vi jobbar inte direkt i `main`.
- När något känns klart gör vi en `Pull Request` till `main`.

## Branch-rutin

- Behåll `main` ren och stabil.
- Gör löpande arbete i din egen branch.
- Pusha ofta så att arbetet finns sparat i GitHub.
- Två personer ska inte jobba i samma branch samtidigt.

## Hur vi använder Issues

- Issues används som en enkel att-göra-lista.
- En issue kan vara en förbättring, ett problem eller en ny funktion.
- Vi behöver inte skapa en ny branch för varje issue.
- Vi kan lösa flera mindre issues i samma personliga branch om det är enklare.

## Hur vi använder Pull Requests

- När en ändring är redo att gå in i huvudversionen öppnar vi en `Pull Request`.
- Pull Requesten går från din branch till `main`.
- Där kan vi se exakt vad som ändrats innan vi slår ihop det.
- När ändringen är godkänd mergar vi den till `main`.

## Enkel arbetsmodell

1. Skapa eller välj en issue.
2. Jobba i din egen branch.
3. Pusha ändringarna till GitHub.
4. Öppna en Pull Request till `main` när arbetet är redo.
5. Merga till `main` när ändringen är godkänd.

## Målet

Vi vill hålla arbetssättet så enkelt som möjligt:

- fasta personliga brancher
- `main` som stabil version
- issues för planering
- pull requests för att föra in färdiga ändringar

## Filstruktur-agent

Projektet har en enkel lokal agentfunktion för att hålla arbetsfilerna begripliga.

Kör:

```bash
python3 scripts/structure_work_files.py
```

Scriptet skapar `WORKSPACE_STRUCTURE.md` med en översikt över filer, kategorier och konkreta förslag. Det flyttar eller tar inte bort något automatiskt.

Agentinstruktionen finns i `AGENTS.md`.

## React-migrering

Projektet håller nu på att migreras från ren HTML/CSS/JavaScript till `Next.js` och React.

Den nya strukturen ligger i:

- `app/`: Next.js App Router
- `components/`: React-komponenter för sidan
- `lib/`: admin- och uppladdningslogik för Next API-rutter

De gamla filerna `index.html`, `styles.css` och `scripts/medchain_server.py` ligger kvar som referens under övergången.

## Starta den nya Next-versionen lokalt

Installera först beroenden:

```bash
npm install
```

Starta sedan utvecklingsservern:

```bash
MEDCHAIN_ADMIN_PASSWORD="välj-ett-lösenord" npm run dev
```

Öppna därefter:

```text
http://127.0.0.1:3000
```

Om du i stället vill köra den äldre lokala prototypversionen med Python-server finns den kvar:

```bash
MEDCHAIN_ADMIN_PASSWORD="välj-ett-lösenord" python3 scripts/medchain_server.py
```

## Adminläge för dokument och use cases

- sidan är öppen för vanliga besökare
- preview och download är publika
- upload och remove kräver admin-login

Adminlösenordet styrs av miljövariabeln `MEDCHAIN_ADMIN_PASSWORD`.

Om du inte sätter något lösenord används standardvärdet:

```text
medchain-admin
```

Det är bara tänkt för lokal utveckling och bör bytas innan riktig drift.

## Nästa steg för Vercel

Den nya Next.js-strukturen är gjord för att kunna publiceras på Vercel.

Lagringslagret är nu förberett för två lägen:

- lokal utveckling utan `BLOB_READ_WRITE_TOKEN`
- Vercel Blob när `BLOB_READ_WRITE_TOKEN` finns satt

När `BLOB_READ_WRITE_TOKEN` är tillgänglig använder `lib/storage.ts`:

- `@vercel/blob` för filuppladdning
- blobbaserad manifestlagring för `documents` och `use-cases`
- publika blob-URL:er för preview och download

För lokal utveckling utan token används fortfarande `uploads/` som fallback.

### För att köra mot Vercel Blob

1. Skapa en `public` Blob store i Vercel-projektet
2. Se till att `BLOB_READ_WRITE_TOKEN` finns som miljövariabel
3. Starta appen som vanligt med `npm run dev` eller deploya till Vercel

## Första deployen till Vercel

Projektet är nu förberett för import i Vercel:

- `Next.js` identifieras automatiskt
- `Node 22` är deklarerat i `package.json`
- `.env.example` visar vilka miljövariabler som behövs

Gör så här:

1. Gå till Vercel Dashboard
2. Välj `Add New Project`
3. Importera GitHub-repot `NORC-Agency/Medchain_webb`
4. Välj branchen du vill deploya från, troligen `johan-test` först
5. Lägg in miljövariablerna:
   - `MEDCHAIN_ADMIN_PASSWORD`
   - `BLOB_READ_WRITE_TOKEN`
6. Skapa först en `public` Blob store i projektets `Storage`-flik om du inte redan gjort det
7. Klicka `Deploy`

När projektet väl finns i Vercel blir nästa deploy mycket enklare:

- push till vald branch ger preview deploys
- merge till `main` kan användas för produktion
