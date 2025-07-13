// series.js
// Este script maneja la lógica de la página de detalles de la serie (series.html)
// para mostrar la descripción de la serie y la lista de sus capítulos con muros de pago.

// Objeto para almacenar los intervalos de polling para cada capítulo
const pollingIntervals = {};

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const ACCEPT_NANO_API_BASE_URL = 'https://fa20bb3b1e8a.ngrok-free.app'; 

// Función para copiar texto al portapapeles
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Copiado al portapapeles: ' + text);
    } catch (err) {
        console.error('No se pudo copiar al portapapeles:', err);
        alert('Error al copiar. Por favor, copia manualmente: ' + text);
    }
    document.body.removeChild(textarea);
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

// Función para actualizar la UI de un capítulo
function updateChapterUI(chapterItemElement, isUnlocked, paymentData = null) {
    const chapterBtn = chapterItemElement.querySelector('.chapter-btn');
    const unlockChapterBtn = chapterItemElement.querySelector('.unlock-chapter-btn');
    const chapterPaymentSection = chapterItemElement.querySelector('.chapter-payment-section');
    const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
    const chapterUnlockedMessage = chapterItemElement.querySelector('.chapter-unlocked-message');
    const amountInput = chapterItemElement.querySelector('input[type="number"]');

    if (isUnlocked) {
        chapterBtn.disabled = false;
        unlockChapterBtn.classList.add('hidden');
        chapterPaymentSection.classList.add('hidden'); // Ocultar toda la sección de pago
        chapterPaymentDetails.classList.add('hidden');
        chapterUnlockedMessage.classList.remove('hidden'); // Mostrar mensaje de desbloqueado
    } else {
        chapterBtn.disabled = true;
        unlockChapterBtn.classList.remove('hidden');
        chapterPaymentSection.classList.remove('hidden'); // Mostrar la sección de pago
        chapterUnlockedMessage.classList.add('hidden'); // Ocultar mensaje de desbloqueado

        if (paymentData) {
            chapterPaymentDetails.classList.remove('hidden');
            chapterItemElement.querySelector('.payment-status-text').textContent = paymentData.fulfilled ? 'Completado' : 'Pendiente';
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-green-600', paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-orange-600', !paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-address').textContent = paymentData.account;
            // Eliminado: chapterItemElement.querySelector('.payment-token').textContent = paymentData.token;
            // Eliminado: chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(paymentData.token);

            // Generar QR para el pago en curso
            const qrCanvas = chapterItemElement.querySelector('.qr-code');
            const rawAmount = convertNanoToRaw(paymentData.amount); // Convertir a raw para el QR
            const nanoUri = `nano:${paymentData.account}?amount=${rawAmount}`;
            new QRious({
                element: qrCanvas,
                value: nanoUri,
                size: 180,
                background: 'white',
                foreground: 'black'
            });

            chapterItemElement.querySelector('.copy-address-btn').onclick = () => copyToClipboard(paymentData.account);
            unlockChapterBtn.disabled = true; // Deshabilitar si ya hay un pago en curso
            amountInput.disabled = true; // Deshabilitar el input de monto
        } else {
            chapterPaymentDetails.classList.add('hidden');
            unlockChapterBtn.disabled = false; // Habilitar si no hay pago en curso
            amountInput.disabled = false; // Habilitar el input de monto
        }
    }
}

// Función para verificar el estado de un pago de capítulo
async function verifyChapterPaymentStatus(chapterId, token, chapterItemElement) {
    const paymentStatusText = chapterItemElement.querySelector('.payment-status-text');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const paymentErrorDiv = chapterItemElement.querySelector('.chapter-payment-error');

    loadingSpinner.classList.remove('hidden');
    paymentErrorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });

        loadingSpinner.classList.add('hidden');

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al verificar pago para ${chapterId}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        paymentStatusText.textContent = data.fulfilled ? 'Completado' : 'Pendiente';
        paymentStatusText.classList.toggle('text-green-600', data.fulfilled);
        paymentStatusText.classList.toggle('text-orange-600', !data.fulfilled);
        chapterItemElement.querySelector('.payment-address').textContent = data.account;
        // Eliminado: chapterItemElement.querySelector('.payment-token').textContent = data.token;

        // Regenerar QR en caso de que la dirección o monto cambien (poco probable en verify)
        const qrCanvas = chapterItemElement.querySelector('.qr-code');
        const rawAmount = convertNanoToRaw(data.amount);
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        new QRious({
            element: qrCanvas,
            value: nanoUri,
            size: 180,
            background: 'white',
            foreground: 'black'
        });

        if (data.fulfilled) {
            clearInterval(pollingIntervals[chapterId]); // Detener el polling
            localStorage.setItem(chapterId + '_unlocked', 'true'); // Marcar como desbloqueado
            console.log(`DEBUG series.js: localStorage.setItem("${chapterId}_unlocked", "true") ejecutado.`);
            console.log(`DEBUG series.js: Valor de localStorage.getItem("${chapterId}_unlocked") es: "${localStorage.getItem(chapterId + '_unlocked')}"`);
            localStorage.removeItem(chapterId + '_payment_token'); // Limpiar token guardado
            updateChapterUI(chapterItemElement, true); // Actualizar UI a desbloqueado
            console.log(`Capítulo ${chapterId} desbloqueado con éxito!`);

            // --- REDIRECCIÓN AUTOMÁTICA DESPUÉS DE LA CONFIRMACIÓN ---
            setTimeout(() => {
                location.href = `player/player.html?id=${chapterId}&unlocked=true`; // Añadimos &unlocked=true
            }, 1500); // Redirigir después de 1.5 segundos para mostrar el mensaje
            // --- FIN REDIRECCIÓN AUTOMÁTICA ---

        } else {
            console.log(`Pago para ${chapterId} aún pendiente. Balance: ${data.balance}`);
        }

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        paymentErrorDiv.textContent = `Error de verificación: ${error.message}`;
        paymentErrorDiv.classList.remove('hidden');
        console.error(`Error al verificar pago para ${chapterId}:`, error);
        // Considerar detener el polling si el error es grave (ej. token inválido)
    }
}

// Función para manejar el clic en el botón "Desbloquear Capítulo"
async function handleUnlockChapterClick(chapterItemElement) {
    const chapterId = chapterItemElement.dataset.chapterId;
    const unlockChapterBtn = chapterItemElement.querySelector('.unlock-chapter-btn');
    const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const chapterPaymentError = chapterItemElement.querySelector('.chapter-payment-error');
    const amountInput = chapterItemElement.querySelector('input[type="number"]');

    const amount = amountInput.value;
    if (!amount || parseFloat(amount) <= 0) {
        chapterPaymentError.textContent = 'Por favor, introduce un monto válido.';
        chapterPaymentError.classList.remove('hidden');
        return;
    }

    // Ocultar errores anteriores y mostrar spinner
    chapterPaymentError.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    unlockChapterBtn.disabled = true; // Deshabilitar botón
    amountInput.disabled = true; // Deshabilitar input

    try {
        const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currency: 'NANO',
                amount: amount, // Usar el monto del input
                state: `unlock-chapter-${chapterId}`
            }),
        });

        loadingSpinner.classList.add('hidden');

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al crear pago para ${chapterId}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const token = data.token;

        // Guardar el token en localStorage para reanudar el polling si se recarga la página
        localStorage.setItem(chapterId + '_payment_token', token);

        // Mostrar los detalles del pago
        chapterPaymentDetails.classList.remove('hidden');
        chapterItemElement.querySelector('.payment-address').textContent = data.account;
        // Eliminado: chapterItemElement.querySelector('.payment-token').textContent = token;
        chapterItemElement.querySelector('.payment-status-text').textContent = 'Pendiente';
        chapterItemElement.querySelector('.payment-status-text').classList.remove('text-green-600');
        chapterItemElement.querySelector('.payment-status-text').classList.add('text-orange-600');

        // Generar QR
        const qrCanvas = chapterItemElement.querySelector('.qr-code');
        const rawAmount = convertNanoToRaw(data.amount); // Convertir a raw para el QR
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        new QRious({
            element: qrCanvas,
            value: nanoUri,
            size: 180,
            background: 'white',
            foreground: 'black'
        });

        // Iniciar el polling para verificar el estado del pago
        if (pollingIntervals[chapterId]) {
            clearInterval(pollingIntervals[chapterId]);
        }
        pollingIntervals[chapterId] = setInterval(() => verifyChapterPaymentStatus(chapterId, token, chapterItemElement), 5000); // Cada 5 segundos

        // Realizar una verificación inicial inmediatamente
        verifyChapterPaymentStatus(chapterId, token, chapterItemElement); // Usar verifyChapterPaymentStatus para la verificación inicial

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        unlockChapterBtn.disabled = false; // Re-habilitar botón en caso de error
        amountInput.disabled = false; // Re-habilitar input
        chapterPaymentError.textContent = `Error: ${error.message}`;
        chapterPaymentError.classList.remove('hidden');
        console.error('Error en handleUnlockChapterClick:', error);
    }
}


// Función para renderizar los capítulos de una serie
function renderChapters(seriesId) {
    const chaptersListContainer = document.getElementById('chapters-list-container');
    chaptersListContainer.innerHTML = ''; // Limpiar capítulos anteriores

    let hasChapters = false;
    for (const chapterId in CHAPTER_DATA) {
        if (CHAPTER_DATA.hasOwnProperty(chapterId) && CHAPTER_DATA[chapterId].seriesId === seriesId) {
            hasChapters = true;
            const chapter = CHAPTER_DATA[chapterId];

            const chapterItemElement = document.createElement('div');
            chapterItemElement.className = 'chapter-item bg-gray-700 rounded-lg p-4 mb-4 shadow-md';
            chapterItemElement.dataset.chapterId = chapterId; // Almacena el ID del capítulo

            chapterItemElement.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-xl font-semibold text-white">${chapter.title}</h4>
                    <button class="chapter-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300" disabled>
                        Ver Capítulo
                    </button>
                </div>
                <div class="chapter-unlocked-message text-green-400 text-center text-lg font-medium hidden mb-4">
                    ¡Capítulo Desbloqueado!
                </div>
                <div class="chapter-payment-section">
                    <p class="text-gray-300 mb-3">Costo: <input type="number" step="0.000001" value="${chapter.amountNano}" class="w-24 p-1 rounded bg-gray-600 text-white border border-gray-500 mr-2"> NANO</p>
                    <button class="unlock-chapter-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Desbloquear Capítulo
                    </button>
                    <div class="loading-spinner hidden mt-3 mx-auto w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p class="chapter-payment-error text-red-500 mt-3 hidden"></p>

                    <div class="chapter-payment-details bg-gray-600 p-4 rounded-md mt-4 hidden">
                        <p class="text-gray-300 mb-2">Estado del Pago: <span class="payment-status-text font-semibold"></span></p>
                        <p class="text-gray-300 mb-2">Dirección de Pago: <span class="payment-address font-mono text-sm break-all"></span> 
                            <button class="copy-address-btn bg-gray-500 hover:bg-gray-400 text-white text-xs py-1 px-2 rounded-md ml-2">Copiar</button>
                        </p>
                        <!-- Eliminado: <p class="text-gray-300 mb-2">Token de Pago: <span class="payment-token font-mono text-sm break-all"></span> 
                            <button class="copy-token-btn bg-gray-500 hover:bg-gray-400 text-white text-xs py-1 px-2 rounded-md ml-2">Copiar</button>
                        </p> -->
                        <div class="qr-code flex justify-center mt-4 mb-2"></div>
                    </div>
                </div>
            `;
            chaptersListContainer.appendChild(chapterItemElement);

            // Asignar eventos y verificar estado
            const chapterBtn = chapterItemElement.querySelector('.chapter-btn');
            chapterBtn.addEventListener('click', () => {
                location.href = `player/player.html?id=${chapterId}`;
            });

            const unlockChapterBtn = chapterItemElement.querySelector('.unlock-chapter-btn');
            unlockChapterBtn.addEventListener('click', () => {
                handleUnlockChapterClick(chapterItemElement);
            });

            // Asignar eventos a los botones de copiar
            chapterItemElement.querySelector('.copy-address-btn').onclick = () => copyToClipboard(chapterItemElement.querySelector('.payment-address').textContent);
            // Eliminado: chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(chapterItemElement.querySelector('.payment-token').textContent);

            // Comprobar si el capítulo ya está desbloqueado en localStorage
            const isUnlocked = localStorage.getItem(chapterId + '_unlocked') === 'true';
            updateChapterUI(chapterItemElement, isUnlocked);

            // Si hay un token de pago guardado y el capítulo no está desbloqueado, reanudar el polling
            const savedToken = localStorage.getItem(chapterId + '_payment_token');
            if (!isUnlocked && savedToken) {
                const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
                chapterPaymentDetails.classList.remove('hidden');
                // Eliminado: chapterItemElement.querySelector('.payment-token').textContent = savedToken;
                // Eliminado: chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(savedToken);
                if (pollingIntervals[chapterId]) {
                    clearInterval(pollingIntervals[chapterId]);
                }
                pollingIntervals[chapterId] = setInterval(() => verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement), 5000);
                verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement); // Verificación inicial
            }
        }
    }

    if (!hasChapters) {
        chaptersListContainer.innerHTML = '<p class="text-gray-400 text-center">No hay capítulos disponibles para esta serie.</p>';
    }
}


// Lógica de inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log("series.js: DOMContentLoaded - Iniciando.");
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    if (seriesId && SERIES_DATA[seriesId]) {
        const series = SERIES_DATA[seriesId];
        document.getElementById('series-page-title').textContent = series.title;
        document.getElementById('series-title').textContent = series.title;
        document.getElementById('series-description').textContent = series.description;
        document.getElementById('series-cover-image').src = series.image;
        document.getElementById('series-cover-image').alt = series.title;

        renderChapters(seriesId); // Renderiza los capítulos de la serie
    } else {
        console.error('series.js: ID de serie no encontrado o inválido en la URL.');
        alert('Serie no encontrada o ID inválido. Redirigiendo a la página principal.');
        window.location.href = 'index.html'; // Redirige a la página principal
    }
});
