const translations = {
    es: {
        "nav-about": "Nosotros",
        "nav-services": "Servicios",
        "nav-testimonials": "Testimonios",
        "nav-faq": "FAQ",
        "nav-contact": "Contacto",
        "about-title": "Cuidamos a quienes más nos cuidaron",
        "about-desc": "Somos una plataforma chilena nacida para devolver la tranquilidad a las familias. Conectamos a hijos, nietos y cuidadores en un ecosistema digital transparente para el bienestar de nuestros tatas.",
        "cta-contact": "Empezar ahora",
        "blog-title": "Consejos para el Cuidado",
        "blog1-h": "Alimentación Senior",
        "blog1-p": "Claves para una nutrición balanceada en la tercera edad.",
        "blog2-h": "Salud Mental",
        "blog2-p": "Actividades para mantener la mente activa y feliz.",
        "blog3-h": "Primeros Auxilios",
        "blog3-p": "Qué hacer ante caídas o emergencias domésticas.",
        "serv1-t": "Gestión de Medicación",
        "serv1-d": "Alarmas y confirmación visual para que nunca falte una dosis.",
        "serv2-t": "Bitácora Diaria",
        "serv2-d": "Registro de comidas, ánimo y actividades por parte del cuidador.",
        "serv3-t": "Multi-Familiar",
        "serv3-d": "Todos los hermanos e hijos conectados bajo una misma cuenta.",
        "serv4-t": "Botón de Pánico",
        "serv4-d": "Alerta instantánea a toda la familia en caso de emergencia.",
        "test1-p": "\"Gracias a CuidoAMiTata pude volver a trabajar tranquila. ¡Es genial!\"",
        "test2-p": "\"Mis hermanos y yo nos organizamos increíble. ¡La recomiendo 100%!\"",
        "test3-p": "\"Como cuidadora, me facilita mucho el reporte diario a la familia.\"",
        "faq1-q": "¿Es difícil de usar para el cuidador?",
        "faq1-a": "No, está diseñada con botones grandes y voz a texto para máxima simplicidad.",
        "faq2-q": "¿Tiene costo mensual?",
        "faq2-a": "Tenemos un plan gratuito básico y un plan Premium para familias grandes.",
        "faq3-q": "¿Funciona sin internet?",
        "faq3-a": "Los registros se guardan y se sincronizan apenas recuperes la señal.",
        "faq4-q": "¿Puedo agregar más de un Tata?",
        "faq4-a": "Sí, puedes gestionar múltiples perfiles bajo una misma suscripción familiar.",
        "faq5-q": "¿Cómo funciona el botón de pánico?",
        "faq5-a": "Envía notificación push, SMS y llamada automática a todos los familiares registrados.",
        "footer-desc": "Solución líder en gestión de cuidado para el adulto mayor en Chile. Tecnología al servicio del amor familiar.",
        "theme-label": "Tema"
    },
    en: {
        "nav-about": "About Us",
        "nav-services": "Services",
        "nav-testimonials": "Testimonials",
        "nav-faq": "FAQ",
        "nav-contact": "Contact",
        "about-title": "We care for those who cared for us",
        "about-desc": "We are a Chilean platform born to bring peace of mind to families. We connect children, grandchildren, and caregivers in a transparent digital ecosystem for the well-being of our elders.",
        "cta-contact": "Get Started",
        "blog-title": "Caregiving Tips",
        "blog1-h": "Senior Nutrition",
        "blog1-p": "Keys to a balanced diet in old age.",
        "blog2-h": "Mental Health",
        "blog2-p": "Activities to keep the mind active and happy.",
        "blog3-h": "First Aid",
        "blog3-p": "What to do in case of falls or home emergencies.",
        "serv1-t": "Medication Management",
        "serv1-d": "Alarms and visual confirmation so you never miss a dose.",
        "serv2-t": "Daily Log",
        "serv2-d": "Record of meals, mood and activities by the caregiver.",
        "serv3-t": "Multi-Family",
        "serv3-d": "All siblings and children connected under one account.",
        "serv4-t": "Panic Button",
        "serv4-d": "Instant alert to the entire family in case of emergency.",
        "test1-p": "\"Thanks to CuidoAMiTata I could go back to work peacefully. It's great!\"",
        "test2-p": "\"My siblings and I organize ourselves incredibly. I recommend it 100%!\"",
        "test3-p": "\"As a caregiver, it makes daily reporting to the family much easier.\"",
        "faq1-q": "Is it difficult for the caregiver to use?",
        "faq1-a": "No, it's designed with large buttons and voice-to-text for maximum simplicity.",
        "faq2-q": "Does it have a monthly cost?",
        "faq2-a": "We have a free basic plan and a Premium plan for large families.",
        "faq3-q": "Does it work without internet?",
        "faq3-a": "Records are saved and synced as soon as you recover the signal.",
        "faq4-q": "Can I add more than one elder?",
        "faq4-a": "Yes, you can manage multiple profiles under one family subscription.",
        "faq5-q": "How does the panic button work?",
        "faq5-a": "It sends push notification, SMS and automatic call to all registered family members.",
        "footer-desc": "Leading care management solution for the elderly in Chile. Technology at the service of family love.",
        "theme-label": "Theme"
    }
};

// Variables globales
let currentLang = localStorage.getItem('lang') || 'es';
let isDark = localStorage.getItem('theme') !== 'light';

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // Aplicar tema
    applyTheme();
    
    // Aplicar idioma
    applyLang(currentLang);
    
    // Configurar event listeners
    setupEventListeners();
}

function applyTheme() {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function setupEventListeners() {
    // Botón de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Botón back to top
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', scrollToTop);
    }
    
    // Scroll
    window.addEventListener('scroll', handleScroll);
}

function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    if (mobileThemeToggle) {
        const icon = mobileThemeToggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLang(lang);
}

function applyLang(lang) {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

function handleScroll() {
    // Progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }
    
    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        if (scrollTop > 300) {
            backToTop.style.opacity = '1';
            backToTop.style.pointerEvents = 'auto';
        } else {
            backToTop.style.opacity = '0';
            backToTop.style.pointerEvents = 'none';
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const menuButton = document.querySelector('.md\\:hidden i');
    
    if (menu) {
        menu.classList.toggle('hidden');
        
        if (menuButton) {
            menuButton.className = menu.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-times';
        }
    }
}

function openBlog(id) {
    const modal = document.getElementById('blog-modal');
    const content = document.getElementById('blog-content');
    
    if (!modal || !content) return;
    
    const blogs = {
        1: { 
            t: "Alimentación Saludable", 
            c: "En la tercera edad, es vital reducir el sodio e hidratar constantemente. Nuestra App permite registrar cada comida...", 
            img: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600" 
        },
        2: { 
            t: "Salud Mental Activa", 
            c: "Juegos de memoria y paseos diarios reducen el riesgo de depresión. Registra estas actividades en el checklist...", 
            img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600" 
        },
        3: { 
            t: "Prevención de Caídas", 
            c: "Mantener espacios iluminados y usar calzado antideslizante es clave. En caso de incidente, usa el Botón de Pánico...", 
            img: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600" 
        }
    };
    
    if (blogs[id]) {
        content.innerHTML = `
            <img src="${blogs[id].img}" class="w-full h-64 object-cover rounded-lg mb-4">
            <h2 class="text-2xl font-bold mb-4">${blogs[id].t}</h2>
            <p class="leading-relaxed opacity-90">${blogs[id].c}</p>
        `;
        modal.showModal();
    }
}
