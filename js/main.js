// ¡Esta línea es la que DEBE ELIMINARSE!
// import WebTorrent from 'webtorrent'; 

document.addEventListener('DOMContentLoaded', () => {
    const magnetLinkInput = document.getElementById('magnetLinkInput');
    const downloadButton = document.getElementById('downloadButton');
    const outputDiv = document.getElementById('output');

    // La variable WebTorrent ahora está disponible porque la cargaste desde el CDN en el HTML
    const client = new WebTorrent(); 

    downloadButton.addEventListener('click', () => {
        const magnetURI = magnetLinkInput.value.trim();

        if (!magnetURI) {
            outputDiv.innerHTML = '<p style="color: red;">Por favor, ingresa un Magnet Link válido.</p>';
            return;
        }

        outputDiv.innerHTML = '<p>Iniciando descarga/reproducción...</p>';

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

            torrent.files.forEach((file) => {
                if (file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg')) {
                    const videoElement = document.createElement('video');
                    videoElement.controls = true;
                    videoElement.autoplay = true;
                    videoElement.style.maxWidth = '100%';
                    videoElement.style.display = 'block';
                    videoElement.style.marginTop = '15px';

                    outputDiv.appendChild(videoElement);
                    file.renderTo(videoElement);
                    outputDiv.innerHTML += `<p>Reproduciendo: ${file.name}</p>`;
                } else {
                    const fileLink = document.createElement('a');
                    fileLink.href = '#';
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

        client.on('error', (err) => {
            console.error('WebTorrent Error:', err.message);
            outputDiv.innerHTML = `<p style="color: red;">Error en WebTorrent: ${err.message}</p>`;
        });
    });
});

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}