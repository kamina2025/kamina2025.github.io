// series.js
const BACKEND_API_BASE_URL = 'https://15c65c07dad2.ngrok-free.app'; // <--- ¡ACTUALIZA ESTA URL con tu Ngrok actual!

document.addEventListener('DOMContentLoaded', async () => {
    const chapterListContainer = document.getElementById('chapter-list-container');
    const seriesTitleElement = document.getElementById('series-title');
    const seriesDescriptionElement = document.getElementById('series-description');
    const seriesCoverImage = document.getElementById('series-cover-image');
    const pageTitle = document.getElementById('series-page-title'); // Para el título de la pestaña del navegador

    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    if (!seriesId) {
        chapterListContainer.innerHTML = '<p class="text-red-400 text-center">ID de serie no especificado.</p>';
        return;
    }

    const series = SERIES_DATA[seriesId]; // Asumiendo que SERIES_DATA está disponible globalmente desde data.js
    if (!series) {
        chapterListContainer.innerHTML = '<p class="text-red-400 text-center">Serie no encontrada.</p>';
        return;
    }

    // Actualizar detalles de la serie en el HTML
    pageTitle.textContent = series.title;
    seriesTitleElement.textContent = series.title;
    seriesDescriptionElement.textContent = series.description;
    seriesCoverImage.src = series.image;
    seriesCoverImage.alt = series.title;

    // Obtener el token del usuario y los contenidos a los que tiene acceso
    const token = localStorage.getItem('token'); // Usamos 'token' para consistencia
    let userAccessedContent = {}; // Objeto para almacenar {contentId: true} si tiene acceso

    if (token) {
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/user/content-access`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                data.forEach(item => {
                    userAccessedContent[item.content_id] = true;
                });
            } else if (response.status === 401 || response.status === 403) {
                // Token inválido/expirado, limpiar y dejar como si no estuviera logueado
                console.warn('Token de usuario inválido o expirado al cargar acceso a contenido. Limpiando sesión.');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                // La barra de navegación se actualizará al recargar o al navegar a otra página
            } else {
                console.error('Error al obtener acceso a contenido:', await response.json());
            }
        } catch (error) {
            console.error('Error de red al obtener acceso a contenido:', error);
        }
    }

    // Renderizar los capítulos
    if (series.chapters && series.chapters.length > 0) {
        chapterListContainer.innerHTML = ''; // Limpiar "Cargando capítulos..."
        series.chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'bg-gray-700 rounded-lg shadow-md p-4 mb-4 flex flex-col sm:flex-row justify-between items-center chapter-item';
            
            // Determinar si el usuario tiene acceso a este capítulo
            const hasAccess = userAccessedContent[chapter.id];

            let actionsHtml = '';
            if (hasAccess) {
                actionsHtml = `
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 watch-chapter-btn" data-chapter-id="${chapter.id}">
                        Ver Capítulo
                    </button>
                `;
            } else if (token) {
                // Si está logueado pero no tiene acceso, mostrar botón "Desbloquear"
                actionsHtml = `
                    <span class="text-gray-300 mr-2">${chapter.credit_cost} créditos</span>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 unlock-chapter-btn" data-chapter-id="${chapter.id}" data-chapter-cost="${chapter.credit_cost}">
                        Desbloquear
                    </button>
                `;
            } else {
                // Si no está logueado, mostrar "Iniciar Sesión para Desbloquear"
                actionsHtml = `
                    <span class="text-gray-400 text-sm mr-2">Inicia sesión para desbloquear</span>
                    <a href="login.html" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Iniciar Sesión
                    </a>
                `;
            }

            chapterItem.innerHTML = `
                <div class="mb-4 sm:mb-0 sm:mr-4 text-center sm:text-left">
                    <h3 class="text-xl font-semibold text-white">${chapter.title}</h3>
                    <p class="text-gray-400">${chapter.description}</p>
                </div>
                <div class="chapter-actions flex items-center">
                    ${actionsHtml}
                </div>
            `;
            
            chapterListContainer.appendChild(chapterItem);

            // Añadir event listeners a los botones generados
            const unlockButton = chapterItem.querySelector('.unlock-chapter-btn');
            if (unlockButton) {
                unlockButton.addEventListener('click', async (e) => {
                    const btn = e.target;
                    const chapterId = btn.dataset.chapterId;
                    const chapterCost = parseInt(btn.dataset.chapterCost);
                    
                    btn.disabled = true;
                    btn.textContent = 'Desbloqueando...';

                    try {
                        const response = await fetch(`${BACKEND_API_BASE_URL}/api/credits/spend`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ contentId: chapterId, contentType: 'chapter' })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            alert(`Operación exitosa: ${data.message}. Nuevo saldo: ${data.newBalance}`);
                            // Actualizar el botón a "Ver Capítulo"
                            btn.textContent = 'Ver Capítulo';
                            btn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 watch-chapter-btn';
                            btn.disabled = false; // Habilitar el botón de ver
                            // Eliminar el listener de desbloqueo y añadir el de ver
                            const newWatchButton = btn; // Es el mismo elemento
                            newWatchButton.removeEventListener('click', e.eventPhase); // Esto es complejo, mejor recrear o usar un flag
                            newWatchButton.addEventListener('click', () => {
                                // Aquí iría la lógica para redirigir al reproductor
                                window.location.href = `player.html?chapterId=${chapterId}`; // Ejemplo de redirección
                            });
                            // Opcional: Recargar la barra de navegación para actualizar créditos si es necesario
                            // window.location.reload(); // Si quieres una recarga completa para actualizar la UI
                        } else {
                            alert(`Error: ${data.message}`);
                            btn.textContent = 'Desbloquear';
                            btn.disabled = false;
                        }
                    } catch (error) {
                        console.error('Error de red al desbloquear capítulo:', error);
                        alert('Error de conexión al intentar desbloquear el capítulo.');
                        btn.textContent = 'Desbloquear';
                        btn.disabled = false;
                    }
                });
            }

            const watchButton = chapterItem.querySelector('.watch-chapter-btn');
            if (watchButton) {
                watchButton.addEventListener('click', () => {
                    // Aquí iría la lógica para redirigir al reproductor
                    window.location.href = `player.html?chapterId=${chapter.id}`; // Ejemplo de redirección
                });
            }
        });
    } else {
        chapterListContainer.innerHTML = '<p class="text-gray-400 text-center">No hay capítulos disponibles para esta serie.</p>';
    }
});