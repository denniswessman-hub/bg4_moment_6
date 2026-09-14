# TBL 5 § och 7 § – interaktiv presentation

En mobilanpassad klassrumspresentation för Moment 6, Basgrupp 4. Webbplatsen är byggd med vanlig HTML, CSS och JavaScript och kan publiceras direkt med GitHub Pages.

## Innehåll

- tolv presentationsbilder och ett frivilligt test direkt på bild 12
- hela lagtexten i 5 och 7 §§, öppningsbara ordförklaringar och förarbeten
- stegvis genomgång av 5 och 7 §§ trafikbrottslagen
- praxisjämförelse
- sju testfrågor med förklaringar, poäng och återställning under ”Testa klassen” på sammanfattningen
- separat presentatörsfönster med talmanus och timer
- flyttbar källpanel
- tangentbordsstyrning, mobilanpassning och offline-stöd efter första besöket

## Testa lokalt

Webbplatsen kan öppnas genom att dubbelklicka på `index.html`. För att testa offline-stödet och presentatörssynkroniseringen fullt ut behöver filerna visas genom en lokal webbserver eller från GitHub Pages.

## Tangenter under presentationen

- `Högerpil`, `Page Down` eller `Mellanslag`: nästa bild
- `Vänsterpil` eller `Page Up`: föregående bild
- `F`: helskärm
- `S`: källor
- `R`: återställ alla svar och öppnade förklaringar

Knappen **Talmanus** öppnar ett separat presentatörsfönster. Lägg huvudfönstret på projektorn och behåll talmanusfönstret på den egna skärmen. Fönstren synkroniseras när de har samma webbadress och webbläsarprofil.

## Publicera i ett nytt GitHub-repo

1. Skapa ett tomt repo på GitHub.
2. Ladda upp innehållet i denna mapp till repots rot. `index.html` ska alltså ligga direkt i repot.
3. Öppna **Settings → Pages**.
4. Välj **Deploy from a branch**, grenen `main` och mappen `/ (root)`.
5. Spara och vänta tills GitHub visar den publicerade adressen.
6. Öppna adressen på både dator och mobil. Kontrollera presentation, talmanus, källor och delningsknapp.

Filen `.nojekyll` ska följa med. Den gör att GitHub Pages serverar webbplatsen som vanliga statiska filer.

## Viktigt om innehållet

Den ursprungliga PowerPoint-filen ingår inte i webbpaketet och förblir oförändrad i kursmappen. Webbplatsens rättsliga underlag kontrollerades mot de angivna webbkällorna den 9 september 2026. Materialet är avsett för undervisning och ersätter inte en bedömning i ett enskilt ärende.

## Versionsuppgift

Version 1.4.0

Seminarieversion med 12 bilder. Hela 5 och 7 §§ följs av öppningsbara ordförklaringar och rättsfall. Testet är en del av bild 12, inte en extra bild eller ett popupfönster. Talmanuset följer samma ordning. Anpassa tempot till lärarens tidsram.

Basgrupp 4: Johan Stensson, Fredrik Karlsson, Vegard Lein och Dennis Vessman.

Återställ svar återställer samtliga frågor, poäng, facit och öppnade förklaringar utan att byta bild. Knappen finns även i talmanusfönstret. R gör samma sak. Börja om återställer svaren, döljer klasstestet och går till startbilden. Talmanuset har tidsförslag, muntliga formuleringar och separata instruktioner för varje bild.

Vid publicering ska versionen uppdateras i sidans resurslänkar, versionsmarkören, offline-stödet och kontrollskriptet. De versionsbundna länkarna hindrar ny HTML från att använda äldre sparad JavaScript eller CSS. Kör `node validate.mjs` och webbläsartesterna i `tests/` före publicering.
# Version 1.3.0

Förstasidan använder BG4–OLDBOYS-bilden. Vid hela lagtexten för 7 § finns en utfällbar förklaring av PL 24 a–24 d §§, med källa och talstöd. Hänvisningen hör till 7 §, inte 5 §. Bilden ingår i offline-stödet.
# Version 1.3.1

På BG4:s begäran har tidigare bild 5, 11 och 15 tagits bort ur presentationen. De 12 återstående bilderna och talmanuset följer samma ordning. Avslutningen hänvisar inte längre till den borttagna övningen.
