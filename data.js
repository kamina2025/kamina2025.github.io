// data.js
// Este archivo contiene los datos de todas las series y sus capítulos.

const SERIES_DATA = {
    'vigilante': {
        title: 'Vigilante: Boku no Hero Academia ILLEGALS',
        description: 'Explora los orígenes y las aventuras de los vigilantes en el universo de My Hero Academia. Este spin-off te sumerge en el mundo antes de los héroes oficiales, presentando personajes carismáticos y una trama llena de acción y misterio.',
        image: 'https://placehold.co/300x450/000000/FFFFFF?text=Vigilante+Cover' // Placeholder de imagen de la serie
    },
    'otra_serie': {
        title: 'Otra Serie Genial',
        description: 'Una emocionante nueva serie que te dejará al borde de tu asiento con giros inesperados y personajes inolvidables.',
        image: 'https://placehold.co/300x450/000000/FFFFFF?text=Otra+Serie+Cover' // Placeholder de imagen de la serie
    }
    // Puedes añadir más series aquí siguiendo el mismo formato
    /*
    'nueva_serie_id': {
        title: 'Título de la Nueva Serie',
        description: 'Descripción detallada de la nueva serie.',
        image: 'URL_DE_IMAGEN_DE_LA_NUEVA_SERIE'
    }
    */
};

const CHAPTER_DATA = {
    'vigilante_s1_ep1': {
        seriesId: 'vigilante',
        title: 'Capítulo 1: El Comienzo',
        magnetLink: 'magnet:?xt=urn:btih:5ab5136378ac9f996f4d7ca6855823bef3f49b45&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+1+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
        amountNano: 0.001
    },
    'vigilante_s1_ep2': {
        seriesId: 'vigilante',
        title: 'Capítulo 2: Primeros Pasos',
        magnetLink: 'magnet:?xt=urn:btih:665f5667ef96f506d0579ea1e26546d9c0767e74&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+2+SUB+ESPANOLHD+Ve.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
        amountNano: 0.002
    },
    'vigilante_s1_ep3': {
        seriesId: 'vigilante',
        title: 'Capítulo 3: La Amenaza Creciente',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_CAPITULO_3_AQUI&dn=Vigilante+Boku+no+Hero+Academia+ILLEGALS+Cap+3.mp4&tr=...', // ¡REEMPLAZA CON EL MAGNET LINK REAL!
        amountNano: 0.002
    },
    'otra_serie_ep1': {
        seriesId: 'otra_serie',
        title: 'Capítulo Piloto: El Despertar',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_OTRA_SERIE_AQUI&dn=Otra+Serie+Cap+1.mp4&tr=...', // ¡REEMPLAZA CON EL MAGNET LINK REAL!
        amountNano: 0.002
    },
    'otra_serie_ep2': {
        seriesId: 'otra_serie',
        title: 'Capítulo 1: El Primer Desafío',
        magnetLink: 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK_OTRA_SERIE_EP2_AQUI&dn=Otra+Serie+Cap+2.mp4&tr=...', // ¡REEMPLAZA CON EL MAGNET LINK REAL!
        amountNano: 0.002
    }
    // Puedes añadir más capítulos aquí, asegurándote de que cada uno tenga un 'seriesId' válido
    /*
    'nueva_serie_ep1': {
        seriesId: 'nueva_serie_id', // Debe coincidir con un ID en SERIES_DATA
        title: 'Título del Capítulo',
        magnetLink: 'magnet:?xt=urn:btih:HASH&dn=nombre.mp4&tr=...',
        amountNano: 0.001
    }
    */
};
