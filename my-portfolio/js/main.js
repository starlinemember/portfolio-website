/* ===== MAIN JAVASCRIPT - PORTFOLIO WEBSITE ===== */
/* Modern Vanilla JavaScript - 2025 Best Practices */

(function() {
    'use strict';
    
    // ===== GLOBAL VARIABLES =====
    let isLoaded = false;
    let currentSection = 'home';
    let scrollTimeout = null;
    
    // ===== DOM ELEMENTS =====
    const elements = {
        loader: document.getElementById('loader'),
        navbar: document.querySelector('.navbar'),
        navLinks: document.querySelectorAll('.nav-link'),
        hamburger: document.querySelector('.hamburger'),
        navMenu: document.querySelector('.nav-menu'),
        sections: document.querySelectorAll('section'),
        skillsContainer: document.getElementById('skills-container'),
        languagesContainer: document.getElementById('languages-container'),
        projectsContainer: document.getElementById('projects-container'),
        certificatesContainer: document.getElementById('certificates-container'),
        scrollIndicator: document.querySelector('.scroll-indicator')
    };
    
    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });
    
    window.addEventListener('load', function() {
        hideLoader();
        startAnimations();
    });
    
    // ===== MAIN INITIALIZATION FUNCTION =====
    function initializeApp() {
        setupEventListeners();
        loadDynamicContent();
        initializeIntersectionObserver();
        initializeScrollEffects();
        setupNavigation();
        
        console.log('🚀 Portfolio website initialized successfully!');
    }
    
    // ===== LOADER FUNCTIONALITY =====
    function hideLoader() {
        if (elements.loader) {
            elements.loader.style.opacity = '0';
            setTimeout(() => {
                elements.loader.style.display = 'none';
                isLoaded = true;
            }, 500);
        }
    }
    
    // ===== EVENT LISTENERS SETUP =====
    function setupEventListeners() {
        // Smooth scrolling for navigation links
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleSmoothScroll);
        });
        
        // Hamburger menu toggle
        if (elements.hamburger) {
            elements.hamburger.addEventListener('click', toggleMobileMenu);
        }
        
        // Close mobile menu when clicking on a link
        elements.navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Scroll indicator click
        if (elements.scrollIndicator) {
            elements.scrollIndicator.addEventListener('click', function() {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
        
        // Window resize handler
        window.addEventListener('resize', debounce(handleWindowResize, 250));
        
        // Scroll handler for navbar background
        window.addEventListener('scroll', debounce(handleNavbarScroll, 10));
        
        // Prevent right-click on images (optional protection)
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('contextmenu', e => e.preventDefault());
        });
        
        // Keyboard navigation support
        document.addEventListener('keydown', handleKeyboardNavigation);
        
        // Focus management for accessibility
        document.addEventListener('focusin', handleFocusManagement);
    }
    
    // ===== SMOOTH SCROLLING =====
    function handleSmoothScroll(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - 70;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Update active nav link
            updateActiveNavLink(targetId.substring(1));
        }
    }
    
    // ===== MOBILE MENU FUNCTIONALITY =====
    function toggleMobileMenu() {
        elements.hamburger.classList.toggle('active');
        elements.navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Accessibility: Update aria attributes
        const isExpanded = elements.navMenu.classList.contains('active');
        elements.hamburger.setAttribute('aria-expanded', isExpanded);
    }
    
    function closeMobileMenu() {
        elements.hamburger.classList.remove('active');
        elements.navMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        elements.hamburger.setAttribute('aria-expanded', 'false');
    }
    
    // ===== NAVIGATION ACTIVE STATE =====
    function updateActiveNavLink(sectionId) {
        elements.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
        currentSection = sectionId;
    }
    
    // ===== INTERSECTION OBSERVER FOR SECTIONS =====
    function initializeIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.3
        };
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    updateActiveNavLink(sectionId);
                    
                    // Trigger section animations
                    animateSection(entry.target);
                }
            });
        }, observerOptions);
        
        elements.sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }
    
    // ===== SECTION ANIMATIONS =====
    function animateSection(section) {
        const animateElements = section.querySelectorAll('.animate-on-scroll');
        
        animateElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animated');
            }, index * 100);
        });
    }
    
    function startAnimations() {
        // Add animation classes to elements that should animate on load
        const heroElements = document.querySelectorAll('.hero-text, .hero-image');
        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 200);
        });
    }
    
    // ===== NAVBAR SCROLL EFFECTS =====
    function handleNavbarScroll() {
        if (!elements.navbar) return;
        
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            if (scrollY > 200) {
                elements.navbar.classList.add('nav-hidden');
            } else {
                elements.navbar.classList.remove('nav-hidden');
            }
        }, 150);
    }
    
    // ===== DYNAMIC CONTENT LOADING =====
    async function loadDynamicContent() {
        try {
            // Load skills data
            await loadSkills();
            
            // Load languages data
            await loadLanguages();
            
            // Load projects (from Supabase)
            await loadProjects();
            
            // Load certificates (from Supabase)
            await loadCertificates();
            
        } catch (error) {
            console.error('Error loading dynamic content:', error);
            showErrorMessage('Failed to load some content. Please refresh the page.');
        }
    }
    
    // ===== SKILLS LOADING =====
    function loadSkills() {
        const skills = [
            {
                name: 'Frontend Development',
                icon: 'fas fa-laptop-code',
                description: 'HTML5, CSS3, JavaScript, React'
            },
            {
                name: 'Backend Development',
                icon: 'fas fa-server',
                description: 'Node.js, Python, Express, APIs'
            },
            {
                name: 'Database Management',
                icon: 'fas fa-database',
                description: 'MySQL, PostgreSQL, MongoDB'
            },
            {
                name: 'Cloud Services',
                icon: 'fas fa-cloud',
                description: 'AWS, Google Cloud, Vercel'
            },
            {
                name: 'Version Control',
                icon: 'fab fa-git-alt',
                description: 'Git, GitHub, Collaboration'
            },
            {
                name: 'UI/UX Design',
                icon: 'fas fa-paint-brush',
                description: 'Figma, Adobe XD, Responsive Design'
            }
        ];
        
        if (elements.skillsContainer) {
            elements.skillsContainer.innerHTML = skills.map(skill => `
                <div class="skill-card animate-on-scroll">
                    <div class="skill-icon">
                        <i class="${skill.icon}"></i>
                    </div>
                    <h3>${skill.name}</h3>
                    <p>${skill.description}</p>
                </div>
            `).join('');
        }
    }
    
    // ===== LANGUAGES LOADING =====
    function loadLanguages() {
        const languages = [
            { name: 'English', level: 'Fluent' },
            { name: 'Hindi', level: 'Native' },
            { name: 'Telugu', level: 'Native' },
            { name: 'Spanish', level: 'Intermediate' }
        ];
        
        if (elements.languagesContainer) {
            elements.languagesContainer.innerHTML = languages.map(language => `
                <div class="language-card animate-on-scroll">
                    <h4>${language.name}</h4>
                    <p class="language-level">${language.level}</p>
                </div>
            `).join('');
        }
    }
    
    // ===== PROJECTS LOADING (Dynamic from Supabase) =====
    async function loadProjects() {
        try {
            // This will be connected to Supabase later
            const projects = await getProjectsFromDatabase();
            
            if (elements.projectsContainer) {
                elements.projectsContainer.innerHTML = projects.map(project => `
                    <div class="project-card animate-on-scroll">
                        <div class="project-image">
                            <i class="fas fa-code"></i>
                        </div>
                        <div class="project-content">
                            <h3>${project.name}</h3>
                            <p>${project.description}</p>
                            <a href="${project.url}" target="_blank" class="btn btn-primary project-btn">
                                View Project
                            </a>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            loadDummyProjects();
        }
    }
    
    // ===== CERTIFICATES LOADING (Dynamic from Supabase) =====
    async function loadCertificates() {
        try {
            const certificates = await getCertificatesFromDatabase();
            
            if (elements.certificatesContainer) {
                elements.certificatesContainer.innerHTML = certificates.map(cert => `
                    <div class="certificate-card animate-on-scroll">
                        <div class="certificate-image">
                            <img src="${cert.image_url}" alt="${cert.name}" loading="lazy">
                        </div>
                        <div class="certificate-content">
                            <h3>${cert.name}</h3>
                            <p>${cert.description}</p>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading certificates:', error);
            loadDummyCertificates();
        }
    }
    
    // ===== DUMMY DATA FUNCTIONS =====
    function loadDummyProjects() {
        const dummyProjects = [
            {
                name: 'E-commerce Platform',
                description: 'Full-stack e-commerce solution with React and Node.js',
                url: '#'
            },
            {
                name: 'Task Management App',
                description: 'Productivity app with real-time collaboration features',
                url: '#'
            },
            {
                name: 'Portfolio Website',
                description: 'Responsive portfolio with modern design and animations',
                url: '#'
            }
        ];
        
        if (elements.projectsContainer) {
            elements.projectsContainer.innerHTML = dummyProjects.map(project => `
                <div class="project-card animate-on-scroll">
                    <div class="project-image">
                        <i class="fas fa-code"></i>
                    </div>
                    <div class="project-content">
                        <h3>${project.name}</h3>
                        <p>${project.description}</p>
                        <a href="${project.url}" target="_blank" class="btn btn-primary project-btn">
                            View Project
                        </a>
                    </div>
                </div>
            `).join('');
        }
    }
    
    function loadDummyCertificates() {
        const dummyCertificates = [
            {
                name: 'Web Development Certificate',
                description: 'Completed comprehensive web development course'
            },
            {
                name: 'JavaScript Certification',
                description: 'Advanced JavaScript programming certification'
            },
            {
                name: 'Cloud Architecture',
                description: 'AWS Cloud Solutions Architect certification'
            }
        ];
        
        if (elements.certificatesContainer) {
            elements.certificatesContainer.innerHTML = dummyCertificates.map(cert => `
                <div class="certificate-card animate-on-scroll">
                    <div class="certificate-image">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div class="certificate-content">
                        <h3>${cert.name}</h3>
                        <p>${cert.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // ===== DATABASE FUNCTIONS (Placeholder) =====
    async function getProjectsFromDatabase() {
        // This will be implemented with Supabase
        if (typeof window.supabase !== 'undefined') {
            const { data, error } = await window.supabase
                .from('projects')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        }
        
        // Fallback to dummy data
        throw new Error('Database not connected');
    }
    
    async function getCertificatesFromDatabase() {
        // This will be implemented with Supabase
        if (typeof window.supabase !== 'undefined') {
            const { data, error } = await window.supabase
                .from('certificates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        }
        
        // Fallback to dummy data
        throw new Error('Database not connected');
    }
    
    // ===== UTILITY FUNCTIONS =====
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    // ===== ACCESSIBILITY FUNCTIONS =====
    function handleKeyboardNavigation(e) {
        // ESC key to close mobile menu
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
        
        // Enter key for theme toggle
        if (e.key === 'Enter' && e.target.matches('.theme-toggle')) {
            e.target.click();
        }
    }
    
    function handleFocusManagement(e) {
        // Ensure focus is visible for keyboard users
        if (e.target.matches('button, a, input, textarea, select')) {
            e.target.classList.add('keyboard-focus');
        }
    }
    
    // ===== WINDOW RESIZE HANDLER =====
    function handleWindowResize() {
        // Close mobile menu on desktop resize
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
        
        // Recalculate any responsive elements
        updateResponsiveElements();
    }
    
    function updateResponsiveElements() {
        // Update any responsive calculations here
        // This is where you'd handle complex responsive logic
    }
    
    // ===== NAVIGATION SETUP =====
    function setupNavigation() {
        // Add smooth scrolling to all internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            if (!anchor.classList.contains('nav-link')) {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            }
        });
    }
    
    // ===== SCROLL EFFECTS =====
    function initializeScrollEffects() {
        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = document.querySelector('.hero');
            
            if (parallax) {
                const speed = scrolled * 0.5;
                parallax.style.transform = `translateY(${speed}px)`;
            }
        });
    }
    
    // ===== PERFORMANCE OPTIMIZATIONS =====
    
    // Lazy loading for images
    function initializeLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    // ===== EXPORT FUNCTIONS FOR EXTERNAL USE =====
    window.portfolioApp = {
        updateActiveNavLink,
        loadProjects,
        loadCertificates,
        showErrorMessage,
        toggleMobileMenu
    };
    
})();

// ===== ADDITIONAL CSS FOR ANIMATIONS =====
const additionalStyles = `
    <style>
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-on-scroll.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .navbar.scrolled {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }
        
        .navbar.nav-hidden {
            transform: translateY(-100%);
        }
        
        .error-message {
            animation: slideInRight 0.3s ease;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        
        .animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .keyboard-focus {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);
