// player/player-script.js
// Este script maneja la lógica de reproducción de video WebTorrent
// y la verificación de pago para un capítulo específico.

// --- Importa los datos de series y capítulos desde data.js ---
// Asegúrate de que data.js se cargue en player.html antes de este script.
// const VIDEO_DATA = { ... }; // ¡Ya no se define aquí! Ahora se importa de data.js
// En su lugar, usaremos CHAPTER_DATA que viene de data.js

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const ACCEPT_NANO_API_BASE_URL = 'https://66d40d2fad2f.ngrok-free.app'; 

// --- Variables para el video actual ---
let currentVideoId = null;
let currentChapterData = null; // Renombrado de currentVideoData a currentChapterData
let LOCAL_STORAGE_ACCESS_KEY = null; // Key for unlock status in localStorage
let LOCAL_STORAGE_PAYMENT_TOKEN_KEY = null; // Key for payment token in localStorage

// --- COMIENZO DE LA LÓGICA WEBTORRENT ---
const webTorrentPlayerContainer = document.getElementById('webtorrent-player-container');
const webTorrentStatusDiv = document.getElementById('webtorrent-status');
const videoElement = document.getElementById('videoPlayer'); // Get the video element directly

function initializeAndLoadWebTorrentVideo() {
    console.log("WebTorrent: Iniciando carga de video...");
    // Ahora usamos currentChapterData y CHAPTER_DATA
    if (!currentChapterData || !currentChapterData.magnetLink) {
        console.error('WebTorrent: No se pudo cargar el video: Datos del capítulo o enlace magnet no disponibles.');
        webTorrentStatusDiv.textContent = 'Error: No se pudo cargar la información del video.';
        return;
    }
    console.log("WebTorrent: Magnet Link:", currentChapterData.magnetLink);

    if (typeof WebTorrent === 'undefined') {
        console.error('WebTorrent: WebTorrent no está definido. El script no se cargó correctamente.');
        webTorrentStatusDiv.textContent = 'Error: El reproductor no se pudo cargar. Revisa la consola del navegador.';
        return;
    }

    // Clear any previous WebTorrent client to avoid conflicts
    if (window.webtorrentClient) {
        console.log("WebTorrent: Destruyendo cliente anterior.");
        window.webtorrentClient.destroy();
    }

    // Initialize WebTorrent client with an expanded list of STUN servers
    const client = new WebTorrent({
        tracker: {
            rtcConfig: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stun.nextcloud.com:443' },
                    { urls: 'stun:stun.voipbuster.com' },
                    { urls: 'stun:stun.ekiga.net' },
                    { urls: 'stun:stun.ideasip.com' },
                    { urls: 'stun:stun.schlund.de' },
                    { urls: 'stun:stun.stunprotocol.org:3478' },
                    { urls: 'stun:stun.counterpath.com:3478' },
                    { urls: 'stun:stun.xten.com:3478' }
                ]
            }
        }
    });
    window.webtorrentClient = client; // Save the client in the window object to destroy it later

    client.on('error', (err) => {
        console.error('WebTorrent Error:', err);
        webTorrentStatusDiv.textContent = `Error de WebTorrent: ${err.message || err}`;
    });

    webTorrentStatusDiv.textContent = 'Cargando metadatos del video...';

    client.add(currentChapterData.magnetLink, (torrent) => { // Usar currentChapterData.magnetLink
        console.log('WebTorrent: Cliente descargando:', torrent.infoHash);
        webTorrentStatusDiv.textContent = `Descargando: ${torrent.name}`;

        const file = torrent.files.find((f) => {
            return f.name.endsWith('.mp4') || f.name.endsWith('.webm') || f.name.endsWith('.mkv');
        });

        if (file) {
            console.log('WebTorrent: Archivo de video encontrado:', file.name);
            
            if (videoElement) {
                videoElement.classList.remove('hidden'); 
                videoElement.classList.add('w-full', 'h-auto', 'block'); 

                file.renderTo(videoElement, {
                    autoplay: true, 
                    controls: true,
                }, (err) => {
                    if (err) {
                        console.error('WebTorrent: Error al añadir archivo al reproductor:', err);
                        webTorrentStatusDiv.textContent = `Error de reproducción: ${err.message}`;
                        return;
                    }
                    console.log('WebTorrent: Video listo para reproducir:', file.name);
                    webTorrentStatusDiv.textContent = `Reproduciendo: ${file.name}`;
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
const accessAmountSpan = document.getElementById('access-amount'); 

const accessSection = document.getElementById('access-section');
const paymentSection = document.getElementById('payment-section');
const videoSection = document.getElementById('video-section');
const amountToPaySpan = document.getElementById('amountToPay');
const paymentAddressSpan = document.getElementById('payment-address');
const qrCodeDiv = document.getElementById('qr-code');
const paymentStatusMessage = document.getElementById('paymentStatusMessage');
const checkPaymentButton = document.getElementById('checkPaymentButton');
const errorMessage = document.getElementById('errorMessage');

let currentPaymentToken = null; 
let checkPaymentInterval = null; 

/**
 * Function to show the video and hide other sections.
 * This function also starts the WebTorrent video loading.
 */
function showVideoContent() {
    console.log("showVideoContent: Mostrando sección de video.");
    accessSection.classList.add('hidden'); 
    paymentSection.classList.add('hidden'); 
    videoSection.classList.remove('hidden'); 

    // *** CALL TO WEBTORRENT FUNCTION WHEN VIDEO IS UNLOCKED ***
    initializeAndLoadWebTorrentVideo();
}

/**
 * Function to check if the video has been unlocked previously
 * by querying localStorage.
 * @returns {boolean} - true if already unlocked, false otherwise.
 */
function checkLocalStorageAccess(chapterId) {
    const unlockedKey = `${chapterId}_unlocked`;
    const isUnlocked = localStorage.getItem(unlockedKey) === 'true';
    console.log(`checkLocalStorageAccess: Clave de localStorage buscada: "${unlockedKey}"`);
    console.log(`checkLocalStorageAccess: Valor encontrado para "${unlockedKey}": "${localStorage.getItem(unlockedKey)}"`);
    console.log(`checkLocalStorageAccess: Capítulo ${chapterId} está desbloqueado en localStorage? ${isUnlocked}`);
    return isUnlocked;
}

/**
 * Function to save unlock status to localStorage.
 */
function saveAccessToLocalStorage() {
    console.log(`saveAccessToLocalStorage: Marcando capítulo ${currentVideoId} como desbloqueado.`);
    localStorage.setItem(LOCAL_STORAGE_ACCESS_KEY, 'true');
    localStorage.removeItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY); 
}

// Function to convert NANO to RAW (for QR code)
// Nano has 30 decimals. 1 NANO = 10^30 RAW
function convertNanoToRaw(nanoAmount) {
    if (typeof Decimal === 'undefined') {
        console.error('Decimal.js no está cargado. No se puede convertir a RAW con precisión.');
        return (parseFloat(nanoAmount) * (10**30)).toFixed(0);
    }
    const nanoDecimal = new Decimal(nanoAmount);
    const rawMultiplier = new Decimal('10').pow(30);
    return nanoDecimal.mul(rawMultiplier).toFixed(0);
}

// --- FUNCTION TO VERIFY PAYMENT STATUS DIRECTLY WITH ACCEPT-NANO ---
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
        const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/verify`, {
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

        // Generate QR Code
        const rawAmount = convertNanoToRaw(data.amount);
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        qrCodeDiv.innerHTML = ''; // Clear any previous QR
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
            clearInterval(checkPaymentInterval); // Stop polling
            paymentStatusMessage.className = 'status-message status-completed';
            paymentStatusMessage.textContent = `¡Pago confirmado! Recibido: ${data.balance} NANO.`;
            saveAccessToLocalStorage(); // Mark as unlocked
            showVideoContent(); // Show the video
        } else {
            paymentStatusMessage.className = 'status-message status-pending';
            paymentStatusMessage.textContent = 'Pago pendiente. Esperando confirmación...';
        }
    } catch (error) {
        console.error('checkPaymentStatus: Error al verificar pago:', error);
        errorMessage.textContent = `Error al verificar: ${error.message || 'Error desconocido.'}`;
        clearInterval(checkPaymentInterval); // Stop polling in case of severe error
        paymentStatusMessage.textContent = 'Error al verificar pago. Intenta de nuevo.';
        paymentStatusMessage.className = 'status-message';
    } finally {
        checkPaymentButton.disabled = false;
    }
}

// Event listener for the manual verification button (if it exists and is visible)
if (checkPaymentButton) {
    checkPaymentButton.addEventListener('click', () => {
        checkPaymentStatus(currentPaymentToken);
    });
}


// --- LÓGICA DE INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("player-script.js: DOMContentLoaded - Iniciando.");
    // Get video ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentVideoId = urlParams.get('id');
    // --- NEW: Read the 'unlocked' parameter from the URL ---
    const unlockedFromUrl = urlParams.get('unlocked') === 'true';
    console.log(`player-script.js: Parámetro 'unlocked' de la URL: ${unlockedFromUrl}`);
    // --- END NEW ---

    console.log(`player-script.js: ID de video de la URL: ${currentVideoId}`);

    // Asegúrate de que CHAPTER_DATA esté definido (viene de data.js)
    if (typeof CHAPTER_DATA === 'undefined') {
        console.error('ERROR: CHAPTER_DATA no está definido. Asegúrate de que data.js se cargue antes de player-script.js en player.html');
        alert('Error al cargar los datos del video. Redirigiendo a la página principal.');
        window.location.href = '../index.html';
        return;
    }

    if (currentVideoId && CHAPTER_DATA[currentVideoId]) { // Usar CHAPTER_DATA
        currentChapterData = CHAPTER_DATA[currentVideoId]; // Asignar a currentChapterData
        
        // Generamos las claves de localStorage aquí
        LOCAL_STORAGE_ACCESS_KEY = `video_${currentVideoId}_unlocked`;
        LOCAL_STORAGE_PAYMENT_TOKEN_KEY = `video_${currentVideoId}_payment_token`;
        console.log(`player-script.js: Datos del capítulo cargados para ${currentVideoId}.`); // Mensaje actualizado

        pageTitleElement.textContent = currentChapterData.title; // Usar currentChapterData
        videoDisplayTitle.textContent = currentChapterData.title; // Usar currentChapterData
        videoDisplayDescription.textContent = currentChapterData.description; // Usar currentChapterData
        if (accessAmountSpan) { 
            accessAmountSpan.textContent = currentChapterData.amountNano; // Usar currentChapterData
        }

        // Prioritize unlock status from URL
        if (unlockedFromUrl || checkLocalStorageAccess(currentVideoId)) { 
            console.log(`player-script.js: Capítulo ${currentVideoId} desbloqueado (por URL o localStorage). Mostrando contenido.`);
            if (unlockedFromUrl && !checkLocalStorageAccess(currentVideoId)) {
                console.log("player-script.js: Desbloqueado por URL, guardando en localStorage para futuras visitas.");
                saveAccessToLocalStorage(); 
            }
            showVideoContent();
        } else {
            currentPaymentToken = localStorage.getItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY);
            console.log(`player-script.js: Token de pago guardado en localStorage: ${currentPaymentToken}`);

            if (currentPaymentToken) {
                console.log(`player-script.js: Capítulo ${currentVideoId} tiene un pago pendiente, reanudando verificación.`);
                accessSection.classList.add('hidden');
                paymentSection.classList.remove('hidden');
                videoSection.classList.add('hidden');

                if (checkPaymentInterval) {
                    clearInterval(checkPaymentInterval);
                }
                checkPaymentInterval = setInterval(() => checkPaymentStatus(currentPaymentToken), 5000); 
                checkPaymentStatus(currentPaymentToken); 
            } else {
                console.log(`player-script.js: Capítulo ${currentVideoId} no desbloqueado y sin pago pendiente. Mostrando muro de acceso.`);
                accessSection.classList.remove('hidden');
                paymentSection.classList.add('hidden');
                videoSection.classList.add('hidden');
                accessSection.querySelector('p').textContent = `Este capítulo requiere ser desbloqueado para su visualización. El costo es de ${currentChapterData.amountNano} NANO. Por favor, regresa a la página principal para iniciar el pago.`; // Usar currentChapterData
            }
        }
    } else {
        console.error('player-script.js: ID de capítulo no encontrado o inválido en la URL o CHAPTER_DATA.'); // Mensaje actualizado
        alert('Capítulo no encontrado o ID inválido. Redirigiendo a la página principal.');
        window.location.href = '../index.html';
        document.body.innerHTML = '<h1>Error: Capítulo no disponible.</h1><p>Por favor, regresa a la <a href="../index.html">página principal</a>.</p>';
    }
});
