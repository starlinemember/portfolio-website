/* ===== ADMIN PANEL JAVASCRIPT - 2025 SECURITY & UX ===== */
/* Comprehensive Admin Dashboard with Modern Features */

(function() {
    'use strict';
    
    // ===== CONFIGURATION =====
    const ADMIN_CONFIG = {
        // UI Settings
        ui: {
            animationDuration: 300,
            toastDuration: 5000,
            autoRefreshInterval: 30000, // 30 seconds
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
            itemsPerPage: 12
        },
        
        // Security Settings
        security: {
            sessionCheckInterval: 5 * 60 * 1000, // 5 minutes
            maxLoginAttempts: 3,
            lockoutDuration: 24 * 60 * 60 * 1000, // 24 hours
            require2FA: true,
            autoLogoutTime: 2 * 60 * 60 * 1000 // 2 hours
        },
        
        // Data Validation
        validation: {
            project: {
                nameMin: 3,
                nameMax: 100,
                descMin: 10,
                descMax: 500
            },
            certificate: {
                nameMin: 3,
                nameMax: 100,
                descMin: 10,
                descMax: 300
            }
        }
    };
    
    // ===== GLOBAL STATE =====
    let adminState = {
        isAuthenticated: false,
        currentUser: null,
        currentSection: 'dashboard',
        isLoading: false,
        data: {
            projects: [],
            certificates: [],
            messages: [],
            stats: {},
            security: {}
        },
        ui: {
            sidebarCollapsed: false,
            activeModals: new Set(),
            notifications: [],
            filters: {}
        },
        upload: {
            activeUploads: new Map(),
            completedUploads: new Set()
        }
    };
    
    // ===== DOM ELEMENTS =====
    let elements = {};
    
    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initializeAdminPanel();
    });
    
    async function initializeAdminPanel() {
        try {
            // Get DOM elements
            cacheElements();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize UI components
            initializeUI();
            
            // Check authentication status
            await checkAuthenticationStatus();
            
            // Setup security monitoring
            setupSecurityMonitoring();
            
            // Setup auto-refresh
            setupAutoRefresh();
            
            console.log('🔧 Admin panel initialized successfully');
            
        } catch (error) {
            console.error('❌ Admin panel initialization failed:', error);
            showToast('Initialization failed', 'Please refresh the page', 'error');
        }
    }
    
    function cacheElements() {
        elements = {
            // Loading and modals
            loadingScreen: document.getElementById('loading-screen'),
            loginModal: document.getElementById('login-modal'),
            twofaModal: document.getElementById('twofa-modal'),
            adminApp: document.getElementById('admin-app'),
            
            // Navigation
            sidebar: document.querySelector('.sidebar'),
            sidebarToggle: document.getElementById('sidebar-toggle'),
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            menuItems: document.querySelectorAll('.menu-item'),
            
            // Topbar
            currentSection: document.getElementById('current-section'),
            themeToggle: document.getElementById('admin-theme-toggle'),
            notificationBtn: document.getElementById('notification-btn'),
            notificationDropdown: document.getElementById('notification-dropdown'),
            profileBtn: document.getElementById('profile-btn'),
            profileDropdown: document.getElementById('profile-dropdown'),
            logoutBtn: document.getElementById('logout-btn'),
            
            // Forms
            loginForm: document.getElementById('login-form'),
            twofaForm: document.getElementById('twofa-form'),
            codeInputs: document.querySelectorAll('.code-input'),
            
            // Content sections
            dashboardSection: document.getElementById('dashboard-section'),
            projectsSection: document.getElementById('projects-section'),
            certificatesSection: document.getElementById('certificates-section'),
            messagesSection: document.getElementById('messages-section'),
            securitySection: document.getElementById('security-section'),
            settingsSection: document.getElementById('settings-section'),
            
            // Dashboard stats
            statProjects: document.getElementById('stat-projects'),
            statCertificates: document.getElementById('stat-certificates'),
            statMessages: document.getElementById('stat-messages'),
            statSecurity: document.getElementById('stat-security'),
            
            // Grids and containers
            projectsGrid: document.getElementById('projects-grid'),
            certificatesGrid: document.getElementById('certificates-grid'),
            messagesList: document.getElementById('messages-list'),
            recentActivity: document.getElementById('recent-activity'),
            
            // Modals
            projectModal: document.getElementById('project-modal'),
            certificateModal: document.getElementById('certificate-modal'),
            projectForm: document.getElementById('project-form'),
            certificateForm: document.getElementById('certificate-form'),
            
            // Toast container
            toastContainer: document.getElementById('toast-container')
        };
    }
    
    function setupEventListeners() {
        // Authentication
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLogin);
        }
        
        if (elements.twofaForm) {
            elements.twofaForm.addEventListener('submit', handle2FAVerification);
        }
        
        // 2FA code inputs
        elements.codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => handle2FAInput(e, index));
            input.addEventListener('keydown', (e) => handle2FAKeydown(e, index));
        });
        
        // Navigation
        elements.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) switchSection(section);
            });
        });
        
        if (elements.sidebarToggle) {
            elements.sidebarToggle.addEventListener('click', toggleSidebar);
        }
        
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        }
        
        // Topbar interactions
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }
        
        if (elements.notificationBtn) {
            elements.notificationBtn.addEventListener('click', toggleNotifications);
        }
        
        if (elements.profileBtn) {
            elements.profileBtn.addEventListener('click', toggleProfileDropdown);
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Modal handling
        document.addEventListener('click', handleModalClicks);
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Form submissions
        if (elements.projectForm) {
            elements.projectForm.addEventListener('submit', handleProjectSubmit);
        }
        
        if (elements.certificateForm) {
            elements.certificateForm.addEventListener('submit', handleCertificateSubmit);
        }
        
        // File uploads
        setupFileUploadHandlers();
        
        // Search and filters
        setupSearchAndFilters();
        
        // Window events
        window.addEventListener('resize', debounce(handleWindowResize, 250));
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Visibility change for security
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    function initializeUI() {
        // Hide loading screen
        setTimeout(() => {
            if (elements.loadingScreen) {
                elements.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 1000);
        
        // Initialize tooltips
        initializeTooltips();
        
        // Initialize dropdowns
        initializeDropdowns();
        
        // Initialize animations
        initializeAnimations();
        
        // Setup drag and drop
        setupDragAndDrop();
    }
    
    // ===== AUTHENTICATION =====
    async function checkAuthenticationStatus() {
        try {
            const isLoggedIn = window.supabase?.isAdminLoggedIn?.() || false;
            
            if (isLoggedIn) {
                await handleSuccessfulAuth();
            } else {
                showLoginModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            showLoginModal();
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        const loginBtn = document.getElementById('login-btn');
        setLoadingState(loginBtn, true);
        
        try {
            const result = await window.supabase.adminLogin(credentials);
            
            if (result.requires2FA) {
                hideModal('login-modal');
                show2FAModal(result.user.email);
            } else {
                await handleSuccessfulAuth(result);
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            showToast('Login Failed', error.message, 'error');
            
            // Track failed attempts
            trackFailedLoginAttempt();
            
        } finally {
            setLoadingState(loginBtn, false);
        }
    }
    
    async function handle2FAVerification(e) {
        e.preventDefault();
        
        const code = Array.from(elements.codeInputs)
            .map(input => input.value)
            .join('');
        
        if (code.length !== 6) {
            showToast('Invalid Code', 'Please enter the complete 6-digit code', 'error');
            return;
        }
        
        const verifyBtn = document.getElementById('verify-btn');
        setLoadingState(verifyBtn, true);
        
        try {
            await window.supabase.verify2FACode(code);
            await handleSuccessfulAuth();
            
        } catch (error) {
            console.error('2FA verification failed:', error);
            showToast('Verification Failed', error.message, 'error');
            
            // Clear code inputs
            elements.codeInputs.forEach(input => input.value = '');
            elements.codeInputs[0].focus();
            
        } finally {
            setLoadingState(verifyBtn, false);
        }
    }
    
    function handle2FAInput(e, index) {
        const input = e.target;
        const value = input.value;
        
        // Only allow numbers
        if (!/^\d$/.test(value)) {
            input.value = '';
            return;
        }
        
        // Move to next input
        if (value && index < elements.codeInputs.length - 1) {
            elements.codeInputs[index + 1].focus();
        }
        
        // Auto-submit when all fields are filled
        const code = Array.from(elements.codeInputs)
            .map(inp => inp.value)
            .join('');
        
        if (code.length === 6) {
            setTimeout(() => {
                elements.twofaForm.dispatchEvent(new Event('submit'));
            }, 100);
        }
    }
    
    function handle2FAKeydown(e, index) {
        // Handle backspace
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            elements.codeInputs[index - 1].focus();
        }
        
        // Handle paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6);
                
                elements.codeInputs.forEach((input, i) => {
                    input.value = digits[i] || '';
                });
                
                if (digits.length === 6) {
                    setTimeout(() => {
                        elements.twofaForm.dispatchEvent(new Event('submit'));
                    }, 100);
                }
            });
        }
    }
    
    async function handleSuccessfulAuth(authResult) {
        adminState.isAuthenticated = true;
        adminState.currentUser = authResult?.user || { email: 'admin@example.com' };
        
        hideModal('login-modal');
        hideModal('twofa-modal');
        
        // Show admin app
        if (elements.adminApp) {
            elements.adminApp.style.display = 'flex';
        }
        
        // Load initial data
        await loadDashboardData();
        
        // Setup session monitoring
        startSessionMonitoring();
        
        showToast('Welcome Back', 'Successfully logged in to admin panel', 'success');
    }
    
    async function handleLogout() {
        try {
            await window.supabase?.adminLogout?.();
            
            adminState.isAuthenticated = false;
            adminState.currentUser = null;
            
            // Hide admin app
            if (elements.adminApp) {
                elements.adminApp.style.display = 'none';
            }
            
            // Show login modal
            showLoginModal();
            
            showToast('Logged Out', 'Successfully logged out from admin panel', 'info');
            
        } catch (error) {
            console.error('Logout failed:', error);
            showToast('Logout Error', 'Failed to logout properly', 'error');
        }
    }
    
    // ===== NAVIGATION =====
    function switchSection(sectionName) {
        // Update menu active state
        elements.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });
        
        // Update breadcrumb
        if (elements.currentSection) {
            elements.currentSection.textContent = capitalizeFirst(sectionName);
        }
        
        adminState.currentSection = sectionName;
        
        // Load section data
        loadSectionData(sectionName);
        
        // Close mobile sidebar
        if (window.innerWidth <= 768) {
            elements.sidebar.classList.remove('show');
        }
    }
    
    function toggleSidebar() {
        adminState.ui.sidebarCollapsed = !adminState.ui.sidebarCollapsed;
        elements.sidebar.classList.toggle('collapsed', adminState.ui.sidebarCollapsed);
        
        // Save preference
        localStorage.setItem('admin-sidebar-collapsed', adminState.ui.sidebarCollapsed);
    }
    
    function toggleMobileSidebar() {
        elements.sidebar.classList.toggle('show');
    }
    
    // ===== DATA LOADING =====
    async function loadDashboardData() {
        try {
            adminState.isLoading = true;
            
            // Load all data in parallel
            const [projects, certificates, messages, stats, security] = await Promise.all([
                loadProjects(),
                loadCertificates(),
                loadMessages(),
                loadStats(),
                loadSecurityData()
            ]);
            
            adminState.data = {
                projects,
                certificates,
                messages,
                stats,
                security
            };
            
            // Update UI
            updateDashboardStats();
            updateMenuBadges();
            updateRecentActivity();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Loading Error', 'Failed to load dashboard data', 'error');
        } finally {
            adminState.isLoading = false;
        }
    }
    
    async function loadProjects() {
        try {
            const projects = await window.supabase?.getProjects?.() || [];
            return projects;
        } catch (error) {
            console.error('Failed to load projects:', error);
            return [];
        }
    }
    
    async function loadCertificates() {
        try {
            const certificates = await window.supabase?.getCertificates?.() || [];
            return certificates;
        } catch (error) {
            console.error('Failed to load certificates:', error);
            return [];
        }
    }
    
    async function loadMessages() {
        try {
            // This would load from contacts table
            return [];
        } catch (error) {
            console.error('Failed to load messages:', error);
            return [];
        }
    }
    
    async function loadStats() {
        const stats = {
            totalProjects: adminState.data.projects?.length || 0,
            totalCertificates: adminState.data.certificates?.length || 0,
            unreadMessages: adminState.data.messages?.filter(m => !m.is_read).length || 0,
            securityEvents: 0
        };
        
        return stats;
    }
    
    async function loadSecurityData() {
        try {
            return {
                blockedIPs: [],
                loginAttempts: [],
                activeSessions: []
            };
        } catch (error) {
            console.error('Failed to load security data:', error);
            return {};
        }
    }
    
    async function loadSectionData(sectionName) {
        switch (sectionName) {
            case 'projects':
                await renderProjects();
                break;
            case 'certificates':
                await renderCertificates();
                break;
            case 'messages':
                await renderMessages();
                break;
            case 'security':
                await renderSecurityData();
                break;
            case 'dashboard':
                await updateDashboardStats();
                break;
        }
    }
    
    // ===== UI UPDATES =====
    function updateDashboardStats() {
        if (elements.statProjects) {
            animateCounter(elements.statProjects, adminState.data.stats?.totalProjects || 0);
        }
        
        if (elements.statCertificates) {
            animateCounter(elements.statCertificates, adminState.data.stats?.totalCertificates || 0);
        }
        
        if (elements.statMessages) {
            animateCounter(elements.statMessages, adminState.data.stats?.unreadMessages || 0);
        }
        
        if (elements.statSecurity) {
            animateCounter(elements.statSecurity, adminState.data.stats?.securityEvents || 0);
        }
    }
    
    function updateMenuBadges() {
        const projectsCount = document.getElementById('projects-count');
        const certificatesCount = document.getElementById('certificates-count');
        const messagesCount = document.getElementById('messages-count');
        
        if (projectsCount) {
            projectsCount.textContent = adminState.data.projects?.length || 0;
        }
        
        if (certificatesCount) {
            certificatesCount.textContent = adminState.data.certificates?.length || 0;
        }
        
        if (messagesCount) {
            const unreadCount = adminState.data.messages?.filter(m => !m.is_read).length || 0;
            messagesCount.textContent = unreadCount;
            messagesCount.classList.toggle('unread', unreadCount > 0);
        }
    }
    
    async function renderProjects() {
        if (!elements.projectsGrid) return;
        
        const projects = adminState.data.projects || [];
        
        if (projects.length === 0) {
            elements.projectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>No Projects Yet</h3>
                    <p>Start by adding your first project</p>
                    <button class="btn btn-primary" onclick="openProjectModal()">
                        <i class="fas fa-plus"></i> Add Project
                    </button>
                </div>
            `;
            return;
        }
        
        elements.projectsGrid.innerHTML = projects.map(project => `
            <div class="project-item" data-id="${project.id}">
                <div class="item-header">
                    <div class="item-title">${escapeHtml(project.name)}</div>
                    <div class="item-description">${escapeHtml(project.description)}</div>
                    ${project.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
                <div class="item-footer">
                    <div class="item-meta">
                        <span class="category">${project.category || 'web'}</span>
                        ${project.technologies ? `<span class="tech-count">${project.technologies.length} tech</span>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="action-btn" onclick="editProject('${project.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="viewProject('${project.url}')" title="View">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="action-btn danger" onclick="deleteProject('${project.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async function renderCertificates() {
        if (!elements.certificatesGrid) return;
        
        const certificates = adminState.data.certificates || [];
        
        if (certificates.length === 0) {
            elements.certificatesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-certificate"></i>
                    <h3>No Certificates Yet</h3>
                    <p>Start by adding your first certificate</p>
                    <button class="btn btn-primary" onclick="openCertificateModal()">
                        <i class="fas fa-plus"></i> Add Certificate
                    </button>
                </div>
            `;
            return;
        }
        
        elements.certificatesGrid.innerHTML = certificates.map(cert => `
            <div class="certificate-item" data-id="${cert.id}">
                <div class="cert-image">
                    <img src="${cert.image_url}" alt="${escapeHtml(cert.name)}" loading="lazy">
                </div>
                <div class="item-header">
                    <div class="item-title">${escapeHtml(cert.name)}</div>
                    <div class="item-description">${escapeHtml(cert.description)}</div>
                    <div class="cert-issuer">Issued by: ${escapeHtml(cert.issuer)}</div>
                </div>
                <div class="item-footer">
                    <div class="item-meta">
                        ${cert.issue_date ? `<span class="issue-date">${formatDate(cert.issue_date)}</span>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="action-btn" onclick="editCertificate('${cert.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${cert.credential_url ? `<button class="action-btn" onclick="viewCertificate('${cert.credential_url}')" title="View Credential">
                            <i class="fas fa-external-link-alt"></i>
                        </button>` : ''}
                        <button class="action-btn danger" onclick="deleteCertificate('${cert.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // ===== PROJECT MANAGEMENT =====
    window.openProjectModal = function(projectId = null) {
        const modal = elements.projectModal;
        const form = elements.projectForm;
        const title = document.getElementById('project-modal-title');
        
        if (projectId) {
            const project = adminState.data.projects.find(p => p.id === projectId);
            if (project) {
                title.textContent = 'Edit Project';
                populateProjectForm(project);
            }
        } else {
            title.textContent = 'Add Project';
            form.reset();
            clearImagePreview('project-image-preview');
        }
        
        showModal('project-modal');
    };
    
    window.editProject = function(projectId) {
        openProjectModal(projectId);
    };
    
    window.viewProject = function(url) {
        window.open(url, '_blank');
    };
    
    window.deleteProject = async function(projectId) {
        if (!confirm('Are you sure you want to delete this project?')) {
            return;
        }
        
        try {
            await window.supabase?.deleteProject?.(projectId);
            
            // Remove from local state
            adminState.data.projects = adminState.data.projects.filter(p => p.id !== projectId);
            
            // Re-render
            await renderProjects();
            updateDashboardStats();
            
            showToast('Success', 'Project deleted successfully', 'success');
            
        } catch (error) {
            console.error('Delete project failed:', error);
            showToast('Error', 'Failed to delete project', 'error');
        }
    };
    
    async function handleProjectSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = document.getElementById('project-submit');
        
        setLoadingState(submitBtn, true);
        
        try {
            const projectData = {
                name: formData.get('name'),
                description: formData.get('description'),
                url: formData.get('url'),
                category: formData.get('category'),
                technologies: formData.get('technologies')?.split(',').map(t => t.trim()).filter(t => t) || [],
                is_featured: formData.get('featured') === 'on',
                is_active: formData.get('active') === 'on'
            };
            
            // Validate data
            validateProjectData(projectData);
            
            const projectId = formData.get('id');
            let result;
            
            if (projectId) {
                result = await window.supabase?.updateProject?.(projectId, projectData);
                
                // Update local state
                const index = adminState.data.projects.findIndex(p => p.id === projectId);
                if (index !== -1) {
                    adminState.data.projects[index] = { ...adminState.data.projects[index], ...result };
                }
                
                showToast('Success', 'Project updated successfully', 'success');
            } else {
                result = await window.supabase?.createProject?.(projectData);
                
                // Add to local state
                adminState.data.projects.push(result);
                
                showToast('Success', 'Project created successfully', 'success');
            }
            
            hideModal('project-modal');
            await renderProjects();
            updateDashboardStats();
            
        } catch (error) {
            console.error('Project submit failed:', error);
            showToast('Error', error.message || 'Failed to save project', 'error');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }
    
    // ===== CERTIFICATE MANAGEMENT =====
    window.openCertificateModal = function(certId = null) {
        const modal = elements.certificateModal;
        const form = elements.certificateForm;
        const title = document.getElementById('certificate-modal-title');
        
        if (certId) {
            const cert = adminState.data.certificates.find(c => c.id === certId);
            if (cert) {
                title.textContent = 'Edit Certificate';
                populateCertificateForm(cert);
            }
        } else {
            title.textContent = 'Add Certificate';
            form.reset();
            clearImagePreview('certificate-image-preview');
        }
        
        showModal('certificate-modal');
    };
    
    window.editCertificate = function(certId) {
        openCertificateModal(certId);
    };
    
    window.viewCertificate = function(url) {
        window.open(url, '_blank');
    };
    
    window.deleteCertificate = async function(certId) {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }
        
        try {
            await window.supabase?.deleteCertificate?.(certId);
            
            // Remove from local state
            adminState.data.certificates = adminState.data.certificates.filter(c => c.id !== certId);
            
            // Re-render
            await renderCertificates();
            updateDashboardStats();
            
            showToast('Success', 'Certificate deleted successfully', 'success');
            
        } catch (error) {
            console.error('Delete certificate failed:', error);
            showToast('Error', 'Failed to delete certificate', 'error');
        }
    };
    
    // ===== FILE UPLOAD HANDLING =====
    function setupFileUploadHandlers() {
        // Project image upload
        const projectUpload = document.getElementById('project-image-upload');
        const projectInput = document.getElementById('project-image');
        
        if (projectUpload && projectInput) {
            setupFileUpload(projectUpload, projectInput, 'project-image-preview');
        }
        
        // Certificate image upload
        const certUpload = document.getElementById('certificate-image-upload');
        const certInput = document.getElementById('certificate-image');
        
        if (certUpload && certInput) {
            setupFileUpload(certUpload, certInput, 'certificate-image-preview');
        }
    }
    
    function setupFileUpload(uploadArea, fileInput, previewId) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File selection
        fileInput.addEventListener('change', (e) => {
            handleFileSelection(e.target.files[0], previewId);
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files[0], previewId);
                
                // Update input
                const dt = new DataTransfer();
                dt.items.add(files[0]);
                fileInput.files = dt.files;
            }
        });
        
        // Remove image button
        const removeBtn = uploadArea.querySelector('.remove-image');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearImagePreview(previewId);
                fileInput.value = '';
            });
        }
    }
    
    function handleFileSelection(file, previewId) {
        if (!file) return;
        
        // Validate file type
        if (!ADMIN_CONFIG.ui.allowedImageTypes.includes(file.type)) {
            showToast('Invalid File', 'Please select a valid image file (JPG, PNG, WebP)', 'error');
            return;
        }
        
        // Validate file size
        if (file.size > ADMIN_CONFIG.ui.maxFileSize) {
            showToast('File Too Large', 'Please select a file smaller than 10MB', 'error');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            showImagePreview(previewId, e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }
    
    function showImagePreview(previewId, src, fileName) {
        const preview = document.getElementById(previewId);
        const container = preview.closest('.file-upload-area');
        const placeholder = container.querySelector('.upload-placeholder');
        const imagePreview = container.querySelector('.image-preview');
        const img = container.querySelector(`#${previewId}`);
        
        if (img && imagePreview && placeholder) {
            img.src = src;
            img.alt = fileName;
            
            placeholder.style.display = 'none';
            imagePreview.style.display = 'block';
        }
    }
    
    function clearImagePreview(previewId) {
        const preview = document.getElementById(previewId);
        const container = preview.closest('.file-upload-area');
        const placeholder = container.querySelector('.upload-placeholder');
        const imagePreview = container.querySelector('.image-preview');
        
        if (imagePreview && placeholder) {
            placeholder.style.display = 'block';
            imagePreview.style.display = 'none';
        }
    }
    
    // ===== MODAL MANAGEMENT =====
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            adminState.ui.activeModals.add(modalId);
            
            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }
    
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            adminState.ui.activeModals.delete(modalId);
        }
    }
    
    function showLoginModal() {
        if (elements.adminApp) {
            elements.adminApp.style.display = 'none';
        }
        showModal('login-modal');
    }
    
    function show2FAModal(email) {
        showModal('twofa-modal');
        
        // Clear and focus first input
        elements.codeInputs.forEach(input => input.value = '');
        if (elements.codeInputs[0]) {
            elements.codeInputs[0].focus();
        }
        
        showToast('2FA Required', `Verification code sent to ${email}`, 'info');
    }
    
    function handleModalClicks(e) {
        // Close modal on backdrop click
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            if (modalId !== 'login-modal') { // Don't close login modal
                hideModal(modalId);
            }
        }
        
        // Close modal on close button
        if (e.target.matches('.modal-close, [data-modal]')) {
            const modalId = e.target.dataset.modal || e.target.closest('.modal')?.id;
            if (modalId) {
                hideModal(modalId);
            }
        }
    }
    
    // ===== TOAST NOTIFICATIONS =====
    function showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        if (elements.toastContainer) {
            elements.toastContainer.appendChild(toast);
        }
        
        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
        
        // Auto-remove
        setTimeout(() => {
            if (toast.parentNode) {
                removeToast(toast);
            }
        }, ADMIN_CONFIG.ui.toastDuration);
        
        // Store in state
        adminState.ui.notifications.push({
            id: Date.now(),
            title,
            message,
            type,
            timestamp: new Date()
        });
    }
    
    function removeToast(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    function getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    // ===== UTILITY FUNCTIONS =====
    function setLoadingState(button, isLoading) {
        if (!button) return;
        
        const textSpan = button.querySelector('.btn-text');
        const loaderSpan = button.querySelector('.btn-loader');
        
        button.disabled = isLoading;
        
        if (textSpan) textSpan.style.display = isLoading ? 'none' : 'inline-flex';
        if (loaderSpan) loaderSpan.style.display = isLoading ? 'inline-flex' : 'none';
    }
    
    function animateCounter(element, target) {
        if (!element) return;
        
        const start = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();
        
        function updateCounter() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (target - start) * easeOutCubic(progress));
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }
        
        requestAnimationFrame(updateCounter);
    }
    
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
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
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }
    
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // ===== VALIDATION =====
    function validateProjectData(data) {
        const config = ADMIN_CONFIG.validation.project;
        
        if (!data.name || data.name.length < config.nameMin || data.name.length > config.nameMax) {
            throw new Error(`Project name must be between ${config.nameMin} and ${config.nameMax} characters`);
        }
        
        if (!data.description || data.description.length < config.descMin || data.description.length > config.descMax) {
            throw new Error(`Project description must be between ${config.descMin} and ${config.descMax} characters`);
        }
        
        if (!data.url || !isValidUrl(data.url)) {
            throw new Error('Please provide a valid project URL');
        }
    }
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }
    
    // ===== SECURITY & MONITORING =====
    function setupSecurityMonitoring() {
        // Session timeout monitoring
        let lastActivity = Date.now();
        
        // Track user activity
        ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            }, { passive: true });
        });
        
        // Check for inactivity
        setInterval(() => {
            const inactive = Date.now() - lastActivity;
            if (inactive > ADMIN_CONFIG.security.autoLogoutTime && adminState.isAuthenticated) {
                handleLogout();
                showToast('Session Expired', 'You have been logged out due to inactivity', 'warning');
            }
        }, 60000); // Check every minute
    }
    
    function startSessionMonitoring() {
        setInterval(async () => {
            if (adminState.isAuthenticated) {
                try {
                    const isValid = await window.supabase?.validateSession?.();
                    if (!isValid) {
                        await handleLogout();
                        showToast('Session Invalid', 'Your session has expired. Please log in again.', 'warning');
                    }
                } catch (error) {
                    console.error('Session validation failed:', error);
                }
            }
        }, ADMIN_CONFIG.security.sessionCheckInterval);
    }
    
    function trackFailedLoginAttempt() {
        const attempts = parseInt(localStorage.getItem('admin-failed-attempts') || '0') + 1;
        localStorage.setItem('admin-failed-attempts', attempts.toString());
        
        if (attempts >= ADMIN_CONFIG.security.maxLoginAttempts) {
            // Lock out user
            const lockoutEnd = Date.now() + ADMIN_CONFIG.security.lockoutDuration;
            localStorage.setItem('admin-lockout-end', lockoutEnd.toString());
            
            showToast('Account Locked', 'Too many failed attempts. Try again later.', 'error');
        }
    }
    
    function handleVisibilityChange() {
        if (document.hidden && adminState.isAuthenticated) {
            // Pause auto-refresh when tab is hidden
            clearInterval(window.adminAutoRefresh);
        } else if (!document.hidden && adminState.isAuthenticated) {
            // Resume auto-refresh when tab is visible
            setupAutoRefresh();
        }
    }
    
    function setupAutoRefresh() {
        window.adminAutoRefresh = setInterval(async () => {
            if (adminState.isAuthenticated && !adminState.isLoading) {
                try {
                    await loadDashboardData();
                } catch (error) {
                    console.error('Auto-refresh failed:', error);
                }
            }
        }, ADMIN_CONFIG.ui.autoRefreshInterval);
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    function handleKeyboardShortcuts(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            const activeModal = Array.from(adminState.ui.activeModals).pop();
            if (activeModal && activeModal !== 'login-modal') {
                hideModal(activeModal);
            }
        }
        
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-box input');
            if (searchInput) searchInput.focus();
        }
        
        // Ctrl/Cmd + N for new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (adminState.currentSection === 'projects') {
                openProjectModal();
            } else if (adminState.currentSection === 'certificates') {
                openCertificateModal();
            }
        }
    }
    
    // ===== EVENT HANDLERS =====
    function handleWindowResize() {
        // Close dropdowns on resize
        document.querySelectorAll('.dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        // Hide mobile sidebar on desktop
        if (window.innerWidth > 768) {
            elements.sidebar.classList.remove('show');
        }
    }
    
    function handleBeforeUnload(e) {
        if (adminState.ui.activeModals.size > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    }
    
    function toggleNotifications() {
        elements.notificationDropdown.classList.toggle('show');
    }
    
    function toggleProfileDropdown() {
        elements.profileDropdown.classList.toggle('show');
    }
    
    function toggleTheme() {
        if (window.themeManager) {
            window.themeManager.toggle();
        }
    }
    
    // ===== PLACEHOLDER FUNCTIONS =====
    function populateProjectForm(project) {
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-url').value = project.url;
        document.getElementById('project-category').value = project.category || 'web';
        document.getElementById('project-technologies').value = project.technologies?.join(', ') || '';
        document.getElementById('project-featured').checked = project.is_featured;
        document.getElementById('project-active').checked = project.is_active;
    }
    
    function populateCertificateForm(cert) {
        document.getElementById('certificate-id').value = cert.id;
        document.getElementById('certificate-name').value = cert.name;
        document.getElementById('certificate-description').value = cert.description;
        document.getElementById('certificate-issuer').value = cert.issuer;
        document.getElementById('certificate-date').value = cert.issue_date;
        document.getElementById('certificate-credential').value = cert.credential_id || '';
        document.getElementById('certificate-credential-url').value = cert.credential_url || '';
        
        if (cert.image_url) {
            showImagePreview('certificate-image-preview', cert.image_url, cert.name);
        }
    }
    
    function setupSearchAndFilters() {
        // Implement search and filter functionality
        console.log('Search and filters setup - to be implemented');
    }
    
    function initializeTooltips() {
        // Initialize tooltip system
        console.log('Tooltips initialized - to be implemented');
    }
    
    function initializeDropdowns() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notifications') && !e.target.closest('.admin-profile')) {
                elements.notificationDropdown?.classList.remove('show');
                elements.profileDropdown?.classList.remove('show');
            }
        });
    }
    
    function initializeAnimations() {
        // Setup scroll animations and other effects
        console.log('Animations initialized - to be implemented');
    }
    
    function setupDragAndDrop() {
        // Additional drag and drop functionality
        console.log('Drag and drop setup - to be implemented');
    }
    
    function updateRecentActivity() {
        if (!elements.recentActivity) return;
        
        elements.recentActivity.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-plus-circle"></i>
                </div>
                <div class="activity-content">
                    <p>New project added</p>
                    <span class="activity-time">2 hours ago</span>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-certificate"></i>
                </div>
                <div class="activity-content">
                    <p>Certificate uploaded</p>
                    <span class="activity-time">1 day ago</span>
                </div>
            </div>
        `;
    }
    
    function renderMessages() {
        console.log('Messages rendering - to be implemented');
    }
    
    function renderSecurityData() {
        console.log('Security data rendering - to be implemented');
    }
    
    // ===== EXPORT GLOBAL FUNCTIONS =====
    window.adminPanel = {
        // Public API for external use
        switchSection,
        showToast,
        openProjectModal,
        openCertificateModal,
        refreshData: loadDashboardData,
        
        // State access
        getState: () => ({ ...adminState }),
        isAuthenticated: () => adminState.isAuthenticated
    };
    
})();

// ===== ADDITIONAL CSS FOR DYNAMIC ELEMENTS =====
const adminDynamicStyles = `
    <style>
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--admin-text-secondary);
        }
        
        .empty-state i {
            font-size: 4rem;
            color: var(--admin-text-muted);
            margin-bottom: 1rem;
        }
        
        .empty-state h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--admin-text-primary);
        }
        
        .empty-state p {
            margin-bottom: 2rem;
            font-size: 1rem;
        }
        
        .featured-badge {
            background: var(--admin-warning);
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            margin-top: 0.5rem;
            display: inline-block;
        }
        
        .item-meta {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .category {
            background: var(--admin-primary);
            color: white;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            text-transform: capitalize;
        }
        
        .tech-count {
            background: var(--admin-surface-hover);
            color: var(--admin-text-secondary);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
        }
        
        .cert-image {
            width: 100%;
            height: 200px;
            overflow: hidden;
            border-radius: var(--admin-radius) var(--admin-radius) 0 0;
        }
        
        .cert-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--admin-transition);
        }
        
        .certificate-item:hover .cert-image img {
            transform: scale(1.05);
        }
        
        .cert-issuer {
            color: var(--admin-text-muted);
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }
        
        .issue-date {
            background: var(--admin-info);
            color: white;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
        }
        
        .activity-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--admin-border);
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-icon {
            width: 40px;
            height: 40px;
            background: var(--admin-primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }
        
        .activity-content p {
            margin: 0;
            font-weight: 500;
            color: var(--admin-text-primary);
        }
        
        .activity-time {
            font-size: 0.85rem;
            color: var(--admin-text-muted);
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .item-footer {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }
            
            .item-meta {
                justify-content: center;
            }
            
            .item-actions {
                justify-content: center;
            }
        }
    </style>
`;

// Inject dynamic styles
document.head.insertAdjacentHTML('beforeend', adminDynamicStyles);
