// --- COMIENZO DE LA NUEVA LÓGICA WEBTORRENT ---

// Enlace Magnet del video específico
const WEBTORRENT_MAGNET_LINK = 'magnet:?xt=urn:btih:5ab5136378ac9f996f4d7ca6855823bef3f49b45&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+1+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';

// Elementos HTML para el reproductor y el estado de WebTorrent
const webTorrentPlayerContainer = document.getElementById('webtorrent-player-container');
const webTorrentStatusDiv = document.getElementById('webtorrent-status');

/**
 * Función para inicializar y cargar el video WebTorrent.
 * Esta función debe ser llamada cuando el pago sea confirmado.
 */
function initializeAndLoadWebTorrentVideo() {
    // Asegúrate de que WebTorrent esté definido (debería estarlo si el CDN carga bien)
    if (typeof WebTorrent === 'undefined') {
        console.error('WebTorrent no está definido. El script no se cargó correctamente.');
        webTorrentStatusDiv.textContent = 'Error: El reproductor no se pudo cargar. Revisa la consola del navegador.';
        return;
    }

    const client = new WebTorrent({
        tracker: {
            // Puedes dejar esta propiedad vacía o añadir trackers si los conoces
        },
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    });

    client.on('error', (err) => {
        console.error('WebTorrent Error:', err);
        webTorrentStatusDiv.textContent = `Error de WebTorrent: ${err.message || err}`;
    });

    webTorrentPlayerContainer.innerHTML = 'Cargando metadatos del video...'; // Mensaje inicial
    webTorrentStatusDiv.textContent = 'Iniciando descarga del torrent...';

    client.add(WEBTORRENT_MAGNET_LINK, (torrent) => {
        console.log('Cliente descargando:', torrent.infoHash);
        webTorrentStatusDiv.textContent = `Descargando: ${torrent.name}`;

        const file = torrent.files.find((f) => {
            return f.name.endsWith('.mp4') || f.name.endsWith('.webm') || f.name.endsWith('.mkv');
        });

        if (file) {
            webTorrentPlayerContainer.innerHTML = ''; // Limpia el mensaje de carga
            file.appendTo(webTorrentPlayerContainer, (err, elem) => {
                if (err) {
                    console.error('Error al añadir archivo al reproductor:', err);
                    webTorrentStatusDiv.textContent = `Error de reproducción: ${err.message}`;
                    return;
                }
                console.log('Video listo para reproducir:', file.name);
                webTorrentStatusDiv.textContent = `Reproduciendo: ${file.name}`;
                elem.controls = true;
                elem.autoplay = true; // Reproducir automáticamente al desbloquear
            });

            torrent.on('download', () => {
                const progress = (torrent.progress * 100).toFixed(1);
                webTorrentStatusDiv.textContent = `Descargando: ${torrent.name} (${progress}%) - Velocidad: ${(client.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`;
            });
        } else {
            webTorrentPlayerContainer.innerHTML = 'No se encontró un archivo de video compatible en el torrent.';
            webTorrentStatusDiv.textContent = 'Error: No se encontró video compatible.';
        }
    });
}

// --- FIN DE LA NUEVA LÓGICA WEBTORRENT ---

// --- CONFIGURACIÓN DE BACK4APP ---
// ¡REEMPLAZA ESTOS VALORES CON TUS PROPIAS CLAVES DE BACK4APP!
const APP_ID = "uWlcf09rid2ghAB4RIWLno9BHdvJAkZR6vJd8g60"; // Tu Application ID de Back4App
const JAVASCRIPT_KEY = "YFbSV0dqJBjLMSUru95x39zlPRPEKjiAbckFseRO"; // Tu JavaScript Key de Back4App

// Inicializa Parse SDK
Parse.initialize(APP_ID, JAVASCRIPT_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/'; // Asegúrate de que esta URL sea correcta

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const payButton = document.getElementById('payButton');
const accessSection = document.getElementById('access-section');
const paymentSection = document.getElementById('payment-section');
const videoSection = document.getElementById('video-section');
const amountToPaySpan = document.getElementById('amountToPay');
const paymentAddressSpan = document.getElementById('payment-address');
const qrCodeDiv = document.getElementById('qr-code');
const paymentStatusMessage = document.getElementById('paymentStatusMessage');
const checkPaymentButton = document.getElementById('checkPaymentButton');
const errorMessage = document.getElementById('errorMessage');

let currentPaymentId = null; // Para almacenar el ID del pago actual
let checkPaymentInterval = null; // Para el intervalo de verificación de pago

// --- CLAVE PARA LOCALSTORAGE ---
const LOCAL_STORAGE_ACCESS_KEY = 'video_001_unlocked'; // Identificador único para este video/acceso

/**
 * Función para mostrar el video y ocultar las otras secciones.
 * Esta función también inicia la carga del video WebTorrent.
 */
function showVideoContent() {
    accessSection.style.display = 'none';
    paymentSection.style.display = 'none';
    videoSection.style.display = 'block'; // Asegura que la sección de video sea visible
    
    // *** LLAMADA A LA FUNCIÓN WEBTORRENT CUANDO EL VIDEO ES DESBLOQUEADO ***
    initializeAndLoadWebTorrentVideo(); 
}

/**
 * Función para verificar si el video ya ha sido desbloqueado previamente
 * consultando el localStorage.
 * @returns {boolean} - true si ya está desbloqueado, false en caso contrario.
 */
function checkLocalStorageAccess() {
    // Verifica si la clave de acceso existe en localStorage
    return localStorage.getItem(LOCAL_STORAGE_ACCESS_KEY) === 'true';
}

/**
 * Función para guardar el estado de desbloqueo en localStorage.
 */
function saveAccessToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_ACCESS_KEY, 'true');
}

// --- FUNCIÓN PARA SOLICITAR EL PAGO ---
payButton.addEventListener('click', async () => {
    errorMessage.textContent = ''; // Limpiar mensajes de error
    payButton.disabled = true; // Deshabilitar botón para evitar múltiples clics
    paymentStatusMessage.className = 'status-message status-pending';
    paymentStatusMessage.textContent = 'Solicitando dirección de pago...';

    try {
        // Llama a la función Cloud Code 'requestVideoPayment'
        const result = await Parse.Cloud.run('requestVideoPayment', {
            videoId: 'exclusive_video_001', // Puedes usar un ID de video real aquí
            amountNano: 0.001 // Cantidad de NANO a pagar
        });

        const { paymentAddress, expectedAmountNano, paymentId } = result;
        currentPaymentId = paymentId; // Guarda el ID para futuras verificaciones

        // Muestra los detalles del pago
        amountToPaySpan.textContent = expectedAmountNano;
        paymentAddressSpan.textContent = paymentAddress;

        // Genera el código QR
        qrCodeDiv.innerHTML = ''; // Limpiar QR anterior si existe
        new QRCode(qrCodeDiv, {
            text: `nano:${paymentAddress}?amount=${expectedAmountNano * (10**30)}`, // URL de Nano para el QR
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        accessSection.style.display = 'none'; // Oculta la sección de acceso
        paymentSection.style.display = 'block'; // Muestra la sección de pago
        checkPaymentButton.style.display = 'block'; // Muestra el botón de verificar

        paymentStatusMessage.textContent = 'Por favor, envía el pago. Verificando automáticamente...';
        
        // Inicia la verificación automática cada 10 segundos
        checkPaymentInterval = setInterval(checkPaymentStatus, 10000);

    } catch (error) {
        console.error('Error al solicitar pago:', error);
        errorMessage.textContent = `Error: ${error.message || 'No se pudo obtener la dirección de pago.'}`;
        payButton.disabled = false; // Habilitar botón de nuevo
        paymentStatusMessage.textContent = '';
    }
});

// --- FUNCIÓN PARA VERIFICAR EL ESTADO DEL PAGO ---
async function checkPaymentStatus() {
    if (!currentPaymentId) return; // No hay pago para verificar

    paymentStatusMessage.className = 'status-message status-pending';
    paymentStatusMessage.textContent = 'Verificando pago...';
    checkPaymentButton.disabled = true; // Deshabilitar botón mientras verifica

    try {
        // Llama a la función Cloud Code 'checkPaymentStatus'
        const result = await Parse.Cloud.run('checkPaymentStatus', {
            paymentId: currentPaymentId
        });

        if (result.status === 'completed') {
            clearInterval(checkPaymentInterval); // Detiene la verificación automática
            paymentStatusMessage.className = 'status-message status-completed';
            paymentStatusMessage.textContent = `¡Pago confirmado! Recibido: ${result.amountReceivedNano} NANO.`;
            
            saveAccessToLocalStorage(); // Guarda el acceso en localStorage
            showVideoContent(); // Muestra el video y lo carga con WebTorrent
        } else {
            paymentStatusMessage.className = 'status-message status-pending';
            paymentStatusMessage.textContent = 'Pago pendiente. Esperando confirmación...';
        }
    } catch (error) {
        console.error('Error al verificar pago:', error);
        errorMessage.textContent = `Error al verificar: ${error.message || 'Error desconocido.'}`;
        clearInterval(checkPaymentInterval); // Detiene la verificación en caso de error
        paymentStatusMessage.textContent = 'Error al verificar pago.';
        paymentStatusMessage.className = 'status-message';
    } finally {
        checkPaymentButton.disabled = false; // Habilitar botón de nuevo
    }
}

// Event listener para el botón de verificación manual (además de la auto-verificación)
checkPaymentButton.addEventListener('click', checkPaymentStatus);

// --- LÓGICA DE INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica si el video ya fue desbloqueado en localStorage
    if (checkLocalStorageAccess()) {
        console.log('Video ya desbloqueado, mostrando contenido.');
        showVideoContent(); // Muestra el video directamente y lo carga con WebTorrent
    } else {
        console.log('Video no desbloqueado, mostrando muro de pago.');
        // Muestra el muro de pago si no está desbloqueado
        accessSection.style.display = 'block';
        paymentSection.style.display = 'none';
        videoSection.style.display = 'none';
    }
});
