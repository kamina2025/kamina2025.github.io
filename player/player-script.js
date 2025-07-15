// player/player-script.js
// Este script maneja la lógica de reproducción del video y la verificación de acceso.

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
// Esta URL debe ser la misma que en series.js
const ACCEPT_NANO_API_BASE_URL = 'https://92e1dc490c38.ngrok-free.app'; // <--- ¡VERIFICA Y ACTUALIZA ESTA URL CON TU NGROK ACTUAL!

document.addEventListener('DOMContentLoaded', async () => {
    console.log("player-script.js: DOMContentLoaded - Iniciando.");

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('id');
    console.log(`DEBUG: chapterId extraído de la URL: "${chapterId}"`);

    // Obtenemos una referencia al elemento <video> directamente
    const videoPlayerElement = document.getElementById('videoPlayer'); // <--- ¡NUEVA LÍNEA! Referencia al elemento <video>
    const errorMessageDiv = document.getElementById('error-message');
    const videoTitleElement = document.getElementById('video-title');

    if (!chapterId) {
        errorMessageDiv.textContent = 'Error: ID de capítulo no proporcionado en la URL.';
        errorMessageDiv.classList.remove('hidden');
        console.error("player-script.js: ID de capítulo no encontrado en la URL.");
        return;
    }

    // Obtener el token de pago del localStorage
    const paymentToken = localStorage.getItem(chapterId + '_payment_token');
    console.log(`DEBUG: paymentToken recuperado para ${chapterId}: "${paymentToken}"`);

    if (!paymentToken) {
        errorMessageDiv.textContent = 'Acceso denegado: No se encontró token de pago para este capítulo. Por favor, desbloquea el capítulo primero.';
        errorMessageDiv.classList.remove('hidden');
        console.warn(`player-script.js: No se encontró token de pago para ${chapterId}. Redirigiendo.`);
        setTimeout(() => {
            const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
            const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
            window.location.href = `../series.html?id=${seriesId}`;
        }, 3000);
        return;
    }

    // --- Paso de Verificación con el Backend ---
    try {
        console.log(`player-script.js: Verificando acceso para capítulo ${chapterId} con el backend...`);
        const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/access-chapter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: paymentToken, chapterId: chapterId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error de verificación de acceso: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("DEBUG: Respuesta del backend para verificación de acceso:", data);

        if (data.accessGranted) {
            console.log(`player-script.js: Acceso concedido para el capítulo ${chapterId}. Cargando video.`);
            errorMessageDiv.classList.add('hidden'); // Ocultar cualquier mensaje de error previo

            console.log(`DEBUG: typeof CHAPTER_DATA: ${typeof CHAPTER_DATA}`);
            const chapter = CHAPTER_DATA[chapterId];
            console.log(`DEBUG: CHAPTER_DATA['${chapterId}']:`, chapter);

            if (!chapter || !chapter.magnetLink) {
                errorMessageDiv.textContent = 'Error: Enlace de video no encontrado para este capítulo o ID de capítulo inválido.';
                errorMessageDiv.classList.remove('hidden');
                console.error(`player-script.js: Capítulo o magnetLink no encontrado para ID: ${chapterId}.`);
                return;
            }

            videoTitleElement.textContent = chapter.title; // Actualiza el título del video

            // --- Lógica de WebTorrent ---
            if (typeof WebTorrent === 'undefined') {
                console.error("WebTorrent no está definido. Asegúrate de que webtorrent.min.js esté cargado en player.html.");
                errorMessageDiv.textContent = 'Error: Reproductor de video no disponible. Recarga la página.';
                errorMessageDiv.classList.remove('hidden');
                return;
            }
            const client = new WebTorrent();
            const magnetURI = chapter.magnetLink;

            client.add(magnetURI, function (torrent) {
                console.log('Client is downloading:', torrent.infoHash);

                torrent.files.forEach(function (file) {
                    if (file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg')) {
                        // Renderizar directamente en el elemento <video>
                        file.renderTo(videoPlayerElement, { // <--- ¡CAMBIO CLAVE AQUÍ! Usamos videoPlayerElement
                            autoplay: true,
                            controls: true
                        });
                        videoPlayerElement.classList.remove('hidden'); // <--- ¡NUEVA LÍNEA! Mostrar el video
                        document.getElementById('video-section').classList.remove('hidden'); // Mostrar la sección del video
                    }
                });
            });
            // --- Fin Lógica de WebTorrent ---

        } else {
            errorMessageDiv.textContent = 'Acceso denegado: Su pago no ha sido verificado o el token es inválido.';
            errorMessageDiv.classList.remove('hidden');
            console.warn(`player-script.js: Acceso denegado para el capítulo ${chapterId}. Redirigiendo.`);
            setTimeout(() => {
                const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
                const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
                window.location.href = `../series.html?id=${seriesId}`;
            }, 3000);
        }

    } catch (error) {
        errorMessageDiv.textContent = `Error al verificar acceso: ${error.message}. Por favor, intenta de nuevo.`;
        errorMessageDiv.classList.remove('hidden');
        console.error(`player-script.js: Error durante la verificación de acceso para ${chapterId}:`, error);
        setTimeout(() => {
            const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
            const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
            window.location.href = `../series.html?id=${seriesId}`;
        }, 5000);
    }
});
