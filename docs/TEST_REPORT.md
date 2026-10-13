# Validierung der Version 1.0.0

Die installierbare Home-Assistant-Karte wurde im Chromium-Browser bei 320, 390 und 768 Pixeln geprüft. Die Tests liefen gegen `preview.html` mit dem eingebetteten, fertig gebauten Karten-Code und der echten geografischen Weltgeometrie.

Bestanden:

- Ländergeometrie vorhanden; kein horizontaler Seitenüberlauf bei den geprüften Breiten.
- Kartenebenen filtern Messpunkte und Ausbrüche korrekt.
- Wechsel von Welt auf Schweiz und Balkan.
- Leerer Ausschnitt zeigt keine Details aus einer anderen Region.
- Auswahl eines Berichts aktualisiert die Detailansicht.
- Die erweitere Liste enthält alle 26 gekennzeichneten Beispiele.
- Ein normaler Home-Assistant-State-Update setzt die gewählte Region nicht zurück.
- Eigener Titel, `max_items` und `show_clock` funktionieren.
- Ungültige Konfigurationen und `demo: false` werden abgewiesen.
- Zwei Karten teilen keine Auswahlzustände; Entfernen und erneutes Einfügen funktioniert.

Grenzen: Keine Prüfung in einer laufenden HAOS-Installation, keine Live-Daten und kein Test gegen einen privaten HACS-Download. `tests/card-browser.cjs` ist enthalten. Im Offline-Browser werden vereinfachte Symbolzeichen benutzt; Home Assistant stellt native `ha-icon`-Symbole dar.
