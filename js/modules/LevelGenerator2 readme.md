erstelle jetzt den neuen LevelGenerator2.js der folgende eigenschaften hat. 
verwerfe den bestehen code von LevelGenerator2.js und schreibe diesen vollständig neu nach folgenden regeln:

der Levelgenrator 2 erzeugt 25 levels, diese haben aufsteigend dynamisch generiert. 

die Spielfeldgröße
erst wird die spielfeldgröße bestimmt. Die spielfeldgröße beginnt bei level 1 mit 16x9 und wird dann mit jedem weiteren level um 10% größer. level 2 wäre dann mit 110% also 17.6 x 9.9, also gerundet 18x10. uns wo weiter. 

Die Wandelemente:
Zunächst werden wandelemente rund um das spielfeld als randbegrenzung gesetzt. 

Für jedes level wird eine aufsteigende anzahl von wandelemente plaziert. diese anzahl dieser wandelemente hängt ab von der spielfeldgröße (für das level 1 ist 16*9=144). das level startet mit  und erhöht sich dann immer um 1 bis. 25. 
die formel hierfür lautet:
anzahl wandelemente = spielfeldgröße/(25/level)  
Beispiel für Level 1: 144/(25/1)=5,76 also gerundet 6.

Diese ersten 20% dieser wandeleme werden zufällig auf dem spielfeld verteilt. Erst wird ein zufälliger rasterpunkt gewählt, dann wird geprüft ob dieser unbesetzt ist, wenn ja, dann wird dort ein wandelement platzert. 

die restlichen 80% der wandelemente werden nach folgendem prinzip verteilt:

erst wird ein zufälliger freier, rasterpunkt gesucht der (links, rechts, oben oder unten) angrenzend an ein bereits plaziertes wandelement liegt, das nicht teil der spielfeldbegrenzung ist. 

dann wird ein wandelement dort plaziert, 
wenn an dieses wandelement nur maximal 4 wandelemente angrenzen (auf folgenden angrenzmöglichkeiten: oben, unten, links, recht, rechsoben, linksoben, linksunten, linksunten)

und wenn danach noch jedes leerraumelement noch mit allen anderen leerraumelementen über horizontale oder vertikal angrenzende leerraumelemente verbunden ist. damit soll sichergestellt werden, dass der spieler jedes leerraumelement erreichen kann und das gesamte level für ihn zugänglich bleibt.
 
Die Spielelemente:
Dann werden die Spielelemente platziert. Für alle Spielfeldelemente gilt, erst wird immer ein zufälliger rasterpunkt gewählt und geprüft ob dieser unbesetzt ist. Wenn ja, dann wird dort das Spielelement platzert.

erst wird der startpunkt gesetzt. 

dann wird der zielpunkt, wird zufällig gesetzt, erscheint jedoch erst wenn alle plutonium elemente in die tonne abgeliefert wurden. oder der spieler stirbt und die letzten plutonium elemente bereits aufgesammelt hatte.  

dann werden die gegner platziert. anzahl gegner, start bei level 1 mit 5, dann jedes weitere level plus 20%. 

dann werden die plutonium elemente platziert. anzahl plutonium, start  bei level 1 mit 5, dann jedes weitere level plus 15%. 

dann werden die mats verteilt. anzahl mats, start bei level 1 mit 5, dann jedes weitere level plus 20%. 

dann werden die tonnen platziert. anzahl tonnen bleibt mit 5 immer konstant. 
