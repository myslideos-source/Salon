> **Hinweis:** Dieses Dokument ist die verbindliche Produktspezifikation für die universelle Weiterentwicklung von HalloMia. Die Umsetzung erfolgt kontrolliert in einzelnen Phasen. Es darf nicht versucht werden, sämtliche Anforderungen in einem einzigen Arbeitsschritt umzusetzen.

Du bist ein erfahrener SaaS-Architekt, UX/UI-Designer und Full-Stack-Entwickler. Analysiere zuerst den gesamten vorhandenen Quellcode meiner bestehenden Plattform „HalloMia" und baue sie anschließend konsequent weiter.

## Ausgangslage

HalloMia ist aktuell zu stark auf Friseursalons ausgerichtet. Die Plattform soll jetzt zu einem universellen KI-Telefonassistenten für Unternehmen, Selbstständige und Dienstleister weiterentwickelt werden.

HalloMia soll nicht mehr wie eine reine Friseur-Software wirken.

Das Grundprinzip bleibt erhalten:

* Mia nimmt Anrufe rund um die Uhr entgegen.
* Mia beantwortet häufige Fragen.
* Mia vereinbart, verschiebt und storniert Termine.
* Mia arbeitet mit einem eigenen, in die Plattform integrierten Kalender.
* Mia erkennt bestehende Kunden anhand der Telefonnummer.
* Mia kann Nachrichten, Rückrufwünsche und Anfragen aufnehmen.
* Unternehmen verwalten alle Einstellungen selbst über ein einfaches Dashboard.

## Neue Positionierung

Neue Hauptaussage:

„Deine KI-Assistentin für Anrufe, Termine und Kundenanfragen."

Unterzeile:

„HalloMia nimmt Anrufe entgegen, beantwortet Fragen und organisiert Termine – rund um die Uhr und passend zu deinem Unternehmen."

Die Plattform richtet sich beispielsweise an:

* Friseure und Barbershops
* Kosmetikstudios
* Nagelstudios
* Physiotherapien
* Massage- und Wellnessstudios
* Arzt- und Zahnarztpraxen
* Kanzleien
* Immobilienmakler
* Werkstätten
* Fahrschulen
* Handwerksbetriebe
* Fotografen
* Coaches und Berater
* Fitness- und Personal-Trainer
* Reinigungsunternehmen
* Restaurants und andere Betriebe mit Reservierungen
* Unternehmen mit Beratungsterminen
* Selbstständige und kleine Teams

Verwende auf der öffentlichen Webseite unterschiedliche Branchen als Beispiele. Die Plattform selbst darf jedoch keine fest einprogrammierte Friseur-Logik mehr besitzen.

## Wichtiges Produktprinzip

HalloMia soll sich an das Unternehmen anpassen – nicht das Unternehmen an HalloMia.

Baue deshalb keine getrennten Programme für jede Branche. Entwickle stattdessen ein flexibles Grundsystem mit Branchenvorlagen.

Beim Onboarding wählt der Kunde seine Branche aus. HalloMia schlägt anschließend passende Begriffe, Einstellungen und Terminarten vor. Sämtliche Angaben können später verändert werden.

Beispiele:

* Beim Friseur: Leistungen, Behandlungen und Mitarbeiter
* Beim Handwerker: Aufträge, Vor-Ort-Termine und Rückrufe
* Beim Arzt: Terminarten, Behandler und Sprechzeiten
* Beim Restaurant: Reservierungen, Gästezahl und Tische
* Beim Berater: Erstgespräch, Beratung und Folgetermin
* Bei der Werkstatt: Fahrzeug, Kennzeichen, Serviceart und Abholtermin

Auch „Andere Branche" muss auswählbar sein.

## Bestehendes Projekt

Arbeite im vorhandenen Projekt und mit der vorhandenen technischen Architektur.

* Analysiere zuerst Komponenten, Seiten, Datenbank, Authentifizierung und bestehende Funktionen.
* Entferne keine funktionierenden Bereiche ohne Grund.
* Ersetze fest hinterlegte Friseur-Begriffe durch flexible, konfigurierbare Begriffe.
* Überarbeite bestehende Komponenten, statt unnötige Duplikate zu erstellen.
* Behalte das hochwertige, freundliche und moderne HalloMia-Design bei.
* Die vorhandenen Farben und das bestehende Logo sollen grundsätzlich erhalten bleiben.
* Die Plattform muss auf Desktop, Tablet und Smartphone vollständig funktionieren.
* Verwende keine unechten Buttons oder Navigationselemente ohne Funktion.

## Eigener HalloMia-Kalender

Der eigene Kalender ist ein zentraler Bestandteil der Plattform. Er darf nicht nur wie ein eingebetteter externer Kalender wirken.

Erstelle einen modernen Kalender mit:

* Tagesansicht
* Wochenansicht
* Monatsansicht
* Terminübersicht als Liste
* „Heute"-Schaltfläche
* Vor- und Zurücknavigation
* Suche
* Filtern nach Mitarbeiter
* Filtern nach Standort
* Filtern nach Terminart
* Filtern nach Status
* Farbliche Kennzeichnung der Termine
* Aktueller-Zeit-Markierung
* Drag-and-drop zum Verschieben von Terminen
* Vergrößern oder Verkürzen eines Termins
* Detailansicht beim Anklicken
* Schneller Erstellung eines Termins
* Optimierter mobiler Darstellung

Auf Smartphones soll nicht einfach die gesamte Desktop-Woche verkleinert werden. Verwende dort standardmäßig eine übersichtliche Tagesansicht mit einer horizontalen Datumsauswahl und einer gut lesbaren Terminliste.

## Terminverwaltung

Ein Termin benötigt mindestens:

* Kunde
* Telefonnummer
* E-Mail optional
* Terminart oder Leistung
* Datum
* Beginn
* Dauer
* zuständiger Mitarbeiter
* Standort optional
* Status
* interne Notizen
* Buchungsquelle
* Erstellungsdatum

Mögliche Status:

* Angefragt
* Bestätigt
* Eingecheckt
* In Bearbeitung
* Abgeschlossen
* Abgesagt
* Nicht erschienen
* Rückruf erforderlich

Mögliche Buchungsquellen:

* KI-Telefonassistent
* Online-Buchung
* Manuell angelegt
* Import
* Externer Kalender

Der Kunde soll über den Kalender Termine manuell erstellen, ändern, verschieben und stornieren können.

## Flexible Terminarten

Der bisherige Begriff „Friseurleistung" darf nicht mehr fest im System verankert sein.

Erstelle stattdessen flexible „Terminarten und Leistungen".

Eine Terminart enthält:

* Name
* Beschreibung
* Dauer
* Preis optional
* Vorbereitungszeit
* Nachbereitungszeit
* Farbe im Kalender
* verfügbarer Standort
* verfügbare Mitarbeiter
* telefonisch buchbar
* online buchbar
* aktiv oder inaktiv
* notwendige Kundenangaben
* individuelle Buchungsfragen

Beispiele für individuelle Fragen:

* „Um welches Fahrzeug handelt es sich?"
* „Wie viele Personen kommen?"
* „Welche Haarlänge haben Sie?"
* „Geht es um einen Neubau oder Altbau?"
* „Ist es Ihr erster Termin bei uns?"

Diese Fragen müssen vom Unternehmen selbst erstellt werden können. Der KI-Assistent soll sie bei der Buchung berücksichtigen.

## Mitarbeiter und Ressourcen

Erstelle eine flexible Verwaltung für:

* Mitarbeiter
* Teams
* Räume
* Behandlungsplätze
* Fahrzeuge
* Geräte
* Tische
* sonstige buchbare Ressourcen

Jede Ressource erhält:

* Name
* Typ
* Beschreibung
* Standort
* Arbeits- oder Verfügbarkeitszeiten
* zugewiesene Terminarten
* Kalenderfarbe
* aktiv oder inaktiv

Ein Termin darf nur angeboten werden, wenn alle dafür notwendigen Mitarbeiter und Ressourcen verfügbar sind.

## Öffnungszeiten und Verfügbarkeit

Unternehmen müssen Folgendes festlegen können:

* reguläre Öffnungszeiten
* Arbeitszeiten pro Mitarbeiter
* Pausenzeiten
* Urlaub
* Krankheit
* Feiertage
* abweichende Öffnungszeiten
* Mindestvorlaufzeit
* maximaler Buchungszeitraum
* Puffer zwischen Terminen
* erlaubte Buchungsintervalle
* maximale Termine pro Tag
* parallele Termine
* Notfall- oder Express-Termine
* Zeiträume für telefonische Rückrufe

Die KI darf niemals einen belegten oder gesperrten Zeitraum anbieten.

## KI-Assistent konfigurieren

Erstelle einen Bereich „Meine Mia".

Dort kann das Unternehmen festlegen:

* Name der KI-Assistentin
* Begrüßung
* Tonalität
* Du- oder Sie-Ansprache
* Sprache
* weitere unterstützte Sprachen
* Unternehmensbeschreibung
* Leistungen und Terminarten
* häufige Fragen und Antworten
* Preise
* Öffnungszeiten
* Standorte
* Mitarbeiter
* Regeln für Terminbuchungen
* Informationen, die Mia niemals nennen darf
* Verhalten bei unbekannten Fragen
* Verhalten außerhalb der Öffnungszeiten
* Weiterleitung an einen Menschen
* Rückruf aufnehmen
* dringende Fälle kennzeichnen
* Benachrichtigungen nach einem Gespräch

Mögliche Tonalitäten:

* Freundlich und locker
* Professionell
* Herzlich
* Modern
* Seriös
* Individuell

Baue außerdem eine Testfunktion ein. Der Nutzer soll in einem Chat oder einer simulierten Gesprächsansicht testen können, wie Mia auf typische Kundenfragen reagiert.

## Regeln für Mia

Mia muss folgende Grundregeln einhalten:

* Keine Informationen erfinden.
* Nur hinterlegte Unternehmensinformationen verwenden.
* Verfügbarkeiten immer live im Kalender prüfen.
* Preise nur nennen, wenn sie hinterlegt sind.
* Bei fehlender Verfügbarkeit passende Alternativen anbieten.
* Mitarbeiterwünsche berücksichtigen.
* Rückruf anbieten, wenn eine Frage nicht beantwortet werden kann.
* Bestehende Kunden anhand ihrer Telefonnummer erkennen.
* Vor der endgültigen Buchung alle Termindaten zusammenfassen.
* Erst nach ausdrücklicher Bestätigung verbindlich buchen.
* Änderungen und Stornierungen klar bestätigen.
* Kritische oder dringende Anliegen an einen Menschen weiterleiten.
* Keine medizinischen, rechtlichen oder finanziellen Diagnosen beziehungsweise Beratungen erfinden.
* Bei Notfällen auf die dafür vorgesehenen offiziellen Notrufmöglichkeiten hinweisen.

## Gesprächsübersicht

Erstelle einen Bereich „Anrufe und Gespräche".

Anzeigen:

* Datum und Uhrzeit
* Name oder Telefonnummer
* Gesprächsdauer
* Gesprächszusammenfassung
* erkanntes Anliegen
* vereinbarter Termin
* Rückrufwunsch
* Gesprächsstatus
* Stimmung oder Dringlichkeit
* Audioaufnahme, falls rechtlich zulässig und technisch vorhanden
* Transkript
* interne Notizen

Filter:

* Alle Gespräche
* Termin gebucht
* Rückruf erforderlich
* Nicht gelöst
* Dringend
* Bestandskunde
* Neukunde

Mia soll nach jedem Gespräch automatisch eine kurze, verständliche Zusammenfassung erstellen.

## Kundenverwaltung

Erstelle eine branchenunabhängige Kundenverwaltung.

Ein Kunde enthält:

* Vorname
* Nachname
* Telefonnummer
* E-Mail
* Adresse optional
* Unternehmen optional
* Notizen
* individuelle Felder
* vergangene Termine
* kommende Termine
* Anrufhistorie
* Einwilligungen
* bevorzugter Mitarbeiter
* bevorzugter Standort
* Kundenstatus
* Tags

Mögliche Kundenstatus:

* Neukunde
* Bestandskunde
* VIP
* Inaktiv
* Gesperrt

Doppelte Kunden sollen anhand von Telefonnummer und E-Mail erkannt werden.

## Anfragen und Rückrufe

Nicht jedes Unternehmen arbeitet ausschließlich mit festen Terminen. Deshalb benötigt HalloMia zusätzlich eine zentrale Anfragenverwaltung.

Eine Anfrage kann enthalten:

* Kunde
* Anliegen
* Kategorie
* Beschreibung
* gewünschter Rückrufzeitraum
* Dringlichkeit
* zuständiger Mitarbeiter
* Fotos oder Dokumente optional
* Status
* interne Notizen

Status:

* Neu
* In Prüfung
* Rückruf geplant
* Angebot erforderlich
* In Bearbeitung
* Erledigt
* Abgelehnt

So kann beispielsweise ein Handwerker zunächst eine Anfrage aufnehmen, bevor ein Vor-Ort-Termin oder Auftrag entsteht.

## Dashboard

Das Dashboard soll auf einen Blick zeigen:

* Anrufe heute
* von Mia angenommene Anrufe
* gebuchte Termine
* offene Rückrufe
* neue Kunden
* nächste Termine
* ungelöste Anfragen
* Auslastung
* eingesparte Zeit
* Erfolgsquote
* Erreichbarkeit durch Mia
* aktuelle Aktivitäten

Ergänze einen gut sichtbaren Status:

* Mia ist aktiv
* Mia ist pausiert
* Einrichtung unvollständig
* Telefonnummer noch nicht verbunden

Füge sinnvolle Schnellaktionen hinzu:

* Termin erstellen
* Kunden anlegen
* Rückruf erfassen
* Anfrage erstellen
* Mia testen
* Öffnungszeiten ändern

## Onboarding

Erstelle einen einfachen Schritt-für-Schritt-Einrichtungsassistenten:

1. Unternehmen anlegen
2. Branche auswählen
3. Unternehmensdaten eintragen
4. Standort anlegen
5. Öffnungszeiten festlegen
6. Mitarbeiter oder Ressourcen hinzufügen
7. Terminarten und Leistungen anlegen
8. Begrüßung und Tonalität von Mia festlegen
9. häufige Fragen hinterlegen
10. Kalender testen
11. Telefonnummer verbinden
12. Mia aktivieren

Zeige einen Fortschrittsbalken und speichere jeden Schritt automatisch.

Für Branchen sollen lediglich praktische Vorlagen angelegt werden. Nach Auswahl einer Vorlage müssen alle Begriffe, Felder und Regeln weiterhin bearbeitbar sein.

## Benutzer und Rollen

Berücksichtige mehrere Benutzer pro Unternehmen.

Rollen:

* Inhaber
* Administrator
* Mitarbeiter
* Empfang
* Nur Kalenderzugriff

Berechtigungen müssen konfigurierbar sein. Mitarbeiter sollen auf Wunsch nur ihre eigenen Termine und Kunden sehen.

Die Daten verschiedener Unternehmen müssen vollständig voneinander getrennt sein. Baue die Anwendung mandantenfähig auf.

## Benachrichtigungen

Unternehmen sollen Benachrichtigungen erhalten können bei:

* neuer Terminbuchung
* Änderung eines Termins
* Stornierung
* neuem Rückrufwunsch
* ungelöster Kundenfrage
* dringender Anfrage
* nicht erreichtem Kunden
* Ausfall eines Mitarbeiters
* Konflikt im Kalender

Mögliche Kanäle:

* In-App
* E-Mail
* SMS, sofern technisch angebunden
* Push-Benachrichtigung

## Öffentliche Webseite

Überarbeite auch die Landingpage.

Die Seite darf nicht mehr hauptsächlich Friseure zeigen. Verwende eine ausgewogene Mischung aus verschiedenen Unternehmen und Alltagssituationen.

Empfohlener Aufbau:

### Hero

Überschrift:

„Deine KI-Assistentin. Immer erreichbar."

Text:

„HalloMia nimmt Anrufe entgegen, beantwortet Kundenfragen und trägt Termine direkt in deinen Kalender ein – auch wenn du gerade keine Zeit hast."

Buttons:

* „Kostenlos testen"
* „So funktioniert's"

Zeige daneben ein hochwertiges Mockup aus eingehendem Anruf, Gesprächszusammenfassung und automatisch gebuchtem Kalendertermin.

### Problem

Überschrift:

„Kein Anruf geht mehr verloren."

Erkläre, dass Anrufe häufig während Kundenterminen, auf Baustellen, in Behandlungen, bei Meetings oder nach Feierabend eingehen.

### Funktionsweise

1. Kunde ruft an.
2. Mia versteht das Anliegen.
3. Mia beantwortet Fragen oder prüft den Kalender.
4. Mia bucht einen Termin oder erstellt einen Rückruf.
5. Das Unternehmen erhält eine Zusammenfassung.

### Vorteile

* Rund um die Uhr erreichbar
* Weniger Unterbrechungen
* Mehr gebuchte Termine
* Eigener intelligenter Kalender
* Automatische Gesprächszusammenfassungen
* Für jede Branche anpassbar
* Auch für kleine Unternehmen geeignet
* In wenigen Schritten eingerichtet

### Branchen

Erstelle moderne Branchen-Karten mit verschiedenen Beispielen. Vermeide eine endlos lange Liste. Zeige zunächst sechs wichtige Bereiche und biete „Weitere Branchen anzeigen" an.

### Social Proof

Verwende glaubwürdige, klar als Demo gekennzeichnete Beispiele, solange keine echten Kundenbewertungen vorhanden sind. Erfinde keine echten Kundennamen, Unternehmensnamen oder Bewertungszahlen.

### Zeitersparnis

Zeige verständlich:

„Mia arbeitet im Hintergrund für dich – damit du mehr Zeit für deine Kunden und dein eigentliches Geschäft hast."

### Abschluss-CTA

„Lass Mia deinen nächsten Anruf übernehmen."

Buttons:

* „HalloMia testen"
* „Demo ansehen"

## Navigation der Anwendung

Verwende eine klare Hauptnavigation:

* Übersicht
* Kalender
* Anrufe
* Kunden
* Anfragen
* Meine Mia
* Leistungen
* Team und Ressourcen
* Statistiken
* Einstellungen

Auf mobilen Geräten soll eine kompakte Navigation mit den wichtigsten Punkten und einem Mehr-Menü verwendet werden.

## Begriffssystem

Entferne fest hinterlegte Begriffe wie:

* Salon
* Friseur
* Haarschnitt
* Haarlänge
* Stylist
* Behandlung

Nutze standardmäßig:

* Unternehmen
* Kunde
* Terminart
* Leistung
* Mitarbeiter
* Ressource
* Standort
* Anfrage

Branchenspezifische Begriffe dürfen nur über Vorlagen oder Einstellungen erscheinen.

## Datenmodell und technische Umsetzung

Passe das Datenmodell so an, dass mindestens folgende Entitäten sinnvoll abgebildet werden:

* Unternehmen
* Benutzer
* Rollen
* Standorte
* Mitarbeiter
* Ressourcen
* Kunden
* Terminarten
* Termine
* Öffnungszeiten
* Abwesenheiten
* Anrufe
* Gesprächszusammenfassungen
* Transkripte
* Anfragen
* Rückrufe
* FAQ
* KI-Einstellungen
* Benachrichtigungen
* Branchenvorlagen
* individuelle Felder

Achte auf:

* klare Beziehungen
* Mandantentrennung
* Rollen und Berechtigungen
* sichere Datenbankregeln
* nachvollziehbare Statuswerte
* saubere Validierung
* Zeitzonen
* deutsche Datums- und Zeitformate
* DSGVO-freundliche Datenverwaltung
* Lösch- und Exportmöglichkeiten
* Einwilligungen bei Gesprächsaufzeichnungen

Falls Supabase verwendet wird, müssen geeignete Row-Level-Security-Regeln vorbereitet werden.

## Telefonie und Integrationen

Bereite eine saubere Schnittstelle für Telefonanbieter beziehungsweise Sprach-KI-Systeme wie Retell AI oder Twilio vor.

Die Plattform muss auch ohne aktiv konfigurierte Telefonverbindung als Demo funktionieren.

Plane Webhooks für:

* eingehender Anruf
* Gespräch gestartet
* Gespräch beendet
* Transkript verfügbar
* Zusammenfassung verfügbar
* Termin angefragt
* Termin gebucht
* Rückruf erstellt
* Weiterleitung ausgelöst

Externe Zugangsdaten dürfen niemals im Frontend gespeichert werden.

Optional sollen später externe Kalender angebunden werden können:

* Google Calendar
* Microsoft Outlook
* Apple Calendar über unterstützte Standards
* CalDAV
* ICS-Import und Export

Der HalloMia-Kalender bleibt jedoch das zentrale System. Externe Kalender sind Synchronisationen, kein Ersatz für den eigenen Kalender.

## Statistiken

Erstelle verständliche Auswertungen:

* angenommene Anrufe
* verpasste oder abgebrochene Gespräche
* durchschnittliche Gesprächsdauer
* gebuchte Termine
* Buchungsquote
* Stornierungen
* Rückrufquote
* häufigste Anliegen
* häufigste Fragen
* neue und wiederkehrende Kunden
* besonders gefragte Zeiten
* Auslastung je Mitarbeiter
* geschätzte Zeitersparnis

Statistiken dürfen nicht mit erfundenen Live-Daten gefüllt werden. Für eine Demo dürfen klar erkennbare Beispieldaten verwendet werden.

## Designvorgaben

* Modernes Premium-SaaS-Design
* Freundlich und vertrauenswürdig
* Keine sterile Krankenhausoptik
* Keine verspielte reine Beauty-Optik
* Bestehende HalloMia-Farben sinnvoll weiterverwenden
* Gute Kontraste
* Große, klare Typografie
* Hochwertige Karten und Dialoge
* Dezente Schatten
* Einheitliche Abstände
* Verständliche Icons
* Keine Emoji-Icons als Ersatz für professionelle Symbole
* Barrierearme Bedienung
* Große Touch-Flächen auf Smartphones
* Keine überladenen Ansichten

## Demo-Daten

Erstelle vielseitige Demo-Daten aus mehreren Branchen, damit deutlich wird, dass HalloMia nicht nur für Friseure gedacht ist.

Beispiele:

* Beratungstermin
* Vor-Ort-Besichtigung
* Erstgespräch
* Fahrzeugservice
* Behandlung
* Tischreservierung
* Rückruf wegen Angebot
* Fototermin

Mische diese Daten jedoch nicht in einem einzigen Demo-Unternehmen. Jedes Demo-Unternehmen muss seine eigene Branche, Kunden, Mitarbeiter und Termine besitzen.

## Vorgehensweise

1. Analysiere zunächst das bestehende Projekt.
2. Nenne kurz die aktuell vorhandene Struktur und die Stellen mit fest eingebauter Friseur-Logik.
3. Erstelle einen konkreten Umsetzungsplan.
4. Beginne danach direkt mit der Umsetzung.
5. Arbeite bestehende Seiten und Komponenten vollständig um.
6. Aktualisiere Navigation, Texte, Datenmodell und Demo-Daten.
7. Stelle sicher, dass bestehende Funktionen weiterhin laufen.
8. Behebe TypeScript-, Build- und Lint-Fehler.
9. Teste die wichtigsten Abläufe.
10. Prüfe Desktop- und Smartphone-Darstellung.
11. Hinterlasse keine halbfertigen Platzhalter oder funktionslosen Schaltflächen.

## Akzeptanzkriterien

Die Änderung ist erst abgeschlossen, wenn:

* die Plattform auf den ersten Blick nicht mehr wie eine reine Friseur-Software wirkt,
* alle zentralen Friseur-Begriffe entfernt oder konfigurierbar sind,
* unterschiedliche Branchen eingerichtet werden können,
* ein Unternehmen eigene Terminarten definieren kann,
* der integrierte Kalender vollständig bedienbar ist,
* Termine erstellt, geändert und storniert werden können,
* Mitarbeiter und Ressourcen verwaltet werden können,
* Anfragen und Rückrufe auch ohne festen Termin möglich sind,
* Mia mit den Informationen des jeweiligen Unternehmens konfiguriert werden kann,
* die Daten verschiedener Unternehmen getrennt sind,
* die wichtigsten Ansichten mobil optimiert sind,
* die Landingpage die neue universelle Positionierung verständlich vermittelt,
* das Projekt ohne Fehler gebaut werden kann.

Treffe bei kleineren Design- und Umsetzungsfragen eigenständig sinnvolle Entscheidungen. Verändere jedoch nicht unnötig die bestehende Markenidentität von HalloMia. Das Ergebnis soll wie eine professionelle, marktreife Weiterentwicklung der vorhandenen Plattform wirken – nicht wie ein komplett neues, unverbundenes Projekt.
