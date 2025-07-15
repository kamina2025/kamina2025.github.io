// faucet-script.js
// Lógica para el grifo de NANO

// URL base de tu backend accept-nano (¡ACTUALIZA ESTA URL CON LA DE TU NGROK ACTUAL!)
const ACCEPT_NANO_API_BASE_URL = 'https://92e1dc490c38.ngrok-free.app'; // <--- ¡ACTUALIZA ESTA URL!

// Define los enlaces que el usuario debe visitar.
// ¡IMPORTANTE!: Estos deben ser tus enlaces acortados reales que dirigen a videos de YouTube.
// Por ahora, son placeholders. DEBES GENERARLOS CON TU SERVICIO DE ACORTADOR.
const FAUCET_LINKS = [
    { id: 'link1', url: 'https://shrinkme.ink/trialerfrieren', text: 'frieren temporada 1 trailer' },
    { id: 'link2', url: 'https://shrinkme.ink/trailersololeveling', text: 'solo leveling trailer' },
    { id: 'link3', url: 'https://shrinkme.ink/bokuheroilegales', text: 'boku no hero ilegales trailer' }
];

let visitedLinksCount = 0;
const visitedLinks = {}; // Para rastrear qué enlaces se han visitado

document.addEventListener('DOMContentLoaded', () => {
    const linksContainer = document.getElementById('links-container');
    const claimButton = document.getElementById('claim-button');
    const nanoAddressInput = document.getElementById('nano-address');
    const messageBox = document.getElementById('message-box');
    const claimLoadingSpinner = document.getElementById('claim-loading-spinner');

    // Función para mostrar mensajes al usuario
    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.classList.remove('hidden', 'success', 'error');
        messageBox.classList.add(type);
    }

    // Función para actualizar el estado del botón de reclamación
    function updateClaimButtonState() {
        if (visitedLinksCount === FAUCET_LINKS.length && nanoAddressInput.value.startsWith('nano_')) {
            claimButton.disabled = false;
        } else {
            claimButton.disabled = true;
        }
    }

    // Generar los elementos de los enlaces
    FAUCET_LINKS.forEach(linkData => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <span class="text-lg">${linkData.text}</span>
            <button class="link-btn" data-id="${linkData.id}" data-url="${linkData.url}">Visitar</button>
        `;
        linksContainer.appendChild(linkItem);

        const linkButton = linkItem.querySelector('.link-btn');
        linkButton.addEventListener('click', () => {
            // Abrir el enlace en una nueva pestaña
            window.open(linkData.url, '_blank');

            // Marcar el enlace como visitado en el frontend
            if (!visitedLinks[linkData.id]) {
                visitedLinks[linkData.id] = true;
                visitedLinksCount++;
                linkItem.classList.add('visited');
                linkButton.disabled = true;
                linkButton.textContent = 'Visitado';
                console.log(`DEBUG: Enlace "${linkData.id}" visitado. Total visitados: ${visitedLinksCount}`);
                updateClaimButtonState();
            }
        });
    });

    // Escuchar cambios en el campo de dirección de NANO
    nanoAddressInput.addEventListener('input', updateClaimButtonState);

    // Manejar el clic en el botón de reclamación
    claimButton.addEventListener('click', async () => {
        const nanoAddress = nanoAddressInput.value.trim();

        if (!nanoAddress.startsWith('nano_') || nanoAddress.length < 60) { // Validación básica de dirección NANO
            showMessage('Por favor, introduce una dirección de NANO válida.', 'error');
            return;
        }

        if (visitedLinksCount < FAUCET_LINKS.length) {
            showMessage(`Debes visitar los ${FAUCET_LINKS.length} enlaces antes de reclamar.`, 'error');
            return;
        }

        claimButton.disabled = true;
        claimLoadingSpinner.classList.remove('hidden');
        showMessage('Procesando tu solicitud...', 'info');

        try {
            const response = await fetch(`${ACCEPT_NANO_API_BASE_URL}/api/faucet-claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nanoAddress: nanoAddress }),
            });

            claimLoadingSpinner.classList.add('hidden');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || 'Error desconocido al reclamar NANO.');
            }

            const data = await response.json();
            showMessage(`¡Felicidades! Se han enviado ${data.amountSent} NANO a tu dirección.`, 'success');
            console.log("DEBUG: Respuesta del grifo:", data);

            // Reiniciar el estado del grifo después de una reclamación exitosa
            visitedLinksCount = 0;
            for (const id in visitedLinks) {
                delete visitedLinks[id];
            }
            document.querySelectorAll('.link-item').forEach(item => {
                item.classList.remove('visited');
                const btn = item.querySelector('.link-btn');
                btn.disabled = false;
                btn.textContent = 'Visitar';
            });
            nanoAddressInput.value = '';
            updateClaimButtonState();

        } catch (error) {
            claimLoadingSpinner.classList.add('hidden');
            claimButton.disabled = false; // Re-habilitar botón si falla
            showMessage(`Error al reclamar NANO: ${error.message}`, 'error');
            console.error("Error en el grifo:", error);
        }
    });

    updateClaimButtonState(); // Estado inicial del botón
});
