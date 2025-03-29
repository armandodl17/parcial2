document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    

    const toastEl = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastEl);
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');


    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginCard.classList.add('d-none');
        registerCard.classList.remove('d-none');
    });

  
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerCard.classList.add('d-none');
        loginCard.classList.remove('d-none');
    });

   
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!validateLoginForm(email, password)) return;

        await handleLogin(email, password);
    });

    // Validación y envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!validateRegisterForm(name, email, password, confirmPassword)) return;

        await handleRegistration(name, email, password);
    });

    // Funciones de validación
    function validateLoginForm(email, password) {
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Validar email
        if (!email) {
            document.getElementById('emailError').textContent = 'El correo electrónico es requerido';
            document.getElementById('email').classList.add('is-invalid');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            document.getElementById('emailError').textContent = 'Ingrese un correo electrónico válido';
            document.getElementById('email').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
        }
        
        // Validar contraseña
        if (!password) {
            document.getElementById('passwordError').textContent = 'La contraseña es requerida';
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'La contraseña debe tener al menos 6 caracteres';
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('password').classList.remove('is-invalid');
        }
        
        return isValid;
    }

    function validateRegisterForm(name, email, password, confirmPassword) {
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Validar nombre
        if (!name) {
            document.getElementById('nameError').textContent = 'El nombre es requerido';
            document.getElementById('regName').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('regName').classList.remove('is-invalid');
        }
        
   
        if (!email) {
            document.getElementById('regEmailError').textContent = 'El correo electrónico es requerido';
            document.getElementById('regEmail').classList.add('is-invalid');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            document.getElementById('regEmailError').textContent = 'Ingrese un correo electrónico válido';
            document.getElementById('regEmail').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('regEmail').classList.remove('is-invalid');
        }
        
      
        if (!password) {
            document.getElementById('regPasswordError').textContent = 'La contraseña es requerida';
            document.getElementById('regPassword').classList.add('is-invalid');
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('regPasswordError').textContent = 'La contraseña debe tener al menos 6 caracteres';
            document.getElementById('regPassword').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('regPassword').classList.remove('is-invalid');
        }

        if (!confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Confirme su contraseña';
            document.getElementById('regConfirmPassword').classList.add('is-invalid');
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Las contraseñas no coinciden';
            document.getElementById('regConfirmPassword').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('regConfirmPassword').classList.remove('is-invalid');
        }
        
        return isValid;
    }

    // Funciones para manejar las peticiones
    async function handleLogin(email, password) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Ingresando...';

        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Credenciales incorrectas');
            }

         
            localStorage.setItem('authToken', data.token || '');
            localStorage.setItem('userData', JSON.stringify(data.user));

            showToast('success', 'Inicio de sesión exitoso');
            
            
            setTimeout(() => {
                window.location.href = 'productos.html';
            }, 1500);

        } catch (error) {
            showToast('error', error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async function handleRegistration(name, email, password) {
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    password_confirmation: document.getElementById('regConfirmPassword').value
                })
            });

            const data = await response.json();

            if (!response.ok) {
       
                if (data.errors) {
                    let errorMessages = [];
                    for (const [key, value] of Object.entries(data.errors)) {
                        errorMessages.push(value.join(', '));
                    }
                    throw new Error(errorMessages.join('\n'));
                }
                throw new Error(data.message || 'Error al registrar usuario');
            }

            showToast('success', '¡Registro exitoso! Redirigiendo...');

            setTimeout(() => {
                handleLogin(email, password);
            }, 1500);

        } catch (error) {
            showToast('error', error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function showToast(type, message) {
        const toastType = type === 'error' ? 'danger' : 'success';
        
 
        toastTitle.textContent = type === 'error' ? 'Error' : 'Éxito';
        toastMessage.textContent = message;
        

        const toastHeader = toastEl.querySelector('.toast-header');
        toastHeader.className = `toast-header text-white bg-${toastType}`;
        
     
        toast.show();
    }
});