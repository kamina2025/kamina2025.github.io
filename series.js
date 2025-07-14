// series.js
// Este script maneja la lógica de la página de detalles de la serie (series.html)
// para mostrar la descripción de la serie y la lista de sus capítulos con muros de pago.

// Objeto para almacenar los intervalos de polling para cada capítulo
const pollingIntervals = {};

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const ACCEPT_NANO_API_BASE_URL = 'https://4c482078d56c.ngrok-free.app'; 

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

// Función para generar y mostrar el QR (AHORA USA qrcode.js)
function generateAndShowQR(qrCanvasDiv, nanoUri, chapterId) {
    if (typeof QRCode === 'undefined') {
        console.error(`ERROR QR: QRCode (qrcode.js) no está definido. No se puede generar el QR para ${chapterId}.`);
        if (qrCanvasDiv) {
            qrCanvasDiv.innerHTML = '<p class="text-red-400 text-center text-sm">Error: QR no disponible. Recarga la página.</p>';
            qrCanvasDiv.classList.remove('hidden');
        }
        return;
    }

    if (qrCanvasDiv) {
        qrCanvasDiv.innerHTML = ''; // Limpiar cualquier QR anterior
        console.log(`DEBUG QR: Intentando generar QR para ${chapterId} con qrcode.js. Valor: ${nanoUri}`);
        try {
            new QRCode(qrCanvasDiv, {
                text: nanoUri,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            qrCanvasDiv.classList.remove('hidden');
            console.log(`DEBUG QR: QR generado y visible para ${chapterId} con qrcode.js.`);
            
            // --- NUEVOS LOGS DE DEPURACIÓN PARA VERIFICAR CONTENIDO ---
            setTimeout(() => { // Pequeño retraso para que el DOM se actualice
                console.log(`DEBUG QR: Contenido de qrCanvasDiv para ${chapterId} después de QRCode():`, qrCanvasDiv.innerHTML);
                const firstChild = qrCanvasDiv.firstElementChild;
                if (firstChild) {
                    console.log(`DEBUG QR: Primer hijo de qrCanvasDiv:`, firstChild.tagName, 'Computed Style:', window.getComputedStyle(firstChild).display, window.getComputedStyle(firstChild).width, window.getComputedStyle(firstChild).height);
                } else {
                    console.log(`DEBUG QR: qrCanvasDiv para ${chapterId} está vacío después de QRCode().`);
                }
            }, 50); // Pequeño retraso
            // --- FIN NUEVOS LOGS DE DEPURACIÓN ---

        } catch (qrError) {
            console.error(`ERROR QR: qrcode.js falló para ${chapterId}:`, qrError);
            qrCanvasDiv.innerHTML = '<p class="text-red-400 text-center text-sm">Error al generar QR. Intenta de nuevo.</p>';
            qrCanvasDiv.classList.remove('hidden');
        }
    } else {
        console.error(`ERROR QR: Elemento QR canvas (div.qr-code) no encontrado para ${chapterId}.`);
    }
}


// Función para actualizar la UI de un capítulo
function updateChapterUI(chapterItemElement, isUnlocked, paymentData = null) {
    const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
    const chapterPaymentSection = chapterItemElement.querySelector('.chapter-payment-section');
    const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
    const chapterUnlockedMessage = chapterItemElement.querySelector('.chapter-unlocked-message');
    const amountInput = chapterItemElement.querySelector('input[type="number"]');
    const qrCanvasDiv = chapterItemElement.querySelector('.qr-code');

    if (isUnlocked) {
        chapterActionButton.textContent = 'Ver Capítulo';
        chapterActionButton.disabled = false;
        chapterPaymentSection.classList.add('hidden');
        chapterPaymentDetails.classList.add('hidden');
        chapterUnlockedMessage.classList.remove('hidden');
        amountInput.disabled = true;
        if (qrCanvasDiv) {
            qrCanvasDiv.classList.add('hidden');
            qrCanvasDiv.innerHTML = '';
        }
    } else {
        chapterActionButton.textContent = 'Ver Capítulo';
        chapterActionButton.disabled = false;
        chapterPaymentSection.classList.remove('hidden');
        chapterUnlockedMessage.classList.add('hidden');

        if (paymentData) {
            chapterPaymentDetails.classList.remove('hidden');
            chapterItemElement.querySelector('.payment-status-text').textContent = paymentData.fulfilled ? 'Completado' : 'Pendiente';
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-green-600', paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-orange-600', !paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-address').textContent = paymentData.account;
            
            const rawAmount = convertNanoToRaw(paymentData.amount);
            const nanoUri = `nano:${paymentData.account}?amount=${rawAmount}`;
            generateAndShowQR(qrCanvasDiv, nanoUri, chapterItemElement.dataset.chapterId);

            chapterItemElement.querySelector('.copy-address-btn').onclick = () => copyToClipboard(paymentData.account);
            chapterActionButton.disabled = true;
            amountInput.disabled = true;
        } else {
            chapterPaymentDetails.classList.add('hidden');
            if (qrCanvasDiv) {
                qrCanvasDiv.classList.add('hidden');
                qrCanvasDiv.innerHTML = '';
            }
            chapterActionButton.disabled = false;
            amountInput.disabled = false;
        }
    }
}

// Función para verificar el estado de un pago de capítulo
async function verifyChapterPaymentStatus(chapterId, token, chapterItemElement) {
    const paymentStatusText = chapterItemElement.querySelector('.payment-status-text');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const paymentErrorDiv = chapterItemElement.querySelector('.chapter-payment-error');
    const qrCanvasDiv = chapterItemElement.querySelector('.qr-code');

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
        
        const rawAmount = convertNanoToRaw(data.amount);
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        generateAndShowQR(qrCanvasDiv, nanoUri, chapterId);


        if (data.fulfilled) {
            clearInterval(pollingIntervals[chapterId]);
            localStorage.setItem(chapterId + '_unlocked', 'true');
            console.log(`DEBUG series.js: localStorage.setItem("${chapterId}_unlocked", "true") ejecutado.`);
            console.log(`DEBUG series.js: Valor de localStorage.getItem("${chapterId}_unlocked") es: "${localStorage.getItem(chapterId + '_unlocked')}"`);
            localStorage.removeItem(chapterId + '_payment_token');
            updateChapterUI(chapterItemElement, true);
            console.log(`Capítulo ${chapterId} desbloqueado con éxito!`);

            // --- REDIRECCIÓN AUTOMÁTICA DESPUÉS DE LA CONFIRMACIÓN ---
            setTimeout(() => {
                location.href = `player/player.html?id=${chapterId}&unlocked=true`;
            }, 1500);
            // --- FIN REDIRECCIÓN AUTOMÁTICA ---

        } else {
            updateChapterUI(chapterItemElement, false, data);
            console.log(`Pago para ${chapterId} aún pendiente. Balance: ${data.balance}`);
        }

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        paymentErrorDiv.textContent = `Error de verificación: ${error.message}`;
        paymentErrorDiv.classList.remove('hidden');
        console.error(`Error al verificar pago para ${chapterId}:`, error);
    }
}

// Función para manejar el clic en el botón "Ver Capítulo"
async function handleChapterActionClick(chapterItemElement) {
    const chapterId = chapterItemElement.dataset.chapterId;
    const isUnlocked = localStorage.getItem(chapterId + '_unlocked') === 'true';
    const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
    const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const chapterPaymentError = chapterItemElement.querySelector('.chapter-payment-error');
    const amountInput = chapterItemElement.querySelector('input[type="number"]');
    const qrCanvasDiv = chapterItemElement.querySelector('.qr-code');

    if (isUnlocked) {
        console.log(`Capítulo ${chapterId} ya desbloqueado. Redirigiendo.`);
        location.href = `player/player.html?id=${chapterId}&unlocked=true`;
        return;
    }

    const amount = amountInput.value;
    if (!amount || parseFloat(amount) <= 0) {
        chapterPaymentError.textContent = 'Por favor, introduce un monto válido.';
        chapterPaymentError.classList.remove('hidden');
        return;
    }

    chapterPaymentError.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    chapterActionButton.disabled = true;
    amountInput.disabled = true;

    try {
        const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currency: 'NANO',
                amount: amount,
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

        localStorage.setItem(chapterId + '_payment_token', token);

        chapterPaymentDetails.classList.remove('hidden');
        chapterItemElement.querySelector('.payment-address').textContent = data.account;
        chapterItemElement.querySelector('.payment-status-text').textContent = 'Pendiente';
        chapterItemElement.querySelector('.payment-status-text').classList.remove('text-green-600');
        chapterItemElement.querySelector('.payment-status-text').classList.add('text-orange-600');

        const rawAmount = convertNanoToRaw(data.amount);
        const nanoUri = `nano:${data.account}?amount=${rawAmount}`;
        generateAndShowQR(qrCanvasDiv, nanoUri, chapterId);


        if (pollingIntervals[chapterId]) {
            clearInterval(pollingIntervals[chapterId]);
        }
        pollingIntervals[chapterId] = setInterval(() => verifyChapterPaymentStatus(chapterId, token, chapterItemElement), 5000);

        verifyChapterPaymentStatus(chapterId, token, chapterItemElement);

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        chapterActionButton.disabled = false;
        amountInput.disabled = false;
        chapterPaymentError.textContent = `Error: ${error.message}`;
        chapterPaymentError.classList.remove('hidden');
        console.error('Error en handleChapterActionClick:', error);
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
                    <p class="text-gray-300 mb-3">Costo: <input type="number" step="0.000001" value="${chapter.amountNano}" class="w-24 p-1 rounded bg-gray-600 text-white border border-gray-500 mr-2"> NANO</p>
                    <div class="loading-spinner hidden mt-3 mx-auto w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p class="chapter-payment-error text-red-500 mt-3 hidden"></p>

                    <div class="chapter-payment-details bg-gray-600 p-4 rounded-md mt-4 hidden">
                        <p class="text-gray-300 mb-2">Estado del Pago: <span class="payment-status-text font-semibold"></span></p>
                        <p class="text-gray-300 mb-2">Dirección de Pago: <span class="payment-address font-mono text-sm break-all"></span> 
                            <button class="copy-address-btn bg-gray-500 hover:bg-gray-400 text-white text-xs py-1 px-2 rounded-md ml-2">Copiar</button>
                        </p>
                        <div class="qr-code flex justify-center mt-4 mb-2"></div>
                    </div>
                </div>
            `;
            chaptersListContainer.appendChild(chapterItemElement);

            const chapterActionButton = chapterItemElement.querySelector('.chapter-action-btn');
            chapterActionButton.addEventListener('click', () => {
                handleChapterActionClick(chapterItemElement);
            });

            chapterItemElement.querySelector('.copy-address-btn').onclick = () => copyToClipboard(chapterItemElement.querySelector('.payment-address').textContent);

            const isUnlocked = localStorage.getItem(chapterId + '_unlocked') === 'true';
            updateChapterUI(chapterItemElement, isUnlocked);

            const savedToken = localStorage.getItem(chapterId + '_payment_token');
            if (!isUnlocked && savedToken) {
                const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');
                chapterPaymentDetails.classList.remove('hidden');
                if (pollingIntervals[chapterId]) {
                    clearInterval(pollingIntervals[chapterId]);
                }
                pollingIntervals[chapterId] = setInterval(() => verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement), 5000);
                verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement);
            }
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
