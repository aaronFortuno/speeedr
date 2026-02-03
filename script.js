// --- Procesamiento de texto ---

/**
 * Divide el texto de entrada en un array de palabras y limpia espacios innecesarios.
 * @param {string} text - El texto bruto introducido por el usuario.
 * @returns {string[]} - Array de palabras listas para ser procesadas.
 */
function tokenizeText(text) {
    // Eliminar saltos de línea y dividir por espacios
    return text.trim().split(/\s+/).filter(word => word.length > 0);
}

/**
 * Calcula el punto de fijación (índice de la letra a resaltar) basándose en la longitud.
 * Regla: Primer tercio de la palabra (aprox. posición 1 para palabras cortas, 2-3 para largas).
 * @param {string} word - La palabra actual.
 * @returns {number} - El índice del carácter que debe resaltarse.
 */
function getFocusIndex(word) {
    if (word.length <= 1) return 0;
    // Calcular un tercio de la longitud, redondeado hacia abajo
    const focusPoint = Math.floor(word.length / 3);
    // Asegurar que no sea menor que 0 ni mayor que la última posición
    return Math.max(0, Math.min(focusPoint, word.length - 1));
}

/**
 * Calcula el tiempo de espera (delay) para la palabra actual.
 * @param {string} word - La palabra actual para comprobar signos de puntuación.
 * @param {number} baseDelay - El retraso base según la velocidad (WPM) actual.
 * @returns {number} - Tiempo en milisegundos que la palabra debe permanecer en pantalla.
 */
function calculateWordDelay(word, baseDelay) {
    // Pausas adicionales para signos de puntuación
    if (word.endsWith('.')) return baseDelay * 2.5; // Punto
    if (word.endsWith(',')) return baseDelay * 1.8; // Coma
    if (word.endsWith(';') || word.endsWith(':')) return baseDelay * 2.0; // Punto y coma, dos puntos
    if (word.endsWith('!') || word.endsWith('?')) return baseDelay * 2.2; // Exclamación, interrogación
    return baseDelay; // Sin puntuación especial
}

// --- Motor de lectura ---
let wordsArray = [];
let currentIndex = 0;
let currentWPM = 0;
let targetWPM = 0;
let startWPM = 0;
let accelerationTime = 0;
let startTime = 0;
let timerId = null;
let textInput = document.getElementById('input-text');

/**
 * Inicia el ciclo de lectura. Gestiona la aceleración progresiva de WPM inicial a objetivo.
 */
function startExercise() {
    const text = document.getElementById('input-text').value;
    console.log('Element input-text:', !!textInput);
    console.log('Valor del text:', textInput?.value);

    if (!text.trim()) {
        alert('Por favor, introduce un texto para practicar.');
        return;
    }

    // Obtener valores de configuración
    startWPM = parseInt(document.getElementById('start-wpm').value) || 100;  // Assignem a la variable global
    targetWPM = parseInt(document.getElementById('target-wpm').value) || 300;
    accelerationTime = (parseInt(document.getElementById('acceleration-time').value) || 10) * 1000; // Convertir a ms

    // Validar valores
    if (startWPM >= targetWPM) {
        alert('La velocidad inicial debe ser menor que la velocidad objetivo.');
        return;
    }

    // Tokenizar texto
    wordsArray = tokenizeText(text);
    if (wordsArray.length === 0) {
        alert('No se encontraron palabras válidas en el texto.');
        return;
    }

    // Inicializar variables
    currentIndex = 0;
    currentWPM = startWPM;
    startTime = Date.now();

    // Ocultar popup y mostrar controles
    toggleInputPopup(false);
    document.getElementById('controls-overlay').style.display = 'flex';

    // Iniciar bucle de lectura
    renderNextWord();
}

/**
 * Función recursiva que renderiza la siguiente palabra.
 * Calcula la posición para que la letra resaltada siempre esté en el mismo eje vertical.
 */
function renderNextWord() {
    // Verificar fin del ejercicio
    if (currentIndex >= wordsArray.length) {
        stopExercise();
        return;
    }

    const wordContainer = document.getElementById('word-display');
    const word = wordsArray[currentIndex];
    const focusIndex = getFocusIndex(word);

    // Construir la palabra con la letra resaltada
    const before = word.slice(0, focusIndex);
    const focusChar = word[focusIndex];
    const after = word.slice(focusIndex + 1);

    wordContainer.innerHTML = `${before}<span class="highlight">${focusChar}</span>${after}`;

    // Alinear la letra resaltada con la guía vertical
    alignFocusLetter(wordContainer, focusIndex);

    // Actualizar barra de progreso
    updateProgressBar(currentIndex, wordsArray.length);

    // Calcular delay actual
    const baseDelay = 60000 / currentWPM; // ms por palabra
    const delay = calculateWordDelay(word, baseDelay);

    // Programar siguiente palabra
    timerId = setTimeout(() => {
        currentIndex++;
        // Actualizar WPM si estamos en fase de aceleración
        if (accelerationTime > 0) {
            const elapsed = Date.now() - startTime;
            if (elapsed < accelerationTime) {
                const progress = elapsed / accelerationTime;
                currentWPM = startWPM + (targetWPM - startWPM) * progress;
            } else {
                currentWPM = targetWPM;
            }
        }
        renderNextWord();
    }, delay);
}

/**
 * Detiene el ejercicio y limpia los temporizadores activos.
 */
function stopExercise() {
    if (timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
    // Mostrar mensaje de finalización
    document.getElementById('word-display').textContent = '¡Fin!';
    document.getElementById('controls-overlay').style.display = 'none';
    // Volver a mostrar el botón de configuración
    document.getElementById('config-btn').style.display = 'flex';
}

// --- Gestión de interfaz ---

/**
 * Cambia el tema de la aplicación (Claro/Oscuro).
 * @param {boolean} isDark - Estado deseado del modo oscuro.
 */
function toggleTheme(isDark) {
    const body = document.body;
    if (isDark) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

/**
 * Ajusta el tamaño de la fuente del contenedor principal.
 * @param {number} scale - Valor del slider de tamaño.
 */
function updateFontSize(scale) {
    const wordDisplay = document.getElementById('word-display');
    // Convertir el valor del slider a un tamaño de fuente razonable
    const fontSizeRem = scale * 2; // Multiplicador arbitrario para buen rango visual
    wordDisplay.style.fontSize = `${fontSizeRem}rem`;
    localStorage.setItem('fontSizeScale', scale);
}

/**
 * Ajusta la posición horizontal del contenedor de la palabra para que la letra resaltada quede alineada con la guía vertical.
 * @param {HTMLElement} wordContainer - Elemento que contiene la palabra completa con la letra resaltada.
 * @param {number} focusIndex - Índice de la letra resaltada en la palabra.
 */
function alignFocusLetter(wordContainer, focusIndex) {
    const highlightSpan = wordContainer.querySelector('.highlight');
    if (!highlightSpan) return;

    // Posición de la guía vertical en píxeles (un tercio del ancho de la ventana)
    const guideX = window.innerWidth * 0.3333;

    // Forzar un reflow para obtener dimensiones precisas
    wordContainer.style.transform = 'translateX(0)';
    const highlightRect = highlightSpan.getBoundingClientRect();

    // Calcular el desplazamiento necesario para que la letra resaltada quede en la posición de la guía
    const offsetX = guideX - (highlightRect.left + highlightRect.width / 2);

    // Aplicar el desplazamiento al contenedor de la palabra (transform translateX)
    wordContainer.style.transform = `translateX(${offsetX}px)`;
}

/**
 * Actualiza la barra de progreso inferior.
 * @param {number} current - Índice de la palabra actual.
 * @param {number} total - Total de palabras en el texto.
 */
function updateProgressBar(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

/**
 * Muestra u oculta el popup de configuración de texto.
 * @param {boolean} visible - Estado de visibilidad.
 */
function toggleInputPopup(visible) {
    const popup = document.getElementById('input-popup');
    const configBtn = document.getElementById('config-btn');

    if (visible) {
        popup.style.display = 'block';
        configBtn.style.display = 'none';
    } else {
        popup.style.display = 'none';
        configBtn.style.display = 'flex';
    }
}

// Initialize theme from localStorage or system preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        toggleTheme(true);
    }
}

// Initialize font size from localStorage
function initializeFontSize() {
    const savedScale = localStorage.getItem('fontSizeScale');
    if (savedScale !== null) {
        const slider = document.getElementById('font-size-slider');
        slider.value = savedScale;
        updateFontSize(parseFloat(savedScale));
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        toggleTheme(!isCurrentlyDark);
    });

    // Font size slider
    const fontSlider = document.getElementById('font-size-slider');
    fontSlider.addEventListener('input', (e) => {
        updateFontSize(parseFloat(e.target.value));
    });

    // Config popup toggle
    const configBtn = document.getElementById('config-btn');
    configBtn.addEventListener('click', () => {
        toggleInputPopup(true);
    });

    // Start button
    const startBtn = document.getElementById('start-button');
    startBtn.addEventListener('click', () => {
        document.getElementById('stop-button').style.display = 'inline-block';
        startExercise();
    });


    // Stop button
    const stopBtn = document.getElementById('stop-button');
    stopBtn.addEventListener('click', () =>{
        document.getElementById('stop-button').style.display = 'none';
        stopExercise();
    });

    // Close popup when clicking outside
    const popup = document.getElementById('input-popup');
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            toggleInputPopup(false);
        }
    });

    // Initialize settings on load
    initializeTheme();
    initializeFontSize();

    // Initially hide the popup
    toggleInputPopup(false);
});