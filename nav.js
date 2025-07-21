// nav.js

document.addEventListener('DOMContentLoaded', () => {
    // Asegúrate de que este ID coincida con tu index.html
    const userLinksContainer = document.getElementById('user-links'); 
    // CONSISTENCIA: Usaremos 'token' para la clave de localStorage
    const token = localStorage.getItem('token'); 
    const username = localStorage.getItem('username');

    if (token) { 
        // Usuario logueado
        userLinksContainer.innerHTML = `
            <span class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium">Hola, ${username || 'Usuario'}!</span>
            <a href="profile.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Mi Perfil</a>
            <a href="#" id="logout-link" class="text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-sm font-medium">Cerrar Sesión</a>
        `;

        document.getElementById('logout-link').addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('token'); // Eliminar el token
            localStorage.removeItem('username'); // Eliminar el nombre de usuario
            alert('Has cerrado sesión.');
            window.location.href = 'index.html'; // Redirige a la página principal después de cerrar sesión
        });

    } else {
        // Usuario no logueado
        userLinksContainer.innerHTML = `
            <a href="login.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Iniciar Sesión</a>
            <a href="register.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Registro</a>
        `;
    }
});