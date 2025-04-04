/**
 * Menu Controller
 * Erstellt und verwaltet das Auswahlmenü für die verschiedenen Level-Generatoren
 */

export class MenuController {
    /**
     * Erstellt einen neuen MenuController
     * @param {Function} onLevelGeneratorSelect - Callback-Funktion, die aufgerufen wird, wenn ein Level-Generator ausgewählt wird
     */
    constructor(onLevelGeneratorSelect) {
        this.menuContainer = null;
        this.onLevelGeneratorSelect = onLevelGeneratorSelect;
        this.visible = false;
    }
    
    /**
     * Initialisiert das Menü
     * Erstellt die DOM-Elemente für das Auswahlmenü
     */
    init() {
        // Menü-Container erstellen
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'level-generator-menu';
        this.menuContainer.style.position = 'fixed';
        this.menuContainer.style.top = '0';
        this.menuContainer.style.left = '0';
        this.menuContainer.style.width = '100%';
        this.menuContainer.style.height = '100%';
        this.menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.menuContainer.style.display = 'flex';
        this.menuContainer.style.flexDirection = 'column';
        this.menuContainer.style.justifyContent = 'center';
        this.menuContainer.style.alignItems = 'center';
        this.menuContainer.style.zIndex = '1000';
        
        // Titel erstellen
        const title = document.createElement('h1');
        title.textContent = 'Wähle einen Level-Generator';
        title.style.color = 'white';
        title.style.marginBottom = '50px';
        title.style.fontFamily = 'Arial, sans-serif';
        this.menuContainer.appendChild(title);
        
        // Button-Container erstellen
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '30px';
        
        // Button für den aktuellen Level-Generator
        const button1 = this.createButton(
            'Level-Generator 1', 
            'Der aktuelle Level-Generator erstellt Level mit Wänden, Gegnern und Items.',
            1
        );
        
        // Button für den zukünftigen Level-Generator
        const button2 = this.createButton(
            'Level-Generator 2', 
            'Ein zukünftiger Level-Generator (wird in kommenden Updates verfügbar sein).',
            2
        );
        
        // Buttons zum Container hinzufügen
        buttonContainer.appendChild(button1);
        buttonContainer.appendChild(button2);
        this.menuContainer.appendChild(buttonContainer);
        
        // Menü-Container zum Body hinzufügen
        document.body.appendChild(this.menuContainer);
        
        // Menü zunächst anzeigen
        this.show();
    }
    
    /**
     * Erstellt einen Button für das Menü
     * @param {string} name - Der Name des Level-Generators
     * @param {string} description - Die Beschreibung des Level-Generators
     * @param {number} generatorId - Die ID des Level-Generators (1 oder 2)
     * @returns {HTMLElement} - Das Button-Element
     */
    createButton(name, description, generatorId) {
        const button = document.createElement('div');
        button.className = 'generator-button';
        button.style.width = '300px';
        button.style.height = '200px';
        button.style.backgroundColor = generatorId === 1 ? '#336699' : '#666666';
        button.style.border = '3px solid #aaccff';
        button.style.borderRadius = '10px';
        button.style.padding = '20px';
        button.style.display = 'flex';
        button.style.flexDirection = 'column';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.textAlign = 'center';
        button.style.color = 'white';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.cursor = 'pointer';
        button.style.transition = 'transform 0.2s, background-color 0.2s';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        
        // Hover-Effekte
        button.onmouseover = () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = generatorId === 1 ? '#4477aa' : '#777777';
        };
        
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = generatorId === 1 ? '#336699' : '#666666';
        };
        
        // Titel
        const title = document.createElement('h2');
        title.textContent = name;
        title.style.margin = '0 0 15px 0';
        button.appendChild(title);
        
        // Beschreibung
        const desc = document.createElement('p');
        desc.textContent = description;
        desc.style.margin = '0';
        desc.style.fontSize = '14px';
        button.appendChild(desc);
        
        // Klick-Event
        button.onclick = () => {
            this.hide();
            this.onLevelGeneratorSelect(generatorId);
        };
        
        return button;
    }
    
    /**
     * Zeigt das Menü an
     */
    show() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'flex';
            this.visible = true;
        }
    }
    
    /**
     * Versteckt das Menü
     */
    hide() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'none';
            this.visible = false;
        }
    }
    
    /**
     * Prüft, ob das Menü sichtbar ist
     * @returns {boolean} - true, wenn das Menü sichtbar ist, sonst false
     */
    isVisible() {
        return this.visible;
    }
} 