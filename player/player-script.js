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
        magnetLink: 'magnet:?xt=urn:btih:665f5667ef96f506d0579ea1e26546d9c0767e74&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+2+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL DEL CAPÍTULO 2!
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
let LOCAL_STORAGE_ACCESS_KEY = null; // Key for unlock status in localStorage
let LOCAL_STORAGE_PAYMENT_TOKEN_KEY = null; // Key for payment token in localStorage

// --- COMIENZO DE LA LÓGICA WEBTORRENT ---
const webTorrentPlayerContainer = document.getElementById('webtorrent-player-container');
const webTorrentStatusDiv = document.getElementById('webtorrent-status');
const videoElement = document.getElementById('videoPlayer'); // Get the video element directly

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

    // Clear any previous WebTorrent client to avoid conflicts
    if (window.webtorrentClient) {
        console.log("WebTorrent: Destruyendo cliente anterior.");
        window.webtorrentClient.destroy();
    }

    // Initialize WebTorrent client with an expanded list of STUN servers
    const client = new WebTorrent({
        tracker: {
            // WebTorrent uses WebRTC for peer discovery and data transfer.
            // iceServers help WebRTC establish connections, especially through NATs (Network Address Translators)
            // commonly found in mobile networks or home routers.
            // STUN servers help peers discover their public IP and port.
            // TURN servers (not included here, but can be added) relay traffic if direct connection fails.
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
                    // Add TURN servers here if needed, e.g.:
                    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'password' }
                ]
            }
        }
    });
    window.webtorrentClient = client; // Save the client in the window object to destroy it later

    client.on('error', (err) => {
        console.error('WebTorrent Error:', err);
        webTorrentStatusDiv.textContent = `Error de WebTorrent: ${err.message || err}`;
    });

    // IMPORTANT! We only update the status paragraph, NOT the video container's innerHTML.
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
                // Ensure the video element is visible and has dimensions
                videoElement.classList.remove('hidden'); 
                videoElement.classList.add('w-full', 'h-auto', 'block'); // Add Tailwind classes for dimensions

                // Render the file directly to the video element
                file.renderTo(videoElement, {
                    autoplay: true, 
                    controls: true,
                    // muted: true // Already in HTML, but can be forced here if needed
                }, (err) => {
                    if (err) {
                        console.error('WebTorrent: Error al añadir archivo al reproductor:', err);
                        webTorrentStatusDiv.textContent = `Error de reproducción: ${err.message}`;
                        return;
                    }
                    console.log('WebTorrent: Video listo para reproducir:', file.name);
                    webTorrentStatusDiv.textContent = `Reproduciendo: ${file.name}`;
                    // Try to play, catching autoplay error if it occurs (though muted should prevent it)
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
const accessAmountSpan = document.getElementById('access-amount'); // To display the amount in the access wall

const accessSection = document.getElementById('access-section');
const paymentSection = document.getElementById('payment-section');
const videoSection = document.getElementById('video-section');
const amountToPaySpan = document.getElementById('amountToPay');
const paymentAddressSpan = document.getElementById('payment-address');
const qrCodeDiv = document.getElementById('qr-code');
const paymentStatusMessage = document.getElementById('paymentStatusMessage');
const checkPaymentButton = document.getElementById('checkPaymentButton');
const errorMessage = document.getElementById('errorMessage');

let currentPaymentToken = null; // To store the current payment token
let checkPaymentInterval = null; // For the payment verification interval

/**
 * Function to show the video and hide other sections.
 * This function also starts the WebTorrent video loading.
 */
function showVideoContent() {
    console.log("showVideoContent: Mostrando sección de video.");
    accessSection.classList.add('hidden'); // Hide access section
    paymentSection.classList.add('hidden'); // Hide payment section
    videoSection.classList.remove('hidden'); // Show video section

    // *** CALL TO WEBTORRENT FUNCTION WHEN VIDEO IS UNLOCKED ***
    initializeAndLoadWebTorrentVideo();
}

/**
 * Function to check if the video has been unlocked previously
 * by querying localStorage.
 * @returns {boolean} - true if already unlocked, false otherwise.
 */
function checkLocalStorageAccess(chapterId) {
    // Generate the key in the same way as in script.js
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
    localStorage.removeItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY); // Clear token once unlocked
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
            // If the token is not fulfilled but has expired, we could handle it here
            // if (data.remainingSeconds <= 0) { /* handle expired */ }
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

    if (currentVideoId && VIDEO_DATA[currentVideoId]) {
        currentVideoData = VIDEO_DATA[currentVideoId];
        // Generate localStorage keys here
        LOCAL_STORAGE_ACCESS_KEY = `video_${currentVideoId}_unlocked`;
        LOCAL_STORAGE_PAYMENT_TOKEN_KEY = `video_${currentVideoId}_payment_token`;
        console.log(`player-script.js: Datos del video cargados para ${currentVideoId}.`);

        pageTitleElement.textContent = currentVideoData.title;
        videoDisplayTitle.textContent = currentVideoData.title;
        videoDisplayDescription.textContent = currentVideoData.description;
        if (accessAmountSpan) { // Ensure the element exists
            accessAmountSpan.textContent = currentVideoData.amountNano;
        }


        // Prioritize unlock status from URL
        if (unlockedFromUrl || checkLocalStorageAccess(currentVideoId)) { // Pass currentVideoId to the function
            // If already unlocked (by URL or localStorage), show video directly
            console.log(`player-script.js: Capítulo ${currentVideoId} desbloqueado (por URL o localStorage). Mostrando contenido.`);
            // Ensure status is saved to localStorage if it came from URL
            if (unlockedFromUrl && !checkLocalStorageAccess(currentVideoId)) {
                console.log("player-script.js: Desbloqueado por URL, guardando en localStorage para futuras visitas.");
                saveAccessToLocalStorage(); // Save to localStorage for future visits
            }
            showVideoContent();
        } else {
            // If not unlocked, try to retrieve a pending payment token
            currentPaymentToken = localStorage.getItem(LOCAL_STORAGE_PAYMENT_TOKEN_KEY);
            console.log(`player-script.js: Token de pago guardado en localStorage: ${currentPaymentToken}`);

            if (currentPaymentToken) {
                // If there's a pending payment token, show payment section and start verifying
                console.log(`player-script.js: Capítulo ${currentVideoId} tiene un pago pendiente, reanudando verificación.`);
                accessSection.classList.add('hidden');
                paymentSection.classList.remove('hidden');
                videoSection.classList.add('hidden');

                // Clear any previous interval to avoid duplicates
                if (checkPaymentInterval) {
                    clearInterval(checkPaymentInterval);
                }
                checkPaymentInterval = setInterval(() => checkPaymentStatus(currentPaymentToken), 5000); // Polling every 5 seconds
                checkPaymentStatus(currentPaymentToken); // Immediate initial verification
            } else {
                // If not unlocked and no pending token, show access section
                console.log(`player-script.js: Capítulo ${currentVideoId} no desbloqueado y sin pago pendiente. Mostrando muro de acceso.`);
                accessSection.classList.remove('hidden');
                paymentSection.classList.add('hidden');
                videoSection.classList.add('hidden');
                // Here you could show the amount it would cost to unlock
                accessSection.querySelector('p').textContent = `Este capítulo requiere ser desbloqueado para su visualización. El costo es de ${currentVideoData.amountNano} NANO. Por favor, regresa a la página principal para iniciar el pago.`;
            }
        }
    } else {
        console.error('player-script.js: ID de video no encontrado o inválido en la URL.');
        // If no ID or invalid, redirect to main page
        alert('Video no encontrado o ID inválido. Redirigiendo a la página principal.');
        window.location.href = '../index.html';
        document.body.innerHTML = '<h1>Error: Video no disponible.</h1><p>Por favor, regresa a la <a href="../index.html">página principal</a>.</p>';
    }
});
