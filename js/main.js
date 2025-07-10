// js/main.js

// Importa WebTorrent como un módulo desde el CDN esm.sh
import WebTorrent from 'https://esm.sh/webtorrent';

document.addEventListener('DOMContentLoaded', () => {
    const magnetLinkInput = document.getElementById('magnetLinkInput');
    const downloadButton = document.getElementById('downloadButton');
    const outputDiv = document.getElementById('output');

    // 1. Crea una nueva instancia del cliente WebTorrent
    // Ahora 'WebTorrent' se importa correctamente gracias a la línea de arriba
    const client = new WebTorrent();

    downloadButton.addEventListener('click', () => {
        const magnetURI = magnetLinkInput.value.trim();

        if (!magnetURI) {
            outputDiv.innerHTML = '<p style="color: red;">Por favor, ingresa un Magnet Link válido.</p>';
            return;
        }

        outputDiv.innerHTML = '<p>Iniciando descarga/reproducción...</p>';

        // 2. Añade el torrent al cliente
        client.add(magnetURI, (torrent) => {
            outputDiv.innerHTML = '<p>Torrent añadido: ' + torrent.name + '</p>';
            console.log('Cliente WebTorrent está descargando:', torrent.name);

            torrent.on('download', () => {
                const progress = (torrent.progress * 100).toFixed(1);
                outputDiv.innerHTML = `<p>Descargando: ${torrent.name} (${progress}%) - Velocidad: ${formatBytes(torrent.downloadSpeed)}/s - Pares: ${torrent.numPeers}</p>`;
            });

            torrent.on('done', () => {
                outputDiv.innerHTML += '<p style="color: green;">Descarga completada!</p>';
                console.log('Torrent descarga completada!');
            });

            // 3. Busca el archivo de video principal para reproducirlo
            // Itera sobre los archivos en el torrent
            torrent.files.forEach((file) => {
                if (file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg')) {
                    // Si es un archivo de video, renderízalo en un elemento <video>
                    file.renderTo(outputDiv, {
                        autoplay: true,
                        controls: true // Muestra los controles de reproducción
                    });
                    outputDiv.innerHTML += `<p>Reproduciendo: ${file.name}</p>`;
                } else {
                    // Para otros archivos, simplemente muestra un enlace para descargarlos
                    const fileLink = document.createElement('a');
                    fileLink.href = '#'; // El href será el blob URL
                    fileLink.textContent = `Descargar: ${file.name}`;
                    fileLink.style.display = 'block';
                    fileLink.style.marginTop = '10px';
                    fileLink.onclick = (e) => {
                        e.preventDefault();
                        file.getBlobURL((err, url) => {
                            if (err) return console.error(err);
                            const downloadLink = document.createElement('a');
                            downloadLink.href = url;
                            downloadLink.download = file.name;
                            downloadLink.click();
                        });
                    };
                    outputDiv.appendChild(fileLink);
                }
            });
        });

        // Manejo de errores
        client.on('error', (err) => {
            console.error('WebTorrent Error:', err.message);
            outputDiv.innerHTML = `<p style="color: red;">Error en WebTorrent: ${err.message}</p>`;
        });
    });

    // Función de utilidad para formatear bytes (para mostrar la velocidad)
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});