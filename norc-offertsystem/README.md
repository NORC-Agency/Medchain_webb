# NORC Offertsystem

Detta ar en forsta struktur for att skapa A4-offerter i NORCs grafiska maner.

## Mappar

- `assets/` innehaller logotyp och visuella resurser.
- `content/standard/` innehaller standardtexter som kan ateranvandas mellan projekt.
- `content/modules/` innehaller valbara offertmoduler, till exempel faser och scope.
- `projects/` innehaller projektdata for varje kundoffert.
- `output/` innehaller genererade Word-filer.
- `scripts/` innehaller generatorn.

## Generera exempeloffert

```bash
python3 scripts/build_offer.py projects/team-neusta.json output/team-neusta-offer.docx
```

Byt modulistan i projektfilen for att skapa en annan offert med samma grafiska grund.
