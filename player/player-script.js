// player/player-script.js
// Este script maneja la lógica de reproducción del video y la verificación de acceso.

// URL base de tu nuevo backend de créditos (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const BACKEND_API_BASE_URL = 'https://a5927ed9faa0.ngrok-free.app'; // <--- ¡VERIFICA Y ACTUALIZA ESTA URL CON TU NGROK ACTUAL!
                                                                    // Usa la URL de ngrok que te dio tu terminal

document.addEventListener('DOMContentLoaded', async () => {
    console.log("player-script.js: DOMContentLoaded - Iniciando.");

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('id'); // Este será tu 'contentId'
    const contentType = 'chapter'; // Puedes hardcodear 'chapter' o pasarlo desde series.html si es dinámico
    console.log(`DEBUG: chapterId extraído de la URL: "${chapterId}"`);

    const videoPlayerElement = document.getElementById('videoPlayer');
    const errorMessageDiv = document.getElementById('error-message');
    const videoTitleElement = document.getElementById('video-title');

    if (!chapterId) {
        errorMessageDiv.textContent = 'Error: ID de capítulo no proporcionado en la URL.';
        errorMessageDiv.classList.remove('hidden');
        console.error("player-script.js: ID de capítulo no encontrado en la URL.");
        return;
    }

    // --- Obtener el token JWT del usuario logueado ---
    const jwtToken = localStorage.getItem('jwtToken');
    console.log(`DEBUG: jwtToken recuperado: ${jwtToken ? 'Sí' : 'No'}`);

    if (!jwtToken) {
        errorMessageDiv.textContent = 'Acceso denegado: Necesitas iniciar sesión para ver este contenido.';
        errorMessageDiv.classList.remove('hidden');
        console.warn(`player-script.js: No se encontró JWT. Redirigiendo a login.`);
        setTimeout(() => {
            window.location.href = '../login.html'; // O tu página de login/registro
        }, 3000);
        return;
    }

    // --- Paso de Verificación de Acceso con el Nuevo Backend ---
    // En el nuevo modelo, la "verificación de acceso" para la reproducción
    // ya no es una llamada POST a /api/access-chapter.
    // Asumiremos que si llegamos aquí con un JWT válido, el usuario ya
    // "pagó" con créditos en series.js.
    // Podrías añadir una ruta de backend como `/api/content/check-access`
    // que verifique si el usuario autenticado (via JWT) tiene acceso al contentId.
    // Por simplicidad para este paso, solo nos aseguraremos de que el JWT es válido
    // y luego cargaremos el video.
    // Una opción más robusta sería:
    /*
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/content/check-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ contentId: chapterId, contentType: contentType })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error de verificación de acceso: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.accessGranted) {
            errorMessageDiv.textContent = 'Acceso denegado: No tienes permiso para ver este contenido. Por favor, desbloquéalo.';
            errorMessageDiv.classList.remove('hidden');
            console.warn(`player-script.js: Acceso denegado para el capítulo ${chapterId}.`);
            setTimeout(() => {
                const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
                const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
                window.location.href = `../series.html?id=${seriesId}`;
            }, 3000);
            return;
        }

        console.log(`player-script.js: Acceso concedido para el capítulo ${chapterId}. Cargando video.`);
        errorMessageDiv.classList.add('hidden'); // Ocultar cualquier mensaje de error previo

        // Resto de la lógica de carga del video (WebTorrent)

    } catch (error) {
        errorMessageDiv.textContent = `Error al verificar acceso: ${error.message}. Por favor, intenta de nuevo.`;
        errorMessageDiv.classList.remove('hidden');
        console.error(`player-script.js: Error durante la verificación de acceso para ${chapterId}:`, error);
        setTimeout(() => {
            const seriesIdMatch = chapterId.match(/^(.*_s\d+)/);
            const seriesId = seriesIdMatch ? seriesIdMatch[1] : '';
            window.location.href = `../series.html?id=${seriesId}`;
        }, 5000);
        return; // Detiene la ejecución si hay un error en la verificación
    }
    */

    // --- Si no implementas `check-access` en el backend por ahora, simplemente carga el video si el token es válido ---
    // Advertencia: esto asume que el frontend es el único guardián del acceso una vez "desbloqueado"
    // y que la lógica de "gastar créditos" ya ocurrió.
    // La forma más segura es hacer la verificación en el backend.
    console.log(`player-script.js: JWT presente, procediendo a cargar video para ${chapterId}.`);
    errorMessageDiv.classList.add('hidden'); // Ocultar cualquier mensaje de error previo


    console.log(`DEBUG: typeof CHAPTER_DATA: ${typeof CHAPTER_DATA}`);
    const chapter = CHAPTER_DATA[chapterId]; // Asumiendo CHAPTER_DATA todavía existe y contiene info del video
    console.log(`DEBUG: CHAPTER_DATA['${chapterId}']:`, chapter);

    if (!chapter || !chapter.magnetLink) {
        errorMessageDiv.textContent = 'Error: Enlace de video no encontrado para este capítulo o ID de capítulo inválido.';
        errorMessageDiv.classList.remove('hidden');
        console.error(`player-script.js: Capítulo o magnetLink no encontrado para ID: ${chapterId}.`);
        return;
    }

    videoTitleElement.textContent = chapter.title; // Actualiza el título del video

    // --- Lógica de WebTorrent (esta parte permanece igual) ---
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
                file.renderTo(videoPlayerElement, {
                    autoplay: true,
                    controls: true
                });
                videoPlayerElement.classList.remove('hidden');
                document.getElementById('video-section').classList.remove('hidden');
            }
        });
    });
    // --- Fin Lógica de WebTorrent ---
});