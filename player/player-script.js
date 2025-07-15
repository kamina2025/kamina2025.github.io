// player/player-script.js
// Este script maneja la lógica de reproducción del video y la verificación de acceso.

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
// Esta URL debe ser la misma que en series.js
const ACCEPT_NANO_API_BASE_URL = 'https://92e1dc490c38.ngrok-free.app'; // <--- ¡VERIFICA Y ACTUALIZA ESTA URL CON TU NGROK ACTUAL!

document.addEventListener('DOMContentLoaded', async () => {
    console.log("player-script.js: DOMContentLoaded - Iniciando.");

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('id');
    const videoContainer = document.getElementById('video-container'); // <--- ID a verificar en HTML
    const errorMessageDiv = document.getElementById('error-message'); // <--- ID a verificar en HTML
    const videoTitleElement = document.getElementById('video-title'); // <--- ID a verificar en HTML

    if (!chapterId) {
        errorMessageDiv.textContent = 'Error: ID de capítulo no proporcionado.';
        errorMessageDiv.classList.remove('hidden');
        console.error("player-script.js: ID de capítulo no encontrado en la URL.");
        return;
    }

    // Obtener el token de pago del localStorage
    const paymentToken = localStorage.getItem(chapterId + '_payment_token');

    if (!paymentToken) {
        errorMessageDiv.textContent = 'Acceso denegado: No se encontró token de pago para este capítulo. Por favor, desbloquea el capítulo primero.';
        errorMessageDiv.classList.remove('hidden');
        console.warn(`player-script.js: No se encontró token de pago para ${chapterId}. Redirigiendo.`);
        setTimeout(() => {
            // Redirige a la página de la serie
            // Necesitas extraer el seriesId del chapterId (ej. "vigilante_s1_ep1" -> "vigilante_s1")
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

        if (data.accessGranted) {
            console.log(`player-script.js: Acceso concedido para el capítulo ${chapterId}. Cargando video.`);
            errorMessageDiv.classList.add('hidden'); // Ocultar cualquier mensaje de error previo

            // Obtener datos del capítulo de tu CHAPTER_DATA (asumiendo que está disponible globalmente o lo cargas)
            // Si CHAPTER_DATA no está disponible aquí, necesitarías pasarlo o cargarlo.
            // Por simplicidad, asumimos que CHAPTER_DATA es global o lo importas.
            if (typeof CHAPTER_DATA === 'undefined') {
                console.error("CHAPTER_DATA no está definido. No se puede cargar el video.");
                errorMessageDiv.textContent = 'Error interno: Datos del capítulo no disponibles.';
                errorMessageDiv.classList.remove('hidden');
                return;
            }
            const chapter = CHAPTER_DATA[chapterId];
            if (!chapter || !chapter.magnetLink) {
                errorMessageDiv.textContent = 'Error: Enlace de video no encontrado para este capítulo.';
                errorMessageDiv.classList.remove('hidden');
                return;
            }

            videoTitleElement.textContent = chapter.title; // Actualiza el título del video

            // --- Lógica de WebTorrent ---
            // Asegúrate de que WebTorrent.min.js esté cargado en player.html
            if (typeof WebTorrent === 'undefined') {
                console.error("WebTorrent no está definido. Asegúrate de que webtorrent.min.js esté cargado en player.html.");
                errorMessageDiv.textContent = 'Error: Reproductor de video no disponible. Recarga la página.';
                errorMessageDiv.classList.remove('hidden');
                return;
            }
            const client = new WebTorrent(); // Asumiendo que WebTorrent está cargado globalmente
            const magnetURI = chapter.magnetLink;

            client.add(magnetURI, function (torrent) {
                // Got torrent metadata!
                console.log('Client is downloading:', torrent.infoHash);

                // Display the video in the container
                torrent.files.forEach(function (file) {
                    // Stream the file to the video tag
                    if (file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg')) {
                        file.renderTo(videoContainer, {
                            autoplay: true,
                            controls: true
                        });
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
                window.location.href = `../series.html?id=${seriesId}`; // Redirige a la página de la serie
            }, 3000);
        }

    } catch (error) {
        errorMessageDiv.textContent = `Error al verificar acceso: ${error.message}. Por favor, intenta de nuevo.`;
        errorMessageDiv.classList.remove('hidden');
        console.error(`player-script.js: Error durante la verificación de acceso para ${chapterId}:`, error);
        setTimeout(() => {
            const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
            const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
            window.location.href = `../series.html?id=${seriesId}`; // Redirige a la página de la serie
        }, 5000);
    }
});
