document.addEventListener('DOMContentLoaded', function() {

    const productsContainer = document.getElementById('productsContainer');
    const productForm = document.getElementById('productForm');
    const productFormContainer = document.getElementById('productFormContainer');
    const createProductBtn = document.getElementById('createProductBtn');
    const cancelFormBtn = document.getElementById('cancelForm');
    const messagesDiv = document.getElementById('messages');
    const logoutBtn = document.getElementById('logoutBtn');
    

    let currentUser = null;
    let editingProductId = null;


    checkAuth();
    setupEventListeners();


    function checkAuth() {
        const userData = localStorage.getItem('userData');
        
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = JSON.parse(userData);
        loadProducts();
    }

    function setupEventListeners() {
        createProductBtn.addEventListener('click', showProductForm);
        cancelFormBtn.addEventListener('click', hideProductForm);
        productForm.addEventListener('submit', handleProductSubmit);
        logoutBtn.addEventListener('click', handleLogout);
    }

    async function loadProducts() {
        try {
            const response = await fetch(`http://localhost:8000/productos/usuario/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Error al cargar productos');
            
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            showMessage('danger', error.message);
        }
    }

    function renderProducts(products) {
        productsContainer.innerHTML = '';
        
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h4 class="text-muted">No tienes productos registrados</h4>
                    <p>Haz clic en "+ Nuevo Producto" para agregar uno</p>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const productCard = `
                <div class="col-md-4 mb-4" data-id="${product.id}">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${product.nombre}</h5>
                            <p class="card-text">${product.description || 'Sin descripción'}</p>
                            <p class="text-muted">$${product.precio.toFixed(2)}</p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-warning edit-product">Editar</button>
                            <button class="btn btn-sm btn-danger delete-product">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            productsContainer.innerHTML += productCard;
        });

        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.col-md-4').dataset.id;
                editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.col-md-4').dataset.id;
                deleteProduct(productId);
            });
        });
    }

    function showProductForm() {
        document.getElementById('formTitle').textContent = 'Nuevo Producto';
        productForm.reset();
        productFormContainer.classList.remove('d-none');
        editingProductId = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideProductForm() {
        productFormContainer.classList.add('d-none');
    }

    async function editProduct(productId) {
        try {
            const response = await fetch(`http://localhost:8000/productos/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Error al cargar el producto');
            
            const product = await response.json();
            
            // Verificar que el producto pertenece al usuario
            if (product.user_id !== currentUser.id) {
                throw new Error('No tienes permiso para editar este producto');
            }
            
            // Llenar el formulario
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.precio;
            
            document.getElementById('formTitle').textContent = 'Editar Producto';
            productFormContainer.classList.remove('d-none');
            editingProductId = product.id;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            showMessage('danger', error.message);
        }
    }

    async function handleProductSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitProductBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Procesando...';
        
        const productData = {
            nombre: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            precio: parseFloat(document.getElementById('productPrice').value),
            user_id: currentUser.id
        };
        
        try {
            let response;
            
            if (editingProductId) {
    
                response = await fetch(`http://localhost:8000/productos/${editingProductId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(productData)
                });
            } else {

                response = await fetch('http://localhost:8000/productos/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(productData)
                });
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Error al guardar el producto');
            }
            
            showMessage('success', editingProductId ? 'Producto actualizado' : 'Producto creado');
            hideProductForm();
            loadProducts();
            
        } catch (error) {
            showMessage('danger', error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar';
        }
    }

    async function deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:8000/productos/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Error al eliminar el producto');
            
            showMessage('success', 'Producto eliminado');
            loadProducts();
            
        } catch (error) {
            showMessage('danger', error.message);
        }
    }

    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }

    function showMessage(type, text) {
        messagesDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show">
                ${text}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
      
        setTimeout(() => {
            const alert = messagesDiv.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
});