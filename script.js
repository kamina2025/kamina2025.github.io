// Objeto para almacenar los intervalos de polling para cada capítulo
const pollingIntervals = {};

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

// Función para expandir/contraer la lista de capítulos de una serie
function toggleChapters(seriesCardId) {
    const seriesCard = document.getElementById(seriesCardId);
    const chaptersList = seriesCard.querySelector('.chapters-list');
    const toggleIcon = seriesCard.querySelector('.toggle-icon');

    if (seriesCard.classList.contains('expanded')) {
        seriesCard.classList.remove('expanded');
        chaptersList.style.maxHeight = '0';
        chaptersList.style.padding = '0 20px';
        toggleIcon.textContent = '+';
    } else {
        document.querySelectorAll('.series-card.expanded').forEach(card => {
            if (card.id !== seriesCardId) {
                card.classList.remove('expanded');
                card.querySelector('.chapters-list').style.maxHeight = '0';
                card.querySelector('.chapters-list').style.padding = '0 20px';
                card.querySelector('.toggle-icon').textContent = '+';
            }
        });

        seriesCard.classList.add('expanded');
        chaptersList.style.maxHeight = chaptersList.scrollHeight + 'px';
        chaptersList.style.padding = '20px';
        toggleIcon.textContent = 'x';
    }
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
        // Importante: El enlace ahora apunta a la subcarpeta 'player'
        chapterBtn.onclick = () => location.href = `player/player.html?id=${chapterItemElement.dataset.chapterId}`;
        unlockChapterBtn.classList.add('hidden');
        chapterPaymentSection.classList.add('hidden'); // Ocultar toda la sección de pago
        chapterPaymentDetails.classList.add('hidden');
        chapterUnlockedMessage.classList.remove('hidden'); // Mostrar mensaje de desbloqueado
    } else {
        chapterBtn.disabled = true;
        chapterBtn.onclick = null;
        unlockChapterBtn.classList.remove('hidden');
        chapterPaymentSection.classList.remove('hidden'); // Mostrar la sección de pago
        chapterUnlockedMessage.classList.add('hidden'); // Ocultar mensaje de desbloqueado

        if (paymentData) {
            chapterPaymentDetails.classList.remove('hidden');
            chapterItemElement.querySelector('.payment-status-text').textContent = paymentData.fulfilled ? 'Completado' : 'Pendiente';
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-green-600', paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-status-text').classList.toggle('text-orange-600', !paymentData.fulfilled);
            chapterItemElement.querySelector('.payment-address').textContent = paymentData.account;
            chapterItemElement.querySelector('.payment-token').textContent = paymentData.token;

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
            chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(paymentData.token);
            unlockChapterBtn.disabled = true; // Deshabilitar si ya hay un pago en curso
            amountInput.disabled = true; // Deshabilitar el input de monto
        } else {
            chapterPaymentDetails.classList.add('hidden');
            unlockChapterBtn.disabled = false; // Habilitar si no hay pago en curso
            amountInput.disabled = false; // Habilitar el input de monto
        }
    }
}

// Función para convertir NANO a RAW (para el QR code)
// Nano tiene 30 decimales. 1 NANO = 10^30 RAW
function convertNanoToRaw(nanoAmount) {
    // Asegurarse de que Decimal.js esté cargado
    if (typeof Decimal === 'undefined') {
        console.error('Decimal.js no está cargado. No se puede convertir a RAW con precisión.');
        // Fallback a una conversión simple si Decimal.js no está disponible, pero con advertencia.
        return (parseFloat(nanoAmount) * (10**30)).toFixed(0);
    }
    const nanoDecimal = new Decimal(nanoAmount);
    const rawMultiplier = new Decimal('10').pow(30);
    return nanoDecimal.mul(rawMultiplier).toFixed(0); // toFixed(0) para asegurar que sea un entero sin notación científica
}

// Función para verificar el estado de un pago de capítulo
async function verifyChapterPaymentStatus(chapterId, token, chapterItemElement) {
    const paymentStatusText = chapterItemElement.querySelector('.payment-status-text');
    const loadingSpinner = chapterItemElement.querySelector('.loading-spinner');
    const paymentErrorDiv = chapterItemElement.querySelector('.chapter-payment-error');

    loadingSpinner.classList.remove('hidden');
    paymentErrorDiv.classList.add('hidden');

    try {
        const response = await fetch('http://localhost:8080/api/verify', {
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
        chapterItemElement.querySelector('.payment-token').textContent = data.token;

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
            localStorage.removeItem(chapterId + '_payment_token'); // Limpiar token guardado
            updateChapterUI(chapterItemElement, true); // Actualizar UI a desbloqueado
            console.log(`Capítulo ${chapterId} desbloqueado con éxito!`);
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
        const response = await fetch('http://localhost:8080/api/pay', {
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
        chapterItemElement.querySelector('.payment-token').textContent = token;
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
        verifyChapterPaymentStatus(chapterId, token, chapterItemElement);

    } catch (error) {
        loadingSpinner.classList.add('hidden');
        unlockChapterBtn.disabled = false; // Re-habilitar botón en caso de error
        amountInput.disabled = false; // Re-habilitar input
        chapterPaymentError.textContent = `Error: ${error.message}`;
        chapterPaymentError.classList.remove('hidden');
        console.error('Error en handleUnlockChapterClick:', error);
    }
}

// Inicializar todos los capítulos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.chapter-item').forEach(chapterItemElement => {
        const chapterId = chapterItemElement.dataset.chapterId;
        const unlockChapterBtn = chapterItemElement.querySelector('.unlock-chapter-btn');
        const chapterPaymentDetails = chapterItemElement.querySelector('.chapter-payment-details');

        // Comprobar si el capítulo ya está desbloqueado en localStorage
        const isUnlocked = localStorage.getItem(chapterId + '_unlocked') === 'true';
        updateChapterUI(chapterItemElement, isUnlocked);

        // Si hay un token de pago guardado y el capítulo no está desbloqueado, reanudar el polling
        const savedToken = localStorage.getItem(chapterId + '_payment_token');
        if (!isUnlocked && savedToken) {
            chapterPaymentDetails.classList.remove('hidden');
            chapterItemElement.querySelector('.payment-token').textContent = savedToken;
            chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(savedToken);
            // Iniciar polling con el token guardado
            if (pollingIntervals[chapterId]) {
                clearInterval(pollingIntervals[chapterId]);
            }
            pollingIntervals[chapterId] = setInterval(() => verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement), 5000);
            verifyChapterPaymentStatus(chapterId, savedToken, chapterItemElement); // Verificación inicial
        }

        // Asignar el evento click al botón de desbloquear capítulo
        unlockChapterBtn.addEventListener('click', () => {
            handleUnlockChapterClick(chapterItemElement);
        });

        // Asignar eventos a los botones de copiar
        chapterItemElement.querySelector('.copy-address-btn').onclick = () => copyToClipboard(chapterItemElement.querySelector('.payment-address').textContent);
        chapterItemElement.querySelector('.copy-token-btn').onclick = () => copyToClipboard(chapterItemElement.querySelector('.payment-token').textContent);
    });

    // Asegurarse de que las listas de capítulos estén contraídas al cargar
    document.querySelectorAll('.chapters-list').forEach(list => {
        list.style.maxHeight = '0';
        list.style.padding = '0 20px';
    });
});
