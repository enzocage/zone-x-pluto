# Zone X - Three.js Spiel

## Über das Spiel
"Zone X" ist ein rasterbasiertes 2D-Spiel mit einem nach leveln ansteigend großen Grid (start 16:9 und dann jeweils 10% größer), entwickelt mit JavaScript und Three.js. Der Spieler muss alle Plutonium-Elemente aufsammeln, sie in Tonnen abliefern und den Ausgang erreichen, während er Hindernissen wie Wänden und Gegnern ausweicht. Das Spielfeld scrollt basierend auf der Spielerbewegung, und der Zoomfaktor kann frei mit dem mausrad eingestellt werden, um die Sichtbarkeit des Spielfelds anzupassen.

## Installation und Start
1. Lade das Repository herunter
2. Öffne die Datei `index.html` in einem modernen Browser
3. Alternativ kannst du einen lokalen Server starten:
   ```
   npx serve
   ```
   oder
   ```
   python -m http.server
   ```

## Spielsteuerung
- **Bewegung:** W (oben), A (links), S (unten), D (rechts). Das Spielfeld scrollt, während der Spieler in der Mitte bleibt. Die Bewegung ist gleitend (Pixel für Pixel) zwischen Rasterpunkten.
- **Aktion:** Leertaste (einen Block/Mat hinter dem Spieler platzieren, sofern welche gesammelt wurden).
- **Zoom:** Mausrad zum Vergrößern/Verkleinern des Sichtfelds

## Spielelemente
Spieler: Startet mit 5 Leben und 15 Blocks. Kann sich nicht durch Wände bewegen. Verliert ein Leben bei Kontakt mit Gegnern oder wenn der Plutonium-Timer abläuft. Sammelt Plutonium, Blocks und liefert Plutonium in Tonnen ab.
Gegner: 7 Gegner im ersten Level, Anzahl steigt pro Level um 30%. Bewegen sich in geraden Linien, bis sie mit Wänden, Tonnen, anderen Gegnern oder Blocks kollidieren, und ändern dann zufällig ihre Richtung.
Wände: Umranden das Spielfeld und sind zufällig im Inneren verteilt (Verhältnis 1:4 zu Beginn, steigt pro Level um 20%). Bilden lange Linien, um ein Labyrinth zu schaffen.
Plutonium: 5 Stück, zufällig verteilt (1:200). Nach dem Aufsammeln läuft ein 20-Sekunden-Timer; wird es nicht rechtzeitig in eine Tonne gebracht, verliert der Spieler ein Leben.
Tonne: 3 Stück, zufällig verteilt. Hier wird Plutonium abgeliefert (+100 Punkte, Timer stoppt).
Blocks (Mats): Zufällig verteilt (1:200). Können aufgesammelt und hinter dem Spieler platziert werden, um Gegner zu blockieren. Die Anzahl wird angezeigt.
Startposition: Feste Position des Spielers zu Beginn.
Exit: Blinkt, sobald alle Plutoniumproben abgeliefert wurden. Muss erreicht werden, um das Level abzuschließen.

## Level-Design
Spielfeld: 60x30 Grid. Die Kamera schwebt schräg darüber (isometrische oder top-down Ansicht).
Labyrinth: Besteht aus Wänden, die das Spielfeld umschließen und lange Linien bilden, um Unterräume zu schaffen. Der Levelgenerator stellt sicher, dass jeder Bereich vom Startpunkt erreichbar ist.
Level-Progression: siehe ordner levels

## UI-Elemente
Timer: Zeigt die verbleibende Zeit (20 Sekunden) nach dem Aufsammeln von Plutonium.
Plutonium übrig: Anzahl der noch zu sammelnden Plutoniumproben.
Leben: Verbleibende Leben (startet mit 5).
Blocks-Anzahl: Anzahl der gesammelten Blocks.
Punkte: Score, erhöht sich um 100 pro abgeliefertem Plutonium.

## Ziel des Spiels
Sammle alle 5 Plutoniumproben, liefere sie in die Tonnen und erreiche den Exit, bevor die Leben aufgebraucht sind.
