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
            magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_CAPITULO_2_AQUI&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+2.mp4&tr=...', // <--- ¡REEMPLAZA CON EL MAGNET LINK REAL DEL CAPÍTULO 2!
            amountNano: 0.0015
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
        }
    };

    // --- Variables para el video actual ---
    let currentVideoId = null;
    let currentVideoData = null;
    let LOCAL_STORAGE_ACCESS_KEY = null; // Se generará dinámicamente por video

    // --- COMIENZO DE LA LÓGICA WEBTORRENT ---
    // Elementos HTML para el reproductor y el estado de WebTorrent
    const webTorrentPlayerContainer = document.getElementById('webtorrent-player-container');
    const webTorrentStatusDiv = document.getElementById('webtorrent-status');

    /**
     * Función para inicializar y cargar el video WebTorrent.
     * Usa currentVideoData.magnetLink para cargar el video correcto.
     */
    function initializeAndLoadWebTorrentVideo() {
        if (!currentVideoData || !currentVideoData.magnetLink) {
            console.error('No se pudo cargar el video: Datos del video o enlace magnet no disponibles.');
            webTorrentStatusDiv.textContent = 'Error: No se pudo cargar la información del video.';
            return;
        }

        if (typeof WebTorrent === 'undefined') {
            console.error('WebTorrent no está definido. El script no se cargó correctamente.');
            webTorrentStatusDiv.textContent = 'Error: El reproductor no se pudo cargar. Revisa la consola del navegador.';
            return;
        }

        const client = new WebTorrent({
            tracker: {}, // Puedes añadir trackers si los conoces
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

        webTorrentPlayerContainer.innerHTML = 'Cargando metadatos del video...';
        webTorrentStatusDiv.textContent = 'Iniciando descarga del torrent...';

        client.add(currentVideoData.magnetLink, (torrent) => { // Usa el magnet link del video actual
            console.log('Cliente descargando:', torrent.infoHash);
            webTorrentStatusDiv.textContent = `Descargando: ${torrent.name}`;

            const file = torrent.files.find((f) => {
                return f.name.endsWith('.mp4') || f.name.endsWith('.webm') || f.name.endsWith('.mkv');
            });

            if (file) {
                webTorrentPlayerContainer.innerHTML = '';
                file.appendTo(webTorrentPlayerContainer, (err, elem) => {
                    if (err) {
                        console.error('Error al añadir archivo al reproductor:', err);
                        webTorrentStatusDiv.textContent = `Error de reproducción: ${err.message}`;
                        return;
                    }
                    console.log('Video listo para reproducir:', file.name);
                    webTorrentStatusDiv.textContent = `Reproduciendo: ${file.name}`;
                    elem.controls = true;
                    elem.autoplay = true;
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

    // --- FIN DE LA LÓGICA WEBTORRENT ---

    // --- CONFIGURACIÓN DE BACK4APP ---
    // ¡REEMPLAZA ESTOS VALORES CON TUS PROPIAS CLAVES DE BACK4APP!
    const APP_ID = "uWlcf09rid2ghAB4RIWLno9BHdvJAkZR6vJd8g60"; // Tu Application ID de Back4App
    const JAVASCRIPT_KEY = "YFbSV0dqJBjLMSUru95x39zlPRPEKjiAbckFseRO"; // Tu JavaScript Key de Back4App

    // Inicializa Parse SDK
    Parse.initialize(APP_ID, JAVASCRIPT_KEY);
    Parse.serverURL = 'https://parseapi.back4app.com/'; // Asegúrate de que esta URL sea correcta

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const pageTitleElement = document.getElementById('page-title');
    const videoDisplayTitle = document.getElementById('video-display-title');
    const videoDisplayDescription = document.getElementById('video-display-description');
    const paymentAmountDisplay = document.getElementById('payment-amount-display');

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

    /**
     * Función para mostrar el video y ocultar las otras secciones.
     * Esta función también inicia la carga del video WebTorrent.
     */
    function showVideoContent() {
        accessSection.style.display = 'none';
        paymentSection.style.display = 'none';
        videoSection.style.display = 'block';
        
        // *** LLAMADA A LA FUNCIÓN WEBTORRENT CUANDO EL VIDEO ES DESBLOQUEADO ***
        initializeAndLoadWebTorrentVideo(); 
    }

    /**
     * Función para verificar si el video ya ha sido desbloqueado previamente
     * consultando el localStorage.
     * @returns {boolean} - true si ya está desbloqueado, false en caso contrario.
     */
    function checkLocalStorageAccess() {
        // Verifica si la clave de acceso única para este video existe en localStorage
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
        errorMessage.textContent = '';
        payButton.disabled = true;
        paymentStatusMessage.className = 'status-message status-pending';
        paymentStatusMessage.textContent = 'Solicitando dirección de pago...';

        try {
            const result = await Parse.Cloud.run('requestVideoPayment', {
                videoId: currentVideoId, // Usa el ID del video actual
                amountNano: currentVideoData.amountNano // Usa el monto del video actual
            });

            const { paymentAddress, expectedAmountNano, paymentId } = result;
            currentPaymentId = paymentId;

            amountToPaySpan.textContent = expectedAmountNano;
            paymentAddressSpan.textContent = paymentAddress;

            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: `nano:${paymentAddress}?amount=${expectedAmountNano * (10**30)}`,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            accessSection.style.display = 'none';
            paymentSection.style.display = 'block';
            checkPaymentButton.style.display = 'block';

            paymentStatusMessage.textContent = 'Por favor, envía el pago. Verificando automáticamente...';
            
            checkPaymentInterval = setInterval(checkPaymentStatus, 10000);

        } catch (error) {
            console.error('Error al solicitar pago:', error);
            errorMessage.textContent = `Error: ${error.message || 'No se pudo obtener la dirección de pago.'}`;
            payButton.disabled = false;
            paymentStatusMessage.textContent = '';
        }
    });

    // --- FUNCIÓN PARA VERIFICAR EL ESTADO DEL PAGO ---
    async function checkPaymentStatus() {
        if (!currentPaymentId) return;

        paymentStatusMessage.className = 'status-message status-pending';
        paymentStatusMessage.textContent = 'Verificando pago...';
        checkPaymentButton.disabled = true;

        try {
            const result = await Parse.Cloud.run('checkPaymentStatus', {
                paymentId: currentPaymentId
            });

            if (result.status === 'completed') {
                clearInterval(checkPaymentInterval);
                paymentStatusMessage.className = 'status-message status-completed';
                paymentStatusMessage.textContent = `¡Pago confirmado! Recibido: ${result.amountReceivedNano} NANO.`;
                
                saveAccessToLocalStorage();
                showVideoContent();
            } else {
                paymentStatusMessage.className = 'status-message status-pending';
                paymentStatusMessage.textContent = 'Pago pendiente. Esperando confirmación...';
            }
        } catch (error) {
            console.error('Error al verificar pago:', error);
            errorMessage.textContent = `Error al verificar: ${error.message || 'Error desconocido.'}`;
            clearInterval(checkPaymentInterval);
            paymentStatusMessage.textContent = 'Error al verificar pago.';
            paymentStatusMessage.className = 'status-message';
        } finally {
            checkPaymentButton.disabled = false;
        }
    }

    // Event listener para el botón de verificación manual
    checkPaymentButton.addEventListener('click', checkPaymentStatus);

    // --- LÓGICA DE INICIALIZACIÓN AL CARGAR LA PÁGINA ---
    document.addEventListener('DOMContentLoaded', () => {
        // Obtener el ID del video de la URL
        const urlParams = new URLSearchParams(window.location.search);
        currentVideoId = urlParams.get('id');

        if (currentVideoId && VIDEO_DATA[currentVideoId]) {
            currentVideoData = VIDEO_DATA[currentVideoId];
            LOCAL_STORAGE_ACCESS_KEY = `video_${currentVideoId}_unlocked`; // Clave única por video

            // Actualizar el título y descripción de la página
            pageTitleElement.textContent = currentVideoData.title;
            videoDisplayTitle.textContent = currentVideoData.title;
            videoDisplayDescription.textContent = currentVideoData.description;
            paymentAmountDisplay.textContent = currentVideoData.amountNano;

            // Verifica si el video ya fue desbloqueado en localStorage
            if (checkLocalStorageAccess()) {
                console.log(`Video ${currentVideoId} ya desbloqueado, mostrando contenido.`);
                showVideoContent(); // Muestra el video directamente y lo carga con WebTorrent
            } else {
                console.log(`Video ${currentVideoId} no desbloqueado, mostrando muro de pago.`);
                // Muestra el muro de pago si no está desbloqueado
                accessSection.style.display = 'block';
                paymentSection.style.display = 'none';
                videoSection.style.display = 'none';
            }
        } else {
            // Si no hay ID o el ID no es válido, redirigir o mostrar un mensaje de error
            console.error('ID de video no encontrado o inválido en la URL.');
            alert('Video no encontrado o ID inválido. Redirigiendo a la página principal.');
            window.location.href = 'index.html'; // Redirigir a la página principal
            // Ocultar todo y mostrar un mensaje de error
            accessSection.style.display = 'none';
            paymentSection.style.display = 'none';
            videoSection.style.display = 'none';
            document.body.innerHTML = '<h1>Error: Video no disponible.</h1><p>Por favor, regresa a la <a href="index.html">página principal</a>.</p>';
        }
    });
    