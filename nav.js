// nav.js

document.addEventListener('DOMContentLoaded', () => {
    const authLinksContainer = document.getElementById('auth-links');
    const jwtToken = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('username'); // Recupera el nombre de usuario si lo guardaste

    if (jwtToken) {
        // Usuario logueado
        authLinksContainer.innerHTML = `
            <span class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium">Hola, ${username || 'Usuario'}!</span>
            <a href="profile.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Mi Perfil</a>
            <a href="#" id="logout-link" class="text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-sm font-medium">Cerrar Sesión</a>
        `;

        document.getElementById('logout-link').addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('jwtToken'); // Eliminar el token
            localStorage.removeItem('username'); // Eliminar el nombre de usuario
            // Puedes limpiar cualquier otro dato de sesión aquí
            alert('Has cerrado sesión.');
            window.location.reload(); // Recargar la página para actualizar la nav bar
        });

    } else {
        // Usuario no logueado
        authLinksContainer.innerHTML = `
            <a href="login.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Iniciar Sesión</a>
            <a href="register.html" class="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">Registro</a>
        `;
    }
});