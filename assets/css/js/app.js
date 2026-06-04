const SUPABASE_URL = "https://jmnkbvfdomhlmpfedzyc.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmtidmZkb21obG1wZmVkenljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzU3MDEsImV4cCI6MjA5NTkxMTcwMX0.PWqfkJpPXhifJA8LxDomnOrmKbes-0HSxSG6j477iiM";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isLoginMode = true; // Por defecto inicia configurado como Login
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
        await actualizarEstadoUI(session);
    });
    await inicializarApp();
});

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Función que fuerza la apertura directa del inicio de sesión (Login)
function abrirLogin() {
    isLoginMode = true;
    document.getElementById('auth-title').innerText = 'Iniciar Sesión';
    document.getElementById('wrapper-nombres').style.display = 'none';
    document.getElementById('auth-toggle-text').innerText = '¿No posee una cuenta?';
    document.getElementById('btn-auth-toggle').innerText = 'Regístrate aquí';
    openModal('auth-modal');
}

// Alternar entre inicio de sesión y registro de manera reactiva dentro del modal
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta';
    document.getElementById('wrapper-nombres').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? '¿No posee una cuenta?' : '¿Ya posee una cuenta?';
    document.getElementById('btn-auth-toggle').innerText = isLoginMode ? 'Regístrate aquí' : 'Inicie Sesión';
}

async function inicializarApp() {
    const { data: { session } } = await supabase.auth.getSession();
    await actualizarEstadoUI(session);
    await cargarApartamentos();
}

async function actualizarEstadoUI(session) {
    const btnAuth = document.getElementById('btn-nav-auth');
    const btnLogout = document.getElementById('btn-logout');
    const userStatus = document.getElementById('user-status');

    if (session && session.user) {
        currentUser = session.user;
        if(btnAuth) btnAuth.classList.add('hidden');
        if(btnLogout) btnLogout.classList.remove('hidden');
        if(userStatus) {
            userStatus.innerText = `Huésped VIP: ${currentUser.email}`;
            userStatus.classList.remove('hidden');
        }
    } else {
        currentUser = null;
        if(btnAuth) btnAuth.classList.remove('hidden');
        if(btnLogout) btnLogout.classList.add('hidden');
        if(userStatus) {
            userStatus.innerText = '';
            userStatus.classList.add('hidden');
        }
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(`Error de Acceso: ${error.message}`);
        } else {
            closeModal('auth-modal');
            await actualizarEstadoUI(data.session);
        }
    } else {
        const nombres = document.getElementById('auth-nombres').value;
        const apellidos = document.getElementById('auth-apellidos').value;

        const { data, error } = await supabase.auth.signUp({
            email, password, options: { data: { nombres, apellidos } }
        });
        
        if (error) {
            alert(`Error de Registro: ${error.message}`);
        } else {
            alert('Cuenta creada exitosamente. Se ha iniciado su sesión.');
            closeModal('auth-modal');
            await actualizarEstadoUI(data.session);
        }
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        await actualizarEstadoUI(null);
    }
}

async function cargarApartamentos() {
    const grid = document.getElementById('apartamentos-grid');
    const { data: propiedades, error } = await supabase.rpc('get_apartamentos_disponibles');

    if (error) {
        grid.innerHTML = `<div class="col-span-full text-center text-stone-400 py-12 font-light text-xs uppercase tracking-widest">Sincronizando catálogo residencial...</div>`;
        return;
    }
    renderCards(propiedades);
}

async function filtrarPropiedades() {
    const ubicacion = document.getElementById('search-ubicacion').value || null;
    const huespedes = parseInt(document.getElementById('search-huespedes').value) || null;
    
    const { data: filtrados, error } = await supabase.rpc('buscar_propiedades', {
        p_ubicacion: ubicacion, p_huespedes: huespedes
    });

    if (!error) {
        renderCards(filtrados);
    }
}

function renderCards(lista) {
    const grid = document.getElementById('apartamentos-grid');
    if (!lista || lista.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-stone-400 py-12 font-light text-xs uppercase tracking-widest">No se encontraron residencias disponibles.</div>`;
        return;
    }

    grid.innerHTML = lista.map((apt, index) => {
        const finalImgUrl = apt.imagen_url ? apt.imagen_url : 'assets/images/default-thumbnail.webp';
        const loadingStrategy = index < 4 ? 'eager' : 'lazy';

        return `
            <article onclick="abrirBooking(${apt.id}, '${apt.nombre}', ${apt.precio_por_noche})" class="apartment-card group cursor-pointer flex flex-col justify-between">
                <div class="w-full flex flex-col">
                    <div class="card-img-container mb-4 shadow-sm">
                        <img src="${finalImgUrl}" 
                             alt="${apt.nombre}" 
                             loading="${loadingStrategy}"
                             class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out">
                        ${apt.destacado ? '<span class="absolute top-4 left-4 bg-white text-stone-900 text-[8px] font-bold px-3 py-1.5 uppercase tracking-widest shadow-xs">Colección Privada</span>' : ''}
                    </div>
                    
                    <div class="flex justify-between items-start text-xs tracking-wide">
                        <span class="font-semibold text-stone-900 truncate pr-2 w-[85%] uppercase text-[11px] tracking-wider">${apt.nombre}</span>
                        <span class="text-[#C5A059] font-medium shrink-0">★ 4.9</span>
                    </div>
                    <span class="text-stone-400 text-xs mt-1 font-light tracking-wide">${apt.ubicacion}</span>
                    <span class="text-stone-400 text-[11px] mt-0.5 font-light">Capacidad: ${apt.capacidad} personas</span>
                    
                    <div class="mt-4 border-t border-stone-200/40 pt-2 flex items-baseline gap-1">
                        <span class="font-serif text-base text-stone-900 font-medium">$${apt.precio_por_noche}</span>
                        <span class="text-stone-400 font-light text-[11px]"> / noche</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function abrirBooking(id, nombre, precio) {
    document.getElementById('booking-apt-id').value = id;
    document.getElementById('booking-apt-precio').value = precio;
    document.getElementById('booking-propiedad-nombre').innerText = nombre;
    if(currentUser) { document.getElementById('book-email').value = currentUser.email; }
    calcularPrecioTotal();
    openModal('booking-modal');
}

function calcularPrecioTotal() {
    const entrada = document.getElementById('book-entrada').value;
    const salida = document.getElementById('book-salida').value;
    const precioNoche = parseFloat(document.getElementById('booking-apt-precio').value) || 0;
    
    if (!entrada || !salida) return;

    const nights = Math.ceil((new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24));

    if (nights > 0) {
        const total = nights * precioNoche;
        document.getElementById('booking-noches').innerText = `${nights} noche(s) en Carrillo`;
        document.getElementById('booking-precio-total').innerText = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    } else {
        document.getElementById('booking-noches').innerText = "Rango no válido";
        document.getElementById('booking-precio-total').innerText = "$0.00";
    }
}

async function handleBooking(event) {
    event.preventDefault();
    const aptId = parseInt(document.getElementById('booking-apt-id').value);
    const precioNoche = parseFloat(document.getElementById('booking-apt-precio').value);
    const entrada = document.getElementById('book-entrada').value;
    const salida = document.getElementById('book-salida').value;
    
    const nights = Math.ceil((new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) { return alert('Verifique las fechas.'); }

    const reservaPayload = {
        apartamento_id: aptId,
        user_id: currentUser ? currentUser.id : null, 
        nombres: document.getElementById('book-nombres').value,
        apellidos: document.getElementById('book-apellidos').value,
        email: document.getElementById('book-email').value,
        telefono: document.getElementById('book-telefono').value,
        fecha_entrada: entrada,
        fecha_salida: salida,
        numero_huespedes: parseInt(document.getElementById('book-huespedes').value),
        precio_total: nights * precioNoche,
        estado: 'pendiente',
        notas: document.getElementById('book-notas').value || null
    };

    const { error } = await supabase.from('reservas').insert([reservaPayload]);

    if (error) alert(`Error: ${error.message}`);
    else {
        alert('Su solicitud de reserva ha sido enviada con éxito.');
        closeModal('booking-modal');
        document.getElementById('booking-form').reset();
    }
}