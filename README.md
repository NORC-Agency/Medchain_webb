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

Den publika kodbasen utgår nu från `app/`, `components/` och `lib/`.

Äldre arbetsfiler och interna strukturfiler hålls lokalt utanför den publika repo-versionen.

## Superenkelt lokalt arbetsflöde

Det här är den rekommenderade vardagsrutinen när du vill fortsätta utveckla sidan lokalt utan att deploya till Vercel.

### Första gången

```bash
cd "/Users/johansandersnas/Documents/New project"
npm install
```

### Varje gång du börjar jobba

```bash
cd "/Users/johansandersnas/Documents/New project"
git checkout johan-test
git pull origin johan-test
npm run dev:local
```

Öppna sedan:

```text
http://127.0.0.1:4173
```

### När du jobbar

- ändra filer lokalt
- spara
- uppdatera browsern om det behövs
- Next uppdaterar ofta sidan automatiskt direkt

### När du vill spara arbetet till GitHub

```bash
git add .
git commit -m "Beskriv ändringen"
git push origin johan-test
```

### När du vill ha en online-preview igen

- pusha till `johan-test`
- låt Vercel bygga en preview
- använd Vercel först när du vill testa den riktiga hostade versionen

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
