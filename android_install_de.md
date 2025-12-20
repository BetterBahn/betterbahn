# Betterbahn auf Android – Benutzeranleitung

Diese Anleitung erklärt, wie Betterbahn auf einem Android-Gerät installiert, gestartet und beendet wird.
Es sind **keine Linux- oder Technikkenntnisse** erforderlich.

---

## Voraussetzungen

* Android-Smartphone oder Tablet
* Stabile Internetverbindung
* Mindestens **5 GB freier Speicher** (10GB empfohlen)
* **Termux** (empfohlen aus **[F-Droid](https://f-droid.org/)** installiert)

Empfohlen:

* **Termux:Widget** (für ein Startsymbol auf dem Homescreen)

---

## Android-Berechtigung

Damit das Homebilschirm Widget funktioniert, benötigt **Termux** eine zusätzliche Berechtigung.

### Berechtigung erteilen

1. **Android-Einstellungen** öffnen
2. **Apps → Termux** auswählen
3. **„Über andere Apps einblenden“** (oder ähnlich benannt)
4. **Erlauben / Aktivieren**

Ohne diese Berechtigung Funktioniert das Homescreen Widget nicht.

---

## Installation von Betterbahn

1. **Termux öffnen**

2. **Installationsbefehl eingeben**
   (genau so, alles in einer Zeile):

   ```sh
   curl -LO  https://raw.githubusercontent.com/BetterBahn/betterbahn/refs/heads/main/termux-installer.sh && chmod +x termux-installer.sh && ./termux-installer.sh
   ```

3. **Hinweise lesen**

   * Mit **ENTER** fortfahren
   * Mit **STRG+C** abbrechen

4. **Warten**
   Die Installation kann mehrere Minuten dauern (Auf einem Pixel 9 brauchte eine Installation 10-20min).
   Das Gerät währenddessen **nicht sperren**.

Nach Abschluss erscheint eine Erfolgsmeldung.

---

## Betterbahn starten

### Variante A: Start über Termux

1. Termux öffnen
2. Startbefehl ausführen:

   ```sh
   ~/start-betterbahn.sh
   ```
3. Nach wenigen Sekunden öffnet sich automatisch der Browser mit Betterbahn.

---

### Variante B: Start über Homescreen (empfohlen)

1. **Termux:Widget installieren**
   (gleiche Quelle wie Termux, z. B. F-Droid)

2. Homescreen **lange gedrückt halten**

3. **Widgets → Termux:Widget** auswählen

4. **Betterbahn** auswählen

Ab jetzt reicht **ein Fingertipp** auf dem Homescreen.

Sollte eine fehlermeldung kommen mit Listen on ... Failed dann ist betterbahn bereits gestartet und kann über http://localhost:3000 aufgerufen werden.

---

## Betterbahn beenden

* In Termux **STRG+C** drücken
  oder
* Termux komplett schließen

Dadurch wird Betterbahn sauber gestoppt.

---

## Häufige Fragen

**Muss Termux geöffnet bleiben?**
Ja. Solange Betterbahn läuft, muss Termux im Hintergrund aktiv sein.

**Wird Docker verwendet?**
Nein. Docker wird **nicht** benötigt und nicht installiert.

**Verändert das mein Android-System?**
Nein. Alles läuft isoliert innerhalb von Termux.

**Kann ich Betterbahn wieder entfernen?**
Ja. Durch Löschen der Betterbahn-Ordner in Termux.

---

## Tipps bei Problemen

* WLAN statt mobiles Netz verwenden
* Akku nicht leer werden lassen
* Falls der Browser nicht aufgeht:

  * Einblend-Berechtigung prüfen
  * Termux einmal neu starten
  * Erneut starten
