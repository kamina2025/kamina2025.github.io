// index.js
// Este script maneja la lógica de la página principal (index.html)
// para mostrar la lista de series disponibles.

document.addEventListener('DOMContentLoaded', () => {
    const seriesListContainer = document.getElementById('series-list-container');

    // Verifica si SERIES_DATA está definido (de data.js)
    if (typeof SERIES_DATA === 'undefined') {
        console.error('ERROR: SERIES_DATA no está definido. Asegúrate de que data.js se cargue antes de index.js');
        seriesListContainer.innerHTML = '<p class="text-red-500 text-center">Error al cargar las series. Por favor, inténtalo de nuevo más tarde.</p>';
        return;
    }

    // Itera sobre los datos de las series y crea una tarjeta para cada una
    for (const seriesId in SERIES_DATA) {
        if (SERIES_DATA.hasOwnProperty(seriesId)) {
            const series = SERIES_DATA[seriesId];
            
            const seriesCard = document.createElement('div');
            seriesCard.className = 'bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 cursor-pointer';
            seriesCard.dataset.seriesId = seriesId; // Almacena el ID de la serie

            seriesCard.innerHTML = `
                <img src="${series.image}" alt="${series.title}" class="w-full h-72 object-cover">
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-white mb-2">${series.title}</h3>
                    <p class="text-gray-400 text-sm mb-4">${series.description.substring(0, 100)}...</p>
                    <a href="series.html?id=${seriesId}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Ver Serie
                    </a>
                </div>
            `;
            seriesListContainer.appendChild(seriesCard);

            // Añadir evento de clic a toda la tarjeta para navegar a la página de la serie
            seriesCard.addEventListener('click', () => {
                window.location.href = `series.html?id=${seriesId}`;
            });
        }
    }
});
