const translations = {
    es: {
        "nav-about": "Nosotros",
        "nav-services": "Servicios",
        "nav-testimonials": "Testimonios",
        "nav-faq": "FAQ",
        "nav-contact": "Contacto",
        "about-title": "Cuidamos a quienes más nos cuidaron",
        "about-desc": "Somos una plataforma chilena nacida para devolver la tranquilidad a las familias. Conectamos a hijos, nietos y cuidadores.",
        "cta-contact": "Empezar ahora",
        "blog-title": "Consejos para el Cuidado",
        "blog1-h": "Alimentación Senior",
        "blog1-p": "Claves para una nutrición balanceada.",
        "test1-p": "\"Gracias a CuidoAMiTata pude volver a trabajar tranquila.\"",
        "faq1-q": "¿Es difícil de usar?",
        "faq1-a": "No, es intuitiva y simple.",
        "footer-desc": "Líder en gestión de cuidado en Chile."
    },
    en: {
        "nav-about": "About",
        "nav-services": "Services",
        "nav-testimonials": "Testimonials",
        "nav-faq": "FAQ",
        "nav-contact": "Contact",
        "about-title": "We care for those who cared for us",
        "about-desc": "We are a Chilean platform born to bring peace of mind to families. We connect children, grandchildren, and caregivers.",
        "cta-contact": "Start Now",
        "blog-title": "Caregiving Tips",
        "blog1-h": "Senior Nutrition",
        "blog1-p": "Keys to a balanced diet.",
        "test1-p": "\"Thanks to CuidoAMiTata I could work peacefully again.\"",
        "faq1-q": "Is it hard to use?",
        "faq1-a": "No, it's intuitive and simple.",
        "footer-desc": "Leader in care management in Chile."
    }
};

// --- Gestión de Configuración (LocalStorage) ---
let currentLang = localStorage.getItem('lang') || 'es';
let isDark = localStorage.getItem('theme') !== 'light'; // Por defecto dark

function init() {
    // Aplicar Tema
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon();
    }
    
    // Aplicar Idioma
    applyLang(currentLang);
}

// --- Tema Oscuro/Claro ---
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

// --- Multilenguaje ---
function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLang(lang);
}

function applyLang(lang) {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
}

// --- Scroll Logic ---
window.onscroll = function() {
    // Progress Bar
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById("progress-bar").style.width = scrolled + "%";

    // Back to Top Button
    const btt = document.getElementById("backToTop");
    if (winScroll > 300) {
        btt.style.display = "flex";
    } else {
        btt.style.display = "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById("backToTop").onclick = scrollToTop;

// --- Blog Modal Logic ---
function openBlog(id) {
    const modal = document.getElementById('blog-modal');
    const content = document.getElementById('blog-content');
    
    const blogs = {
        1: { t: "Alimentación Saludable", c: "En la tercera edad, es vital reducir el sodio e hidratar constantemente. Nuestra App permite registrar cada comida...", img: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600" },
        2: { t: "Salud Mental Activa", c: "Juegos de memoria y paseos diarios reducen el riesgo de depresión. Registra estas actividades en el checklist...", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600" },
        3: { t: "Prevención de Caídas", c: "Mantener espacios iluminados y usar calzado antideslizante es clave. En caso de incidente, usa el Botón de Pánico...", img: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600" }
    };

    content.innerHTML = `
        <img src="${blogs[id].img}" class="w-full h-64 object-cover rounded-lg mb-4">
        <h2 class="text-2xl font-bold mb-4">${blogs[id].t}</h2>
        <p class="leading-relaxed opacity-90">${blogs[id].c}</p>
    `;
    modal.showModal();
}

// Mobile Menu Toggle
function toggleMenu() {
    const menu = document.querySelector('.md\\:flex');
    menu.classList.toggle('hidden');
    menu.classList.toggle('flex-col');
    menu.classList.toggle('absolute');
    menu.classList.toggle('top-16');
    menu.classList.toggle('left-0');
    menu.classList.toggle('w-full');
    menu.classList.toggle('bg-white');
    menu.classList.toggle('dark:bg-slate-800');
    menu.classList.toggle('p-4');
}

// Inicializar
init();