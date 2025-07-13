// --- Mapeo de IDs de video a sus datos (magnet link, título, descripción, monto de pago) ---
const VIDEO_DATA = {
    'vigilante_s1_ep1': {
        title: 'Vigilante: Boku no Hero Academia ILLEGALS - Capítulo 1',
        description: 'Explora los orígenes y las aventuras de los vigilantes en el universo de My Hero Academia. Este capítulo introductorio te sumerge en el mundo antes de los héroes oficiales, presentando personajes carismáticos y una trama llena de acción y misterio.',
        magnetLink: 'magnet:?xt=urn:btih:5ab5136378ac9f996f4d7ca6855823bef3f49b45&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+1+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
        amountNano: 0.001
    },
    'vigilante_s1_ep2': {
        title: 'Vigilante: Boku no Hero Academia ILLEGALS - Capítulo 2',
        description: 'Continúa la emocionante historia con nuevas revelaciones y desafíos para nuestros héroes. ¡No te lo pierdas!',
        magnetLink: 'magnet:?xt=urn:btih:665f5667ef96f506d0579ea1e26546d9c0767e74&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+2+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL DEL CAPÍTULO 2!
        amountNano: 0.002
    },
    'vigilante_s1_ep3': {
        title: 'Vigilante: Boku no Hero Academia ILLEGALS - Capítulo 3',
        description: 'La trama se complica con giros inesperados y batallas épicas. ¡Descubre el destino de los vigilantes!',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_CAPITULO_3_AQUI&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+3.mp4&tr=...', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL DEL CAPÍTULO 3!
        amountNano: 0.002
    },
    'otra_serie_ep1': {
        title: 'Otra Serie Genial - Capítulo Piloto',
        description: 'Una emocionante nueva serie que te dejará al borde de tu asiento.',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_OTRA_SERIE_AQUI&dn=Otra+Serie+Cap+1.mp4&tr=...', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL!
        amountNano: 0.002
    },
    'otra_serie_ep2': {
        title: 'Otra Serie Genial - Capítulo 1',
        description: 'El primer gran desafío en esta nueva saga.',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_OTRA_SERIE_EP2_AQUI&dn=Otra+Serie+Cap+2.mp4&tr=...', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL!
        amountNano: 0.002
    }
};

// --- Variables para el video actual ---
let currentVideoId = null;
let currentVideoData = null;
let LOCAL_STORAGE_ACCESS_KEY = null; // Clave para el estado de desbloqueo en localStorage
let LOCAL_STORAGE_PAYMENT_TOKEN_KEY = null; // Clave para el token de pago en localStorage

// --- COMIENZO DE LA LÓGICA WEBTORRENT ---
const webTorrentPlayerContainer = document.getElementById('webtorrent-player-container');
const webTorrentStatusDiv = document.getElementById('webtorrent-status');
const videoElement = document.getElementById('videoPlayer'); // Obtener el elemento video directamente

function initializeAndLoadWebTorrentVideo() {
    console.log("WebTorrent: Iniciando carga de video...");
    if (!currentVideoData || !currentVideoData.magnetLink) {
        console.error('WebTorrent: No se pudo cargar el video: Datos del video o enlace magnet no disponibles.');
        webTorrentStatusDiv.textContent = 'Error: No se pudo cargar la información del video.';
        return;
    }
    console.log("WebTorrent: Magnet Link:", currentVideoData.magnetLink);

    if (typeof WebTorrent === 'undefined') {
        console.error('WebTorrent: WebTorrent no está definido. El script no se cargó correctamente.');
        webTorrentStatusDiv.textContent = 'Error: El reproductor no se pudo cargar. Revisa la consola del navegador.';
        return;
    }

    // Limpiar cualquier cliente WebTorrent anterior para evitar conflictos
    if (window.webtorrentClient) {
        console.log("WebTorrent: Destruyendo cliente anterior.");
        window.webtorrentClient.destroy();
    }
    const client = new WebTorrent({
        tracker: {},
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    });
    window.webtorrentClient = client; // Guarda el cliente en el objeto window para poder destruirlo

    client.on('error', (err) => {
        console.error('WebTorrent Error:', err);
        webTorrentStatusDiv.textContent = `Error de WebTorrent: ${err.message || err}`;
    });

    // ¡IMPORTANTE! Solo actualizamos el párrafo de estado, NO el innerHTML del contenedor del video.
    webTorrentStatusDiv.textContent = 'Cargando metadatos del video...';

    client.add(currentVideoData.magnetLink, (torrent) => {
        console.log('WebTorrent: Cliente descargando:', torrent.infoHash);
        webTorrentStatusDiv.textContent = `Descargando: ${torrent.name}`;

        const file = torrent.files.find((f) => {
            return f.name.endsWith('.mp4') || f.name.endsWith('.webm') || f.name.endsWith('.mkv');
        });

        if (file) {
            console.log('WebTorrent: Archivo de video encontrado:', file.name);
            
            if (videoElement) {
                // Asegurarse de que el elemento video esté visible y tenga dimensiones
                videoElement.classList.remove('hidden'); 
                videoElement.classList.add('w-full', 'h-auto', 'block'); // Añadir clases de Tailwind para dimensiones

                // Renderizar el archivo directamente al elemento video
                file.renderTo(videoElement, {
                    autoplay: true, 
                    controls: true,
                    // muted: true // Ya está en el HTML, pero se puede forzar aquí si es necesario
                }, (err) => {
                    if (err) {
                        console.error('WebTorrent: Error al añadir archivo al reproductor:', err);
                        webTorrentStatusDiv.textContent = `Error de reproducción: ${err.message}`;
                        return;
                    }
                    console.log('WebTorrent: Video listo para reproducir:', file.name);
                    webTorrentStatusDiv.textContent = `Reproduciendo: ${file.name}`;
                    // Intentar reproducir, capturando el error de autoplay si ocurre (aunque muted debería evitarlo)
                    videoElement.play().catch(e => {
                        console.warn("WebTorrent: Autoplay bloqueado (probablemente no silenciado o interacción):", e);
                        webTorrentStatusDiv.textContent = 'Haz clic en el video para reproducir (autoplay bloqueado).';
                    });
                });
            } else {
                console.error("WebTorrent: Elemento #videoPlayer no encontrado en el DOM.");
                webTorrentStatusDiv.textContent = "Error: El reproductor de video no se pudo inicializar.";
            }

            torrent.on('download', () => {
                const progress = (torrent.progress * 100).toFixed(1);
                webTorrentStatusDiv.textContent = `Descargando: ${torrent.name} (${progress}%) - Velocidad: ${(client.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`;
            });
        } else {
            console.error('WebTorrent: No se encontró un archivo de video compatible en el torrent.');
            webTorrentStatusDiv.textContent = 'Error: No se encontró video compatible.';
        }
    });
}
// --- FIN DE LA LÓGICA WEBTORRENT ---

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const pageTitleElement = document.getElementById('page-title');
const videoDisplayTitle = document.getElementById('video-display-title');
const videoDisplayDescription = document.getElementById('video-display-description');
const accessAmountSpan = document.getElementById('access-amount'); // Para mostrar el monto en el muro de acceso

const accessSection = document.getElementById('access-section');
const paymentSection = document.getElementById('payment-section');
const videoSection = document.getElementById('video-section');
const amountToPaySpan = document.getElementById('amountToPay');
const paymentAddressSpan = document.getElementById('payment-address');
const qrCodeDiv = document.getElementById('qr-code');
const paymentStatusMessage = document.getElementById('paymentStatusMessage');
const checkPaymentButton = document.getElementById('checkPaymentButton');
const errorMessage = document.getElementById('errorMessage');

let currentPaymentToken = null; // Para almacenar el token de pago actual
let checkPaymentInterval = null; // Para el intervalo de verificación de pago

/**
 * Función para mostrar el video y ocultar las otras secciones.
 * Esta función también inicia la carga del video WebTorrent.
 */
function showVideoContent() {
    console.log("showVideoContent: Mostrando sección de video.");
    accessSection.classList.add('hidden'); // Oculta la sección de acceso
    paymentSection.classList.add('hidden'); // Oculta la sección de pago
    videoSection.classList.remove('hidden'); // Muestra la sección de video

    // *** LLAMADA A LA FUNCIÓN WEBTORRENT CUANDO EL VIDEO ES DESBLOQUEADO ***
    initializeAndLoadWebTorrentVideo();
}

/**
 * Función para verificar si el video ya ha sido desbloqueado previamente
 * consultando el localStorage.
 * @returns {boolean} - true si ya está desbloqueado, false en caso contrario.
 */
function checkLocalStorageAccess(chapterId) {
    // Generamos la clave de la misma manera que en script.js
    const unlockedKey = `${chapterId}_unlocked`;
    const isUnlocked = localStorage.getItem(unlockedKey) === 'true';
    console.log(`checkLocalStorageAccess: Clave de localStorage buscada: "${unlockedKey}"`);
    console.log(`checkLocalStorageAccess: Valor encontrado para "${unlockedKey}": "${localStorage.getItem(unlockedKey)}"`);
    console.log(`checkLocalStorageAccess: Capítulo ${chapterId} está desbloqueado en localStorage? ${isUnlocked}`);
    return isUnlocked;
}

/**
 * Función para guardar el estado de desbloqueo en localStorage.
 */
function saveAccessToLocalStorage() {
    console.log(`saveAccessToLocalStorage: Marcando capítulo ${currentVideoId} como desbloqueado.`);
    localStorage.setItem(LOCAL_STORAGE_ACCESS_KEY, 'true');
    localStorage.removeItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY); // Limpiar el token una vez desbloqueado
}

// Función para convertir NANO a RAW (para el QR code)
// Nano tiene 30 decimales. 1 NANO = 10^30 RAW
function convertNanoToRaw(nanoAmount) {
    if (typeof Decimal === 'undefined') {
        console.error('Decimal.js no está cargado. No se puede convertir a RAW con precisión.');
        return (parseFloat(nanoAmount) * (10**30)).toFixed(0);
    }
    const nanoDecimal = new Decimal(nanoAmount);
    const rawMultiplier = new Decimal('10').pow(30);
    return nanoDecimal.mul(rawMultiplier).toFixed(0);
}

// --- FUNCIÓN PARA VERIFICAR EL ESTADO DEL PAGO DIRECTAMENTE CON ACCEPT-NANO ---
async function checkPaymentStatus(token) {
    if (!token) {
        console.error("checkPaymentStatus: No hay token de pago para verificar.");
        return;
    }
    console.log(`checkPaymentStatus: Verificando token ${token} para capítulo ${currentVideoId}...`);

    paymentStatusMessage.className = 'status-message status-pending';
    paymentStatusMessage.textContent = 'Verificando pago...';
    checkPaymentButton.disabled = true;

    try {
        const response = await fetch('https://fa20bb3b1e8a.ngrok-free.app/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al verificar pago: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("checkPaymentStatus: Respuesta de /api/verify:", data);

        amountToPaySpan.textContent = data.amount;
        paymentAddressSpan.textContent = data.account;

        // Generar QR Code
        const rawAmount = convertNanoToRaw(data.amount);
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        qrCodeDiv.innerHTML = ''; // Limpiar cualquier QR anterior
        new QRCode(qrCodeDiv, {
            text: nanoUri,
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        if (data.fulfilled) {
            console.log(`checkPaymentStatus: Pago para ${currentVideoId} CONFIRMADO.`);
            clearInterval(checkPaymentInterval); // Detener el polling
            paymentStatusMessage.className = 'status-message status-completed';
            paymentStatusMessage.textContent = `¡Pago confirmado! Recibido: ${data.balance} NANO.`;
            saveAccessToLocalStorage(); // Marcar como desbloqueado
            showVideoContent(); // Muestra el video
        } else {
            paymentStatusMessage.className = 'status-message status-pending';
            paymentStatusMessage.textContent = 'Pago pendiente. Esperando confirmación...';
            // Si el token no está fulfilled pero ya ha expirado, podríamos manejarlo aquí
            // if (data.remainingSeconds <= 0) { /* handle expired */ }
        }
    } catch (error) {
        console.error('checkPaymentStatus: Error al verificar pago:', error);
        errorMessage.textContent = `Error al verificar: ${error.message || 'Error desconocido.'}`;
        clearInterval(checkPaymentInterval); // Detener el polling en caso de error grave
        paymentStatusMessage.textContent = 'Error al verificar pago. Intenta de nuevo.';
        paymentStatusMessage.className = 'status-message';
    } finally {
        checkPaymentButton.disabled = false;
    }
}

// Event listener para el botón de verificación manual (si existe y es visible)
if (checkPaymentButton) {
    checkPaymentButton.addEventListener('click', () => {
        checkPaymentStatus(currentPaymentToken);
    });
}


// --- LÓGICA DE INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("player-script.js: DOMContentLoaded - Iniciando.");
    // Obtener el ID del video de la URL
    const urlParams = new URLSearchParams(window.location.search);
    currentVideoId = urlParams.get('id');
    // --- NUEVO: Leer el parámetro 'unlocked' de la URL ---
    const unlockedFromUrl = urlParams.get('unlocked') === 'true';
    console.log(`player-script.js: Parámetro 'unlocked' de la URL: ${unlockedFromUrl}`);
    // --- FIN NUEVO ---

    console.log(`player-script.js: ID de video de la URL: ${currentVideoId}`);

    if (currentVideoId && VIDEO_DATA[currentVideoId]) {
        currentVideoData = VIDEO_DATA[currentVideoId];
        // Generamos las claves de localStorage aquí
        LOCAL_STORAGE_ACCESS_KEY = `video_${currentVideoId}_unlocked`;
        LOCAL_STORAGE_PAYMENT_TOKEN_KEY = `video_${currentVideoId}_payment_token`;
        console.log(`player-script.js: Datos del video cargados para ${currentVideoId}.`);

        pageTitleElement.textContent = currentVideoData.title;
        videoDisplayTitle.textContent = currentVideoData.title;
        videoDisplayDescription.textContent = currentVideoData.description;
        if (accessAmountSpan) { // Asegurarse de que el elemento exista
            accessAmountSpan.textContent = currentVideoData.amountNano;
        }


        // Priorizamos el estado de desbloqueo de la URL
        if (unlockedFromUrl || checkLocalStorageAccess(currentVideoId)) { // Pasamos currentVideoId a la función
            // Si ya está desbloqueado (por URL o localStorage), muestra el video directamente
            console.log(`player-script.js: Capítulo ${currentVideoId} desbloqueado (por URL o localStorage). Mostrando contenido.`);
            // Asegurarnos de que el estado se guarde en localStorage si vino de la URL
            if (unlockedFromUrl && !checkLocalStorageAccess(currentVideoId)) {
                console.log("player-script.js: Desbloqueado por URL, guardando en localStorage para futuras visitas.");
                saveAccessToLocalStorage(); // Guardar en localStorage para futuras visitas
            }
            showVideoContent();
        } else {
            // Si no está desbloqueado, intenta recuperar un token de pago pendiente
            currentPaymentToken = localStorage.getItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY);
            console.log(`player-script.js: Token de pago guardado en localStorage: ${currentPaymentToken}`);

            if (currentPaymentToken) {
                // Si hay un token de pago pendiente, muestra la sección de pago y comienza a verificar
                console.log(`player-script.js: Capítulo ${currentVideoId} tiene un pago pendiente, reanudando verificación.`);
                accessSection.classList.add('hidden');
                paymentSection.classList.remove('hidden');
                videoSection.classList.add('hidden');

                // Limpiar cualquier intervalo anterior para evitar duplicados
                if (checkPaymentInterval) {
                    clearInterval(checkPaymentInterval);
                }
                checkPaymentInterval = setInterval(() => checkPaymentStatus(currentPaymentToken), 5000); // Polling cada 5 segundos
                checkPaymentStatus(currentPaymentToken); // Verificación inicial inmediata
            } else {
                // Si no está desbloqueado y no hay token pendiente, muestra la sección de acceso
                console.log(`player-script.js: Capítulo ${currentVideoId} no desbloqueado y sin pago pendiente. Mostrando muro de acceso.`);
                accessSection.classList.remove('hidden');
                paymentSection.classList.add('hidden');
                videoSection.classList.add('hidden');
                // Aquí podrías mostrar el monto que costaría desbloquearlo
                accessSection.querySelector('p').textContent = `Este capítulo requiere ser desbloqueado para su visualización. El costo es de ${currentVideoData.amountNano} NANO. Por favor, regresa a la página principal para iniciar el pago.`;
            }
        }
    } else {
        console.error('player-script.js: ID de video no encontrado o inválido en la URL.');
        // Si no hay ID o es inválido, redirige a la página principal
        alert('Video no encontrado o ID inválido. Redirigiendo a la página principal.');
        window.location.href = '../index.html';
        document.body.innerHTML = '<h1>Error: Video no disponible.</h1><p>Por favor, regresa a la <a href="../index.html">página principal</a>.</p>';
    }
});
