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

## Starta sidan lokalt

Dokumentdelen använder nu en lokal backend för uppladdning, förhandsvisning och borttagning av filer.

Kör därför sidan med:

```bash
MEDCHAIN_ADMIN_PASSWORD="välj-ett-lösenord" python3 scripts/medchain_server.py
```

Öppna sedan:

```text
http://127.0.0.1:4173
```

Om sidan öppnas som `file:///...` fungerar inte backend-funktionerna för dokument.

## Adminläge för dokument

- sidan är öppen för vanliga besökare
- preview och download är publika
- upload och remove kräver admin-login

Adminlösenordet styrs av miljövariabeln `MEDCHAIN_ADMIN_PASSWORD`.

Om du inte sätter något lösenord används standardvärdet:

```text
medchain-admin
```

Det är bara tänkt för lokal utveckling och bör bytas innan riktig drift.
