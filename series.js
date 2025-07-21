// series.js
// Este script maneja la lógica de la página de detalles de la serie (series.html)
// para mostrar la descripción de la serie y la lista de sus capítulos con muros de pago.

// Ya no necesitamos pollingIntervals para pagos NANO, pero lo dejamos si lo vas a usar para otra cosa.
// const pollingIntervals = {};

// URL base de tu nuevo backend de créditos (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const BACKEND_API_BASE_URL = 'https://a5927ed9faa0.ngrok-free.app'; // Asegúrate de que esta URL sea la de tu Ngrok actual

// --- REMOVER funciones relacionadas con NANO que ya no aplican ---
// Ya no necesitamos copyToClipboard, convertNanoToRaw, generateAndShowQR, verifyChapterPaymentStatus
// Borra o comenta esas funciones.
// Si tu HTML tiene elementos relacionados con QR/Nano, también tendrás que quitarlos o adaptarlos.

// Nueva función: Obtener el token JWT del localStorage
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

// Nueva función: Verificar si el usuario ya "compró" este capítulo (o si lo tiene en su lista de acceso)
// Esto sería idealmente un llamado al backend, pero por ahora podemos usar localStorage para simular.
function isChapterUnlockedLocally(chapterId) {
    // En un sistema real, el backend debería decirnos si el usuario tiene acceso
    // Podrías tener una tabla en la BD como 'user_content_access'
    return localStorage.getItem(`unlocked_chapter_${chapterId}`) === 'true';
}

// Función para actualizar la UI de un capítulo
// Ahora usa 'costoCreditos' en lugar de 'paymentData'
function updateChapterUI(chapterItemElement, chapterData, isUnlocked) {
    const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
    const chapterPaymentSection = chapterItemElement.querySelector('.chapter-payment-section'); // La sección de "pago"
    const chapterUnlockedMessage = chapterItemElement.querySelector('.chapter-unlocked-message');
    const chapterCostDisplay = chapterItemElement.querySelector('.chapter-cost-display'); // Nuevo elemento para mostrar el costo
    const chapterMessageDiv = chapterItemElement.querySelector('.chapter-message'); // Para mensajes de error/info
    
    // Asegúrate de que estos elementos existan en tu HTML
    // Si tenías elementos de QR/dirección NANO, remuévelos o hazlos hidden.
    
    if (isUnlocked) {
        chapterActionButton.textContent = 'Ver Capítulo';
        chapterActionButton.disabled = false;
        chapterActionButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700'); // Quita estilos de "desbloquear"
        chapterActionButton.classList.add('bg-blue-600', 'hover:bg-blue-700'); // Añade estilos de "ver"
        
        chapterPaymentSection.classList.add('hidden'); // Oculta la sección de "pago" (créditos)
        chapterUnlockedMessage.classList.remove('hidden'); // Muestra mensaje de desbloqueado
        if (chapterCostDisplay) chapterCostDisplay.classList.add('hidden'); // Oculta el costo
        if (chapterMessageDiv) chapterMessageDiv.classList.add('hidden'); // Oculta mensajes
        
    } else {
        chapterActionButton.textContent = `Desbloquear por ${chapterData.credit_cost} Créditos`; // Muestra el costo
        chapterActionButton.disabled = false; // Siempre habilitado para intentar desbloquear
        chapterActionButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        chapterActionButton.classList.add('bg-yellow-600', 'hover:bg-yellow-700'); // Estilo para desbloquear
        
        chapterPaymentSection.classList.remove('hidden'); // Muestra la sección de "pago"
        chapterUnlockedMessage.classList.add('hidden'); // Oculta mensaje de desbloqueado
        if (chapterCostDisplay) {
            chapterCostDisplay.textContent = `Costo: ${chapterData.credit_cost} Créditos`;
            chapterCostDisplay.classList.remove('hidden');
        }
        if (chapterMessageDiv) chapterMessageDiv.classList.add('hidden'); // Oculta mensajes
    }
}

// Función para manejar el clic en el botón "Ver Capítulo" / "Desbloquear"
async function handleChapterActionClick(chapterItemElement) {
    const chapterId = chapterItemElement.dataset.chapterId;
    const chapterData = CHAPTER_DATA[chapterId]; // Obtener los datos del capítulo, incluido el costo
    const contentType = 'chapter'; // Puedes hardcodear 'chapter' o pasarlo dinámicamente

    // Primero, verifica si ya está desbloqueado (localmente)
    const isUnlocked = isChapterUnlockedLocally(chapterId);
    if (isUnlocked) {
        console.log(`Capítulo ${chapterId} ya desbloqueado. Redirigiendo.`);
        location.href = `player/player.html?id=${chapterId}`;
        return;
    }

    // Si no está desbloqueado, procede a intentar desbloquear con créditos
    const jwtToken = getAuthToken();
    if (!jwtToken) {
        alert('Necesitas iniciar sesión para desbloquear contenido.');
        window.location.href = 'login.html'; // Redirige a la página de login
        return;
    }

    const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const chapterMessageDiv = chapterItemElement.querySelector('.chapter-message');

    chapterMessageDiv.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    chapterActionButton.disabled = true;

    try {
        console.log(`Intentando gastar ${chapterData.credit_cost} créditos para ${chapterId}...`);
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/credits/spend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}` // Enviar el token JWT
            },
            body: JSON.stringify({
                contentId: chapterId,
                contentType: contentType // 'chapter' o 'movie'
            }),
        });

        loadingSpinner.classList.add('hidden');

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Error al desbloquear ${chapterId}.`);
        }

        const data = await response.json();
        console.log("Respuesta de gasto de créditos:", data);
        
        // Si el backend confirma el gasto y el nuevo saldo
        if (data.message === 'Contenido desbloqueado con éxito' || data.newBalance !== undefined) {
            localStorage.setItem(`unlocked_chapter_${chapterId}`, 'true'); // Marca como desbloqueado localmente
            // No necesitamos un payment_token para el reproductor en este modelo.
            // El reproductor solo necesita el JWT y puede hacer su propia verificación si es necesario.
            
            chapterMessageDiv.textContent = `¡Capítulo desbloqueado! Nuevo saldo: ${data.newBalance} créditos.`;
            chapterMessageDiv.classList.remove('hidden');
            chapterMessageDiv.classList.add('text-green-500'); // Estilo de éxito

            updateChapterUI(chapterItemElement, chapterData, true); // Actualiza la UI a desbloqueado

            // --- REDIRECCIÓN AUTOMÁTICA DESPUÉS DEL DESBLOQUEO ---
            setTimeout(() => {
                location.href = `player/player.html?id=${chapterId}`;
            }, 1500);
            // --- FIN REDIRECCIÓN AUTOMÁTICA ---
        } else {
             // Esto no debería pasar si la respuesta.ok fue true, pero es un fallback
            throw new Error(data.message || 'Error desconocido al desbloquear contenido.');
        }

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        chapterActionButton.disabled = false; // Habilitar botón si falla
        chapterMessageDiv.textContent = `Error: ${error.message}`;
        chapterMessageDiv.classList.remove('hidden');
        chapterMessageDiv.classList.add('text-red-500'); // Estilo de error
        console.error('Error en handleChapterActionClick (gasto de créditos):', error);
    }
}


// Función para renderizar los capítulos de una serie
function renderChapters(seriesId) {
    const chaptersListContainer = document.getElementById('chapters-list-container');
    chaptersListContainer.innerHTML = '';

    let hasChapters = false;
    for (const chapterId in CHAPTER_DATA) {
        if (CHAPTER_DATA.hasOwnProperty(chapterId) && CHAPTER_DATA[chapterId].seriesId === seriesId) {
            hasChapters = true;
            const chapter = CHAPTER_DATA[chapterId];

            const chapterItemElement = document.createElement('div');
            chapterItemElement.className = 'chapter-item bg-gray-700 rounded-lg p-4 mb-4 shadow-md';
            chapterItemElement.dataset.chapterId = chapterId;

            // --- CORRECCIÓN EN EL HTML INTERNO DEL CAPÍTULO (asegura el anidamiento correcto) ---
            chapterItemElement.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-xl font-semibold text-white">${chapter.title}</h4>
                    <button class="chapter-action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Ver Capítulo
                    </button>
                </div>
                <div class="chapter-unlocked-message text-green-400 text-center text-lg font-medium hidden mb-4">
                    ¡Capítulo Desbloqueado!
                </div>
                <div class="chapter-payment-section">
                    <p class="chapter-cost-display text-gray-300 mb-3"></p>
                    <div class="loading-spinner hidden mt-3 mx-auto w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p class="chapter-message text-center mt-3 hidden"></p>
                </div>
            `;
            // --- FIN CORRECCIÓN EN EL HTML INTERNO DEL CAPÍTULO ---

            chaptersListContainer.appendChild(chapterItemElement);

            const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
            chapterActionButton.addEventListener('click', () => {
                handleChapterActionClick(chapterItemElement);
            });

            // No más `copy-address-btn`

            const isUnlocked = isChapterUnlockedLocally(chapterId); // Verificar si ya está desbloqueado
            updateChapterUI(chapterItemElement, chapter, isUnlocked); // Pasar chapterData para el costo
            
            // Ya no hay polling para pagos NANO, así que esta sección se elimina
            /*
            const savedToken = localStorage.getItem(chapterId + '_payment_token');
            if (!isUnlocked && savedToken) {
                // ... lógica de polling eliminada ...
            }
            */
        }
    }

    if (!hasChapters) {
        chaptersListContainer.innerHTML = '<p class="text-gray-400 text-center">No hay capítulos disponibles para esta serie.</p>';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("series.js: DOMContentLoaded - Iniciando.");
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    // **IMPORTANTE**: Necesitas definir CHAPTER_DATA y SERIES_DATA en algún lugar
    // Si están en otro script, asegúrate de que se cargue antes que series.js
    if (typeof SERIES_DATA === 'undefined') {
        console.error("series.js: SERIES_DATA no está definido. Asegúrate de que tu archivo de datos de series esté cargado.");
        // Podrías cargarlos dinámicamente desde el backend aquí si quisieras
        return;
    }
    if (typeof CHAPTER_DATA === 'undefined') {
        console.error("series.js: CHAPTER_DATA no está definido. Asegúrate de que tu archivo de datos de capítulos esté cargado.");
        return;
    }


    if (seriesId && SERIES_DATA[seriesId]) {
        const series = SERIES_DATA[seriesId];
        document.getElementById('series-page-title').textContent = series.title;
        document.getElementById('series-title').textContent = series.title;
        document.getElementById('series-description').textContent = series.description;
        document.getElementById('series-cover-image').src = series.image;
        document.getElementById('series-cover-image').alt = series.title;

        renderChapters(seriesId);
    } else {
        console.error('series.js: ID de serie no encontrado o inválido en la URL.');
        alert('Serie no encontrada o ID inválido. Redirigiendo a la página principal.');
        window.location.href = 'index.html';
    }
});