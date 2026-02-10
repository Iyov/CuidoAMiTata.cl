// JavaScript para CuidoAMiTata.cl

// Variables globales para el manejo de idioma y tema
let currentLanguage = 'es';
let currentTheme = 'dark';

// Diccionario de traducciones
const translations = {
    es: {
        // Navegación
        'nav.nosotros': 'Nosotros',
        'nav.servicios': 'Servicios',
        'nav.testimonios': 'Testimonios',
        'nav.faq': 'FAQ',
        'nav.contacto': 'Contacto',
        
        // Hero section
        'hero.title1': 'Cuidado Profesional',
        'hero.title2': 'para Adultos Mayores',
        'hero.subtitle': 'Brindamos servicios especializados de cuidado para tus seres queridos con tecnología, compromiso y calidez humana.',
        'hero.btn1': 'Solicitar Servicios',
        'hero.btn2': 'Conocer Más',
        
        // Sección Nosotros
        'nosotros.title': 'Nosotros',
        'nosotros.subtitle': 'Comprometidos con el bienestar de los adultos mayores',
        'nosotros.who': 'Quiénes Somos',
        'nosotros.text1': 'Somos un equipo de profesionales comprometidos con mejorar la calidad de vida de los adultos mayores en Chile. Nuestra misión es brindar servicios de cuidado que combinen tecnología innovadora con calidez humana.',
        'nosotros.text2': 'Entendemos los desafíos que enfrentan las familias al cuidar a sus seres queridos de la tercera edad, por eso hemos creado soluciones integrales que facilitan este proceso y garantizan el bienestar de nuestros usuarios.',
        'nosotros.feature1': 'Cuidado Compasivo',
        'nosotros.feature1desc': 'Trato respetuoso y empático con cada persona.',
        'nosotros.feature2': 'Seguridad Garantizada',
        'nosotros.feature2desc': 'Protocolos de seguridad para emergencias y cuidados diarios.',
        'nosotros.feature3': 'Enfoque Familiar',
        'nosotros.feature3desc': 'Involucramos a toda la familia en el proceso de cuidado.',
        'nosotros.feature4': 'Tecnología Innovadora',
        'nosotros.feature4desc': 'Soluciones digitales para un cuidado más efectivo.',
        
        // Sección Servicios
        'servicios.title': 'Nuestros Servicios',
        'servicios.subtitle': 'Soluciones integrales para el cuidado de adultos mayores',
        'servicio1.title': 'Gestión de Medicación',
        'servicio1.desc': 'Alarmas y confirmación visual para que nunca falte una dosis. Seguimiento detallado de horarios y dosis.',
        'servicio2.title': 'Bitácora Diaria',
        'servicio2.desc': 'Registro de comidas, ánimo y actividades por parte del cuidador. Información actualizada para la familia.',
        'servicio3.title': 'Multi-Familiar',
        'servicio3.desc': 'Todos los hermanos e hijos conectados bajo una misma cuenta. Coordinación familiar simplificada.',
        'servicio4.title': 'Botón de Pánico',
        'servicio4.desc': 'Alerta instantánea a toda la familia en caso de emergencia. Respuesta rápida cuando más se necesita.',
        
        // Sección Testimonios
        'testimonios.title': 'Testimonios',
        'testimonios.subtitle': 'Lo que dicen las familias que confían en nosotros',
        'testimonio1.name': 'María González',
        'testimonio1.role': 'Hija de usuario',
        'testimonio1.text': '"El servicio de CuidoAMiTata me ha dado paz mental. Saber que mi mamá está bien cuidada y que puedo ver su bitácora diaria desde mi trabajo es invaluable. ¡Recomiendo totalmente sus servicios!"',
        'testimonio2.name': 'Carlos Rodríguez',
        'testimonio2.role': 'Hijo de usuario',
        'testimonio2.text': '"El botón de pánico ha sido un salvavidas en dos ocasiones. Mi papá tuvo caídas y la alerta llegó inmediatamente a todos en la familia. La respuesta fue rápida y profesional. Gracias CuidoAMiTata."',
        'testimonio3.name': 'Ana Silva',
        'testimonio3.role': 'Nieta de usuario',
        'testimonio3.text': '"La gestión de medicación ha solucionado uno de nuestros mayores problemas. Mi abuelo nunca más se saltó una dosis. Además, toda la familia puede estar al tanto desde cualquier lugar. Excelente servicio."',
        
        // Sección Blog
        'blog.title': 'Blog y Consejos',
        'blog.subtitle': 'Artículos útiles para el cuidado de adultos mayores',
        'blog1.title': 'Organización de Medicamentos para Adultos Mayores',
        'blog1.desc': 'Aprende técnicas efectivas para gestionar medicamentos y evitar confusiones en las dosis.',
        'blog1.content': '<h3>Organización de Medicamentos para Adultos Mayores</h3><p>La gestión adecuada de medicamentos es crucial para la salud de los adultos mayores. Con frecuencia, las personas de la tercera edad toman múltiples medicamentos a diferentes horas del día, lo que puede llevar a confusiones, dosis omitidas o duplicadas.</p><p><strong>Consejos para una mejor organización:</strong></p><ul><li>Utilice pastilleros con compartimentos para cada día de la semana y cada horario</li><li>Establezca alarmas recordatorias en el teléfono</li><li>Mantenga una lista actualizada de todos los medicamentos, incluyendo dosis y horarios</li><li>Revise regularmente con el médico si todos los medicamentos siguen siendo necesarios</li><li>Guarde los medicamentos en un lugar seguro, fresco y seco</li></ul><p>Nuestro servicio de gestión de medicación automatiza muchos de estos procesos, proporcionando recordatorios y confirmaciones que dan tranquilidad tanto al adulto mayor como a su familia.</p>',
        'blog2.title': 'Actividades Recreativas para Estimular la Mente',
        'blog2.desc': 'Descubre actividades que promueven el bienestar cognitivo y emocional en la tercera edad.',
        'blog2.content': '<h3>Actividades Recreativas para Estimular la Mente</h3><p>Mantener la mente activa es esencial para el bienestar cognitivo de los adultos mayores. Las actividades recreativas no solo proporcionan entretenimiento, sino que también pueden ayudar a mantener la función cognitiva y mejorar la calidad de vida.</p><p><strong>Actividades recomendadas:</strong></p><ul><li><strong>Juegos de mesa:</strong> Ajedrez, damas, dominó, cartas</li><li><strong>Pasatiempos creativos:</strong> Pintura, tejido, jardinería</li><li><strong>Ejercicio físico adaptado:</strong> Caminatas, yoga suave, tai chi</li><li><strong>Lectura y escritura:</strong> Libros, periódicos, llevar un diario</li><li><strong>Actividades sociales:</strong> Grupos de conversación, visitas familiares, clubes</li></ul><p>Nuestra bitácora diaria permite registrar las actividades realizadas, lo que ayuda a las familias a identificar qué actividades son más beneficiosas y disfrutables para su ser querido.</p>',
        'blog3.title': 'Adaptación del Hogar para Mayor Seguridad',
        'blog3.desc': 'Guía práctica para hacer de tu hogar un lugar más seguro y accesible para adultos mayores.',
        'blog3.content': '<h3>Adaptación del Hogar para Mayor Seguridad</h3><p>Muchos accidentes en adultos mayores ocurren en el hogar. Adaptar el espacio para hacerlo más seguro puede prevenir caídas y otros accidentes, proporcionando mayor independencia y tranquilidad.</p><p><strong>Áreas clave para adaptar:</strong></p><ul><li><strong>Baño:</strong> Barras de apoyo en ducha y cerca del inodoro, alfombras antideslizantes, silla para ducha</li><li><strong>Dormitorio:</strong> Luz de noche, teléfono cerca de la cama, superficie libre de obstáculos</li><li><strong>Escaleras:</strong> Pasamanos en ambos lados, iluminación adecuada, eliminar alfombras sueltas</li><li><strong>Cocina:</strong> Organizar artículos de uso frecuente a altura accesible, usar ollas con mangos antideslizantes</li><li><strong>Iluminación general:</strong> Asegurar que todas las áreas estén bien iluminadas, especialmente pasillos y entradas</li></ul><p>Nuestro botón de pánico proporciona una capa adicional de seguridad, permitiendo al adulto mayor solicitar ayuda inmediata en caso de emergencia, donde sea que se encuentre en el hogar.</p>',
        'blog.btn': 'Leer más',
        
        // Sección FAQ
        'faq.title': 'Preguntas Frecuentes',
        'faq.subtitle': 'Resolvemos tus dudas sobre nuestros servicios',
        'faq1.question': '¿Cómo funciona el servicio de gestión de medicación?',
        'faq1.answer': 'Nuestro sistema de gestión de medicación incluye alarmas programadas para cada dosis y confirmación visual mediante fotos o check-ins. Los familiares reciben notificaciones cuando se administra cada medicamento y alertas si se omite alguna dosis.',
        'faq2.question': '¿Pueden varios familiares acceder a la información?',
        'faq2.answer': 'Sí, nuestro sistema Multi-Familiar permite que hasta 5 familiares tengan acceso simultáneo a la bitácora diaria, historial de medicación y alertas. Cada familiar puede configurar sus preferencias de notificación según sus necesidades.',
        'faq3.question': '¿Qué sucede cuando se activa el botón de pánico?',
        'faq3.answer': 'Al activarse el botón de pánico, inmediatamente se envía una alerta a todos los familiares registrados vía SMS, llamada telefónica y notificación push en la app. También contactamos a servicios de emergencia si es necesario, según la configuración preestablecida.',
        'faq4.question': '¿Qué tipo de información incluye la bitácora diaria?',
        'faq4.answer': 'La bitácora diaria registra: comidas (qué, cuándo y cuánto), estado de ánimo, actividades realizadas, visitas al baño, horas de sueño, y cualquier observación relevante del cuidador. Toda la información está disponible en tiempo real para la familia.',
        'faq5.question': '¿Cómo puedo contratar los servicios de CuidoAMiTata?',
        'faq5.answer': 'Puedes contactarnos a través del formulario en nuestra sección de Contacto, por WhatsApp, o llamando al +56987629765. Programaremos una visita de evaluación sin costo para entender las necesidades específicas y ofrecerte un plan personalizado.',
        
        // Sección Contacto
        'contacto.title': 'Contáctanos',
        'contacto.subtitle': 'Estamos aquí para ayudarte',
        'contacto.connect': 'Conéctate con Nosotros',
        'contacto.text': 'No dudes en contactarnos para cualquier consulta sobre nuestros servicios. Estamos disponibles para asesorarte y encontrar la mejor solución para el cuidado de tu ser querido.',
        'contacto.email': 'Email',
        'contacto.whatsapp': 'WhatsApp',
        'contacto.form': 'Formulario de Contacto',
        'contacto.form.desc': 'Envíanos tus datos y te contactaremos',
        'contacto.social': 'Síguenos en Redes Sociales',
        'contacto.form.title': 'Formulario de Contacto',
        'contacto.form.name': 'Nombre Completo',
        'contacto.form.email': 'Correo Electrónico',
        'contacto.form.phone': 'Teléfono',
        'contacto.form.message': 'Mensaje',
        'contacto.form.btn': 'Enviar Mensaje',
        'contacto.form.success': '¡Gracias por tu mensaje! Te contactaremos pronto.',
        
        // Footer
        'footer.desc': 'Servicios profesionales de cuidado para adultos mayores en Chile. Combinamos tecnología innovadora con calidez humana para el bienestar de tus seres queridos.',
        'footer.links': 'Enlaces Rápidos',
        'footer.contact': 'Contacto',
        'footer.available': 'Disponibles 24/7 para emergencias',
        'footer.copyright': 'CuidoAMiTata.cl - Todos los derechos reservados.',
        'footer.designed': 'Diseñado con para el cuidado de adultos mayores en Chile.',
        
        // Otros
        'whatsapp.tooltip': 'Comunícate con nosotros',
        'backtotop': 'Volver arriba'
    },
    en: {
        // Navigation
        'nav.nosotros': 'About Us',
        'nav.servicios': 'Services',
        'nav.testimonios': 'Testimonials',
        'nav.faq': 'FAQ',
        'nav.contacto': 'Contact',
        
        // Hero section
        'hero.title1': 'Professional Care',
        'hero.title2': 'for Seniors',
        'hero.subtitle': 'We provide specialized care services for your loved ones with technology, commitment, and human warmth.',
        'hero.btn1': 'Request Services',
        'hero.btn2': 'Learn More',
        
        // About Us section
        'nosotros.title': 'About Us',
        'nosotros.subtitle': 'Committed to the well-being of seniors',
        'nosotros.who': 'Who We Are',
        'nosotros.text1': 'We are a team of professionals committed to improving the quality of life for seniors in Chile. Our mission is to provide care services that combine innovative technology with human warmth.',
        'nosotros.text2': 'We understand the challenges families face when caring for their elderly loved ones, which is why we have created comprehensive solutions that facilitate this process and ensure the well-being of our users.',
        'nosotros.feature1': 'Compassionate Care',
        'nosotros.feature1desc': 'Respectful and empathetic treatment for each person.',
        'nosotros.feature2': 'Guaranteed Safety',
        'nosotros.feature2desc': 'Safety protocols for emergencies and daily care.',
        'nosotros.feature3': 'Family Approach',
        'nosotros.feature3desc': 'We involve the entire family in the care process.',
        'nosotros.feature4': 'Innovative Technology',
        'nosotros.feature4desc': 'Digital solutions for more effective care.',
        
        // Services section
        'servicios.title': 'Our Services',
        'servicios.subtitle': 'Comprehensive solutions for senior care',
        'servicio1.title': 'Medication Management',
        'servicio1.desc': 'Alarms and visual confirmation so no dose is ever missed. Detailed tracking of schedules and dosages.',
        'servicio2.title': 'Daily Log',
        'servicio2.desc': 'Record of meals, mood, and activities by the caregiver. Updated information for the family.',
        'servicio3.title': 'Multi-Family',
        'servicio3.desc': 'All siblings and children connected under one account. Simplified family coordination.',
        'servicio4.title': 'Panic Button',
        'servicio4.desc': 'Instant alert to the entire family in case of emergency. Fast response when it is most needed.',
        
        // Testimonials section
        'testimonios.title': 'Testimonials',
        'testimonios.subtitle': 'What families who trust us say',
        'testimonio1.name': 'Maria Gonzalez',
        'testimonio1.role': "User's Daughter",
        'testimonio1.text': '"The CuidoAMiTata service has given me peace of mind. Knowing that my mother is well cared for and that I can see her daily log from my work is invaluable. I totally recommend their services!"',
        'testimonio2.name': 'Carlos Rodriguez',
        'testimonio2.role': "User's Son",
        'testimonio2.text': '"The panic button has been a lifesaver on two occasions. My father had falls and the alert immediately reached everyone in the family. The response was fast and professional. Thank you CuidoAMiTata."',
        'testimonio3.name': 'Ana Silva',
        'testimonio3.role': "User's Granddaughter",
        'testimonio3.text': '"Medication management has solved one of our biggest problems. My grandfather never missed a dose again. Plus, the whole family can stay informed from anywhere. Excellent service."',
        
        // Blog section
        'blog.title': 'Blog & Tips',
        'blog.subtitle': 'Useful articles for senior care',
        'blog1.title': 'Medication Organization for Seniors',
        'blog1.desc': 'Learn effective techniques to manage medications and avoid confusion in dosages.',
        'blog1.content': '<h3>Medication Organization for Seniors</h3><p>Proper medication management is crucial for the health of seniors. Frequently, elderly people take multiple medications at different times of the day, which can lead to confusion, missed or duplicated doses.</p><p><strong>Tips for better organization:</strong></p><ul><li>Use pill organizers with compartments for each day of the week and each schedule</li><li>Set reminder alarms on the phone</li><li>Maintain an updated list of all medications, including doses and schedules</li><li>Regularly review with the doctor if all medications are still necessary</li><li>Store medications in a safe, cool, and dry place</li></ul><p>Our medication management service automates many of these processes, providing reminders and confirmations that give peace of mind to both the senior and their family.</p>',
        'blog2.title': 'Recreational Activities to Stimulate the Mind',
        'blog2.desc': 'Discover activities that promote cognitive and emotional well-being in the elderly.',
        'blog2.content': '<h3>Recreational Activities to Stimulate the Mind</h3><p>Keeping the mind active is essential for the cognitive well-being of seniors. Recreational activities not only provide entertainment but can also help maintain cognitive function and improve quality of life.</p><p><strong>Recommended activities:</strong></p><ul><li><strong>Board games:</strong> Chess, checkers, dominoes, cards</li><li><strong>Creative hobbies:</strong> Painting, knitting, gardening</li><li><strong>Adapted physical exercise:</strong> Walking, gentle yoga, tai chi</li><li><strong>Reading and writing:</strong> Books, newspapers, keeping a journal</li><li><strong>Social activities:</strong> Conversation groups, family visits, clubs</li></ul><p>Our daily log allows recording activities performed, which helps families identify which activities are most beneficial and enjoyable for their loved one.</p>',
        'blog3.title': 'Home Adaptation for Greater Safety',
        'blog3.desc': 'Practical guide to make your home a safer and more accessible place for seniors.',
        'blog3.content': '<h3>Home Adaptation for Greater Safety</h3><p>Many accidents in seniors occur at home. Adapting the space to make it safer can prevent falls and other accidents, providing greater independence and peace of mind.</p><p><strong>Key areas to adapt:</strong></p><ul><li><strong>Bathroom:</strong> Support bars in shower and near toilet, non-slip mats, shower chair</li><li><strong>Bedroom:</strong> Night light, phone near bed, obstacle-free surface</li><li><strong>Stairs:</strong> Handrails on both sides, adequate lighting, remove loose rugs</li><li><strong>Kitchen:</strong> Organize frequently used items at accessible height, use pots with non-slip handles</li><li><strong>General lighting:</strong> Ensure all areas are well lit, especially hallways and entrances</li></ul><p>Our panic button provides an additional layer of safety, allowing the senior to request immediate help in case of emergency, wherever they are in the home.</p>',
        'blog.btn': 'Read more',
        
        // FAQ section
        'faq.title': 'Frequently Asked Questions',
        'faq.subtitle': 'We solve your doubts about our services',
        'faq1.question': 'How does the medication management service work?',
        'faq1.answer': 'Our medication management system includes programmed alarms for each dose and visual confirmation through photos or check-ins. Family members receive notifications when each medication is administered and alerts if any dose is missed.',
        'faq2.question': 'Can multiple family members access the information?',
        'faq2.answer': 'Yes, our Multi-Family system allows up to 5 family members to have simultaneous access to the daily log, medication history, and alerts. Each family member can configure their notification preferences according to their needs.',
        'faq3.question': 'What happens when the panic button is activated?',
        'faq3.answer': 'When the panic button is activated, an alert is immediately sent to all registered family members via SMS, phone call, and push notification in the app. We also contact emergency services if necessary, according to the preset configuration.',
        'faq4.question': 'What type of information does the daily log include?',
        'faq4.answer': 'The daily log records: meals (what, when, and how much), mood, activities performed, bathroom visits, sleep hours, and any relevant observation from the caregiver. All information is available in real time for the family.',
        'faq5.question': 'How can I hire CuidoAMiTata services?',
        'faq5.answer': 'You can contact us through the form in our Contact section, via WhatsApp, or by calling +56987629765. We will schedule a free evaluation visit to understand the specific needs and offer you a personalized plan.',
        
        // Contact section
        'contacto.title': 'Contact Us',
        'contacto.subtitle': 'We are here to help you',
        'contacto.connect': 'Connect With Us',
        'contacto.text': 'Do not hesitate to contact us for any inquiries about our services. We are available to advise you and find the best solution for the care of your loved one.',
        'contacto.email': 'Email',
        'contacto.whatsapp': 'WhatsApp',
        'contacto.form': 'Contact Form',
        'contacto.form.desc': 'Send us your information and we will contact you',
        'contacto.social': 'Follow Us on Social Media',
        'contacto.form.title': 'Contact Form',
        'contacto.form.name': 'Full Name',
        'contacto.form.email': 'Email Address',
        'contacto.form.phone': 'Phone',
        'contacto.form.message': 'Message',
        'contacto.form.btn': 'Send Message',
        'contacto.form.success': 'Thank you for your message! We will contact you soon.',
        
        // Footer
        'footer.desc': 'Professional care services for seniors in Chile. We combine innovative technology with human warmth for the well-being of your loved ones.',
        'footer.links': 'Quick Links',
        'footer.contact': 'Contact',
        'footer.available': 'Available 24/7 for emergencies',
        'footer.copyright': 'CuidoAMiTata.cl - All rights reserved.',
        'footer.designed': 'Designed with for senior care in Chile.',
        
        // Other
        'whatsapp.tooltip': 'Contact us',
        'backtotop': 'Back to top'
    }
};

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el año actual en el footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Cargar preferencias del usuario
    loadUserPreferences();
    
    // Inicializar componentes
    initProgressBar();
    initBackToTop();
    initMobileMenu();
    initLanguageToggle();
    initThemeToggle();
    initFAQ();
    initContactForm();
    initBlogModal();
    initSmoothScroll();
    
    // Aplicar traducciones iniciales
    updatePageContent();
});

// Cargar preferencias del usuario desde localStorage
function loadUserPreferences() {
    const savedLanguage = localStorage.getItem('cuidoamitata-language');
    const savedTheme = localStorage.getItem('cuidoamitata-theme');
    
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.documentElement.lang = currentLanguage;
    }
    
    if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
        updateThemeIcon();
    }
}

// Guardar preferencias del usuario en localStorage
function saveUserPreferences() {
    localStorage.setItem('cuidoamitata-language', currentLanguage);
    localStorage.setItem('cuidoamitata-theme', currentTheme);
}

// Inicializar la barra de progreso de scroll
function initProgressBar() {
    const progressBar = document.getElementById('progressBar');
    
    window.addEventListener('scroll', function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Inicializar el botón para volver arriba
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Inicializar el menú móvil
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            mobileMenuToggle.innerHTML = mobileMenu.classList.contains('hidden') 
                ? '<i class="fas fa-bars"></i>' 
                : '<i class="fas fa-times"></i>';
        });
        
        // Cerrar menú al hacer clic en un enlace
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Inicializar el selector de idioma
function initLanguageToggle() {
    const languageToggle = document.getElementById('languageToggle');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentLangElement = document.getElementById('currentLang');
    const mobileLanguageOptions = document.querySelectorAll('.language-option-mobile');
    
    // Selector de idioma para escritorio
    if (languageToggle && languageDropdown) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function() {
            languageDropdown.classList.remove('show');
        });
        
        // Manejar clic en opciones de idioma
        const languageOptions = languageDropdown.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                changeLanguage(lang);
                
                // Actualizar estado activo
                languageOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Actualizar texto actual
                currentLangElement.textContent = lang.toUpperCase();
                
                // Cerrar dropdown
                languageDropdown.classList.remove('show');
            });
        });
    }
    
    // Selector de idioma para móvil
    mobileLanguageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
            
            // Actualizar estado activo
            mobileLanguageOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.textContent = opt.getAttribute('data-lang').toUpperCase();
            });
            this.classList.add('active');
            this.textContent = lang === 'es' ? 'ES ✓' : 'EN ✓';
        });
    });
    
    // Actualizar estado inicial
    updateLanguageUI();
}

// Cambiar idioma
function changeLanguage(lang) {
    if (lang !== currentLanguage) {
        currentLanguage = lang;
        document.documentElement.lang = currentLanguage;
        saveUserPreferences();
        updatePageContent();
    }
}

// Actualizar UI del idioma
function updateLanguageUI() {
    // Actualizar selector de escritorio
    const currentLangElement = document.getElementById('currentLang');
    if (currentLangElement) {
        currentLangElement.textContent = currentLanguage.toUpperCase();
    }
    
    // Actualizar opciones activas
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === currentLanguage) {
            option.classList.add('active');
        }
    });
    
    // Actualizar opciones móviles
    const mobileLanguageOptions = document.querySelectorAll('.language-option-mobile');
    mobileLanguageOptions.forEach(option => {
        option.classList.remove('active');
        option.textContent = option.getAttribute('data-lang').toUpperCase();
        
        if (option.getAttribute('data-lang') === currentLanguage) {
            option.classList.add('active');
            option.textContent = currentLanguage === 'es' ? 'ES ✓' : 'EN ✓';
        }
    });
}

// Actualizar todo el contenido de la página según el idioma
function updatePageContent() {
    // Obtener todos los elementos con atributos de traducción
    const translatableElements = document.querySelectorAll('[data-translate]');
    
    translatableElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Actualizar contenido que no tiene atributo data-translate
    updateDynamicContent();
    
    // Actualizar UI del idioma
    updateLanguageUI();
}

// Actualizar contenido dinámico (para elementos sin data-translate)
function updateDynamicContent() {
    // Actualizar elementos según el idioma
    const elementsToTranslate = {
        // Títulos de secciones
        '.section-title:nth-of-type(1)': 'nosotros.title',
        '.section-title:nth-of-type(2)': 'servicios.title',
        '.section-title:nth-of-type(3)': 'testimonios.title',
        '.section-title:nth-of-type(4)': 'blog.title',
        '.section-title:nth-of-type(5)': 'faq.title',
        '.section-title:nth-of-type(6)': 'contacto.title',
        
        // Subtítulos de secciones
        '.section-subtitle:nth-of-type(1)': 'nosotros.subtitle',
        '.section-subtitle:nth-of-type(2)': 'servicios.subtitle',
        '.section-subtitle:nth-of-type(3)': 'testimonios.subtitle',
        '.section-subtitle:nth-of-type(4)': 'blog.subtitle',
        '.section-subtitle:nth-of-type(5)': 'faq.subtitle',
        '.section-subtitle:nth-of-type(6)': 'contacto.subtitle',
        
        // Hero section
        '#inicio h1 span:first-child': 'hero.title1',
        '#inicio h1 span:last-child': 'hero.title2',
        '#inicio .text-xl': 'hero.subtitle',
        '.btn-primary:first-child': 'hero.btn1',
        '.btn-secondary:first-child': 'hero.btn2',
        
        // Sección Nosotros
        '#nosotros h3': 'nosotros.who',
        '#nosotros p:nth-of-type(1)': 'nosotros.text1',
        '#nosotros p:nth-of-type(2)': 'nosotros.text2',
        
        // Sección Servicios
        '.service-card:nth-child(1) h3': 'servicio1.title',
        '.service-card:nth-child(1) p': 'servicio1.desc',
        '.service-card:nth-child(2) h3': 'servicio2.title',
        '.service-card:nth-child(2) p': 'servicio2.desc',
        '.service-card:nth-child(3) h3': 'servicio3.title',
        '.service-card:nth-child(3) p': 'servicio3.desc',
        '.service-card:nth-child(4) h3': 'servicio4.title',
        '.service-card:nth-child(4) p': 'servicio4.desc',
        
        // Testimonios
        '.testimonial-card:nth-child(1) h4': 'testimonio1.name',
        '.testimonial-card:nth-child(1) .text-sm': 'testimonio1.role',
        '.testimonial-card:nth-child(1) p': 'testimonio1.text',
        '.testimonial-card:nth-child(2) h4': 'testimonio2.name',
        '.testimonial-card:nth-child(2) .text-sm': 'testimonio2.role',
        '.testimonial-card:nth-child(2) p': 'testimonio2.text',
        '.testimonial-card:nth-child(3) h4': 'testimonio3.name',
        '.testimonial-card:nth-child(3) .text-sm': 'testimonio3.role',
        '.testimonial-card:nth-child(3) p': 'testimonio3.text',
        
        // Blog
        '.blog-card:nth-child(1) h3': 'blog1.title',
        '.blog-card:nth-child(1) p': 'blog1.desc',
        '.blog-card:nth-child(1) button': 'blog.btn',
        '.blog-card:nth-child(2) h3': 'blog2.title',
        '.blog-card:nth-child(2) p': 'blog2.desc',
        '.blog-card:nth-child(2) button': 'blog.btn',
        '.blog-card:nth-child(3) h3': 'blog3.title',
        '.blog-card:nth-child(3) p': 'blog3.desc',
        '.blog-card:nth-child(3) button': 'blog.btn',
        
        // FAQ
        '.faq-question:nth-child(1) span': 'faq1.question',
        '.faq-answer:nth-child(2) p': 'faq1.answer',
        '.faq-question:nth-child(3) span': 'faq2.question',
        '.faq-answer:nth-child(4) p': 'faq2.answer',
        '.faq-question:nth-child(5) span': 'faq3.question',
        '.faq-answer:nth-child(6) p': 'faq3.answer',
        '.faq-question:nth-child(7) span': 'faq4.question',
        '.faq-answer:nth-child(8) p': 'faq4.answer',
        '.faq-question:nth-child(9) span': 'faq5.question',
        '.faq-answer:nth-child(10) p': 'faq5.answer',
        
        // Contacto
        '#contacto h3': 'contacto.connect',
        '#contacto p:nth-of-type(1)': 'contacto.text',
        '.contact-link:nth-child(1) h4': 'contacto.email',
        '.contact-link:nth-child(2) h4': 'contacto.whatsapp',
        '.contact-link:nth-child(3) h4': 'contacto.form',
        '.contact-link:nth-child(3) p': 'contacto.form.desc',
        '#contacto h4': 'contacto.social',
        '#form-contacto h3': 'contacto.form.title',
        '#contactForm label:nth-child(1)': 'contacto.form.name',
        '#contactForm label:nth-child(2)': 'contacto.form.email',
        '#contactForm label:nth-child(3)': 'contacto.form.phone',
        '#contactForm label:nth-child(4)': 'contacto.form.message',
        '#contactForm button': 'contacto.form.btn',
        
        // Footer
        'footer p:first-of-type': 'footer.desc',
        'footer h4:nth-of-type(1)': 'footer.links',
        'footer h4:nth-of-type(2)': 'footer.contact',
        'footer li:nth-child(3) span': 'footer.available',
        'footer p:nth-child(2)': 'footer.copyright',
        'footer p:nth-child(3)': 'footer.designed'
    };
    
    // Aplicar traducciones
    for (const selector in elementsToTranslate) {
        const element = document.querySelector(selector);
        const key = elementsToTranslate[selector];
        
        if (element && translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'LABEL') {
                element.textContent = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    }
    
    // Actualizar navegación
    updateNavigation();
}

// Actualizar navegación según idioma
function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const navTexts = ['nav.nosotros', 'nav.servicios', 'nav.testimonios', 'nav.faq', 'nav.contacto'];
    
    navLinks.forEach((link, index) => {
        if (translations[currentLanguage][navTexts[index]]) {
            link.textContent = translations[currentLanguage][navTexts[index]];
        }
    });
}

// Inicializar el selector de tema
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    const themeIcon = document.getElementById('themeIcon');
    const themeIconMobile = document.getElementById('themeIconMobile');
    
    // Función para cambiar tema
    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
        saveUserPreferences();
        updateThemeIcon();
    }
    
    // Cambiar tema en escritorio
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Cambiar tema en móvil
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', toggleTheme);
    }
    
    updateThemeIcon();
}

// Actualizar icono del tema
function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    const themeIconMobile = document.getElementById('themeIconMobile');
    
    if (currentTheme === 'dark') {
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeIconMobile) themeIconMobile.className = 'fas fa-sun';
    } else {
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeIconMobile) themeIconMobile.className = 'fas fa-moon';
    }
}

// Inicializar las preguntas frecuentes (FAQ)
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            
            // Cerrar otras respuestas abiertas
            faqQuestions.forEach(q => {
                if (q !== this) {
                    q.classList.remove('active');
                    const otherAnswer = q.nextElementSibling;
                    otherAnswer.classList.remove('open');
                    const otherIcon = q.querySelector('.faq-icon');
                    otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Alternar la respuesta actual
            this.classList.toggle('active');
            answer.classList.toggle('open');
            
            // Rotar icono
            if (this.classList.contains('active')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });
}

// Inicializar el formulario de contacto
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener valores del formulario
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Validación simple
            if (!name || !email || !message) {
                showFormMessage('Por favor, completa todos los campos requeridos.', 'error');
                return;
            }
            
            // Simular envío del formulario (en un caso real, aquí iría una llamada AJAX)
            showFormMessage(translations[currentLanguage]['contacto.form.success'], 'success');
            
            // Limpiar formulario
            contactForm.reset();
            
            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                formMessage.classList.add('hidden');
            }, 5000);
        });
    }
}

// Mostrar mensaje en el formulario
function showFormMessage(text, type) {
    const formMessage = document.getElementById('formMessage');
    
    if (formMessage) {
        formMessage.textContent = text;
        formMessage.className = `mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        formMessage.classList.remove('hidden');
    }
}

// Inicializar el modal del blog
function initBlogModal() {
    const blogButtons = document.querySelectorAll('.blog-btn');
    const blogModal = document.getElementById('blogModal');
    const blogModalClose = document.querySelector('.blog-modal-close');
    const blogModalBody = document.getElementById('blogModalBody');
    
    // Abrir modal al hacer clic en un botón de blog
    blogButtons.forEach(button => {
        button.addEventListener('click', function() {
            const blogId = this.getAttribute('data-blog');
            openBlogModal(blogId);
        });
    });
    
    // Cerrar modal
    if (blogModalClose) {
        blogModalClose.addEventListener('click', function() {
            closeBlogModal();
        });
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    blogModal.addEventListener('click', function(e) {
        if (e.target === blogModal) {
            closeBlogModal();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && blogModal.classList.contains('active')) {
            closeBlogModal();
        }
    });
}

// Abrir modal del blog
function openBlogModal(blogId) {
    const blogModal = document.getElementById('blogModal');
    const blogModalBody = document.getElementById('blogModalBody');
    
    // Determinar qué contenido mostrar según el blogId
    let blogContent = '';
    
    if (blogId === '1') {
        blogContent = translations[currentLanguage]['blog1.content'];
    } else if (blogId === '2') {
        blogContent = translations[currentLanguage]['blog2.content'];
    } else if (blogId === '3') {
        blogContent = translations[currentLanguage]['blog3.content'];
    }
    
    // Insertar contenido en el modal
    blogModalBody.innerHTML = blogContent;
    
    // Mostrar modal
    blogModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal del blog
function closeBlogModal() {
    const blogModal = document.getElementById('blogModal');
    blogModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Inicializar scroll suave para enlaces internos
function initSmoothScroll() {
    // Seleccionar todos los enlaces internos
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Solo manejar enlaces internos que no sean # solo
            if (targetId !== '#') {
                e.preventDefault();
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Calcular posición del elemento objetivo
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    // Hacer scroll suave
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Manejar clic en el logo para volver arriba
    const logoLink = document.querySelector('a[href="#inicio"]');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            if (window.location.hash === '#inicio' || window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }
}