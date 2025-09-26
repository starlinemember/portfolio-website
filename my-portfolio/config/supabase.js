/* ===== SUPABASE CONFIGURATION & DATABASE CLIENT ===== */
/* Secure Database Connection with 2025 Best Practices */

(function() {
    'use strict';
    
    // ===== CONFIGURATION =====
    const SUPABASE_CONFIG = {
        // Environment Variables (Replace with your actual values)
        url: 'YOUR_SUPABASE_URL', // Replace with your Supabase URL
        anonKey: 'YOUR_SUPABASE_ANON_KEY', // Replace with your public anon key
        
        // Security Settings
        security: {
            enableRLS: true, // Row Level Security
            maxRetries: 3,
            requestTimeout: 10000, // 10 seconds
            enableIPTracking: true,
            maxFailedAttempts: 3,
            lockoutDuration: 24 * 60 * 60 * 1000, // 24 hours
            sessionStorageKey: 'supabase.auth.token'
        },
        
        // Database Settings
        database: {
            schema: 'public',
            tables: {
                projects: 'projects',
                certificates: 'certificates',
                contacts: 'contact_messages',
                adminUsers: 'admin_users',
                ipBlocks: 'blocked_ips',
                loginAttempts: 'login_attempts',
                adminSessions: 'admin_sessions'
            }
        },
        
        // Admin Panel Settings
        admin: {
            require2FA: true,
            sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
            maxConcurrentSessions: 3,
            enableActivityLogging: true
        }
    };
    
    // ===== GLOBAL STATE =====
    let supabaseClient = null;
    let adminSession = null;
    let connectionState = {
        isConnected: false,
        isInitialized: false,
        lastError: null,
        retryCount: 0
    };
    
    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initializeSupabase();
    });
    
    async function initializeSupabase() {
        try {
            // Check if Supabase library is loaded
            if (typeof window.supabase === 'undefined') {
                await loadSupabaseLibrary();
            }
            
            // Initialize Supabase client
            await createSupabaseClient();
            
            // Setup security monitoring
            setupSecurityMonitoring();
            
            // Initialize database tables if needed
            await initializeDatabaseTables();
            
            // Setup admin session monitoring
            setupAdminSessionMonitoring();
            
            console.log('🗄️ Supabase initialized successfully');
            connectionState.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            connectionState.lastError = error;
            handleInitializationError(error);
        }
    }
    
    // ===== SUPABASE CLIENT CREATION =====
    async function createSupabaseClient() {
        if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
            throw new Error('Supabase URL and anon key are required');
        }
        
        // Validate URL format
        if (!isValidSupabaseUrl(SUPABASE_CONFIG.url)) {
            throw new Error('Invalid Supabase URL format');
        }
        
        const options = {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
                storage: window.localStorage,
                storageKey: SUPABASE_CONFIG.security.sessionStorageKey
            },
            global: {
                headers: {
                    'X-Client-Info': 'portfolio-website@1.0.0'
                }
            },
            db: {
                schema: SUPABASE_CONFIG.database.schema
            }
        };
        
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            options
        );
        
        // Test connection
        await testConnection();
        
        // Setup auth state listener
        setupAuthStateListener();
        
        connectionState.isConnected = true;
        return supabaseClient;
    }
    
    function isValidSupabaseUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('supabase.co') || 
                   urlObj.hostname.includes('supabase.in');
        } catch {
            return false;
        }
    }
    
    async function testConnection() {
        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.projects)
                .select('count', { count: 'exact', head: true });
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (acceptable)
                throw error;
            }
            
            console.log('✅ Database connection test successful');
        } catch (error) {
            console.warn('⚠️ Database connection test failed:', error.message);
            // Don't throw - connection might still work for other operations
        }
    }
    
    // ===== LIBRARY LOADING =====
    async function loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
            script.onload = () => {
                console.log('📚 Supabase library loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Supabase library'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // ===== DATABASE OPERATIONS =====
    
    // Projects CRUD Operations
    async function getProjects(filters = {}) {
        try {
            let query = supabaseClient
                .from(SUPABASE_CONFIG.database.tables.projects)
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            // Apply filters
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }
    
    async function createProject(projectData) {
        try {
            validateProjectData(projectData);
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.projects)
                .insert([{
                    name: sanitizeString(projectData.name),
                    description: sanitizeString(projectData.description),
                    url: validateUrl(projectData.url),
                    image_url: projectData.image_url ? validateUrl(projectData.image_url) : null,
                    technologies: projectData.technologies || [],
                    category: sanitizeString(projectData.category || 'web'),
                    is_featured: projectData.is_featured || false,
                    is_active: true,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            console.log('✅ Project created successfully');
            return data[0];
        } catch (error) {
            console.error('❌ Error creating project:', error);
            throw error;
        }
    }
    
    async function updateProject(id, projectData) {
        try {
            validateProjectData(projectData);
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.projects)
                .update({
                    name: sanitizeString(projectData.name),
                    description: sanitizeString(projectData.description),
                    url: validateUrl(projectData.url),
                    image_url: projectData.image_url ? validateUrl(projectData.image_url) : null,
                    technologies: projectData.technologies || [],
                    category: sanitizeString(projectData.category || 'web'),
                    is_featured: projectData.is_featured || false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            console.log('✅ Project updated successfully');
            return data[0];
        } catch (error) {
            console.error('❌ Error updating project:', error);
            throw error;
        }
    }
    
    async function deleteProject(id) {
        try {
            const { error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.projects)
                .update({ is_active: false })
                .eq('id', id);
            
            if (error) throw error;
            
            console.log('✅ Project deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting project:', error);
            throw error;
        }
    }
    
    // Certificates CRUD Operations
    async function getCertificates(filters = {}) {
        try {
            let query = supabaseClient
                .from(SUPABASE_CONFIG.database.tables.certificates)
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error fetching certificates:', error);
            return [];
        }
    }
    
    async function createCertificate(certData) {
        try {
            validateCertificateData(certData);
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.certificates)
                .insert([{
                    name: sanitizeString(certData.name),
                    description: sanitizeString(certData.description),
                    image_url: validateUrl(certData.image_url),
                    issuer: sanitizeString(certData.issuer),
                    issue_date: certData.issue_date,
                    credential_id: sanitizeString(certData.credential_id || ''),
                    credential_url: certData.credential_url ? validateUrl(certData.credential_url) : null,
                    is_active: true,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            console.log('✅ Certificate created successfully');
            return data[0];
        } catch (error) {
            console.error('❌ Error creating certificate:', error);
            throw error;
        }
    }
    
    // Contact Messages
    async function saveContactMessage(messageData) {
        try {
            validateContactData(messageData);
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.contacts)
                .insert([{
                    name: sanitizeString(messageData.name),
                    email: validateEmail(messageData.email),
                    subject: sanitizeString(messageData.subject),
                    message: sanitizeString(messageData.message),
                    user_agent: sanitizeString(messageData.user_agent || ''),
                    ip_address: await getUserIP(),
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            console.log('✅ Contact message saved successfully');
            return data[0];
        } catch (error) {
            console.error('❌ Error saving contact message:', error);
            throw error;
        }
    }
    
    // ===== ADMIN AUTHENTICATION =====
    async function adminLogin(credentials) {
        try {
            // Check if IP is blocked
            if (await isIPBlocked()) {
                throw new Error('Access denied: IP address is blocked');
            }
            
            // Check failed login attempts
            const failedAttempts = await getFailedLoginAttempts();
            if (failedAttempts >= SUPABASE_CONFIG.security.maxFailedAttempts) {
                await blockIP();
                throw new Error('Too many failed attempts. IP address has been blocked.');
            }
            
            // Validate credentials
            if (!credentials.email || !credentials.password) {
                await recordFailedLogin();
                throw new Error('Email and password are required');
            }
            
            // Authenticate with Supabase
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            });
            
            if (error) {
                await recordFailedLogin();
                throw error;
            }
            
            // Verify admin privileges
            const isAdmin = await verifyAdminPrivileges(data.user.id);
            if (!isAdmin) {
                await supabaseClient.auth.signOut();
                await recordFailedLogin();
                throw new Error('Access denied: Admin privileges required');
            }
            
            // Clear failed attempts on successful login
            await clearFailedLoginAttempts();
            
            // Create admin session
            adminSession = await createAdminSession(data.user);
            
            // Send 2FA code if enabled
            if (SUPABASE_CONFIG.admin.require2FA) {
                await send2FACode(data.user.email);
            }
            
            console.log('✅ Admin login successful');
            return {
                user: data.user,
                session: data.session,
                requires2FA: SUPABASE_CONFIG.admin.require2FA
            };
            
        } catch (error) {
            console.error('❌ Admin login failed:', error);
            throw error;
        }
    }
    
    async function verify2FACode(code) {
        try {
            if (!adminSession) {
                throw new Error('No active admin session');
            }
            
            const isValid = await validate2FACode(adminSession.user.email, code);
            if (!isValid) {
                throw new Error('Invalid 2FA code');
            }
            
            // Update session to mark 2FA as verified
            adminSession.is2FAVerified = true;
            await updateAdminSession(adminSession.id, { is_2fa_verified: true });
            
            console.log('✅ 2FA verification successful');
            return true;
        } catch (error) {
            console.error('❌ 2FA verification failed:', error);
            throw error;
        }
    }
    
    async function adminLogout() {
        try {
            if (adminSession) {
                await invalidateAdminSession(adminSession.id);
                adminSession = null;
            }
            
            await supabaseClient.auth.signOut();
            
            console.log('✅ Admin logout successful');
            return true;
        } catch (error) {
            console.error('❌ Admin logout failed:', error);
            throw error;
        }
    }
    
    // ===== SECURITY FUNCTIONS =====
    async function isIPBlocked() {
        try {
            const userIP = await getUserIP();
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.ipBlocks)
                .select('*')
                .eq('ip_address', userIP)
                .eq('is_active', true)
                .single();
            
            return data !== null;
        } catch {
            return false;
        }
    }
    
    async function blockIP() {
        try {
            const userIP = await getUserIP();
            
            const { error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.ipBlocks)
                .insert([{
                    ip_address: userIP,
                    reason: 'Excessive failed login attempts',
                    blocked_at: new Date().toISOString(),
                    is_active: true
                }]);
            
            if (error) throw error;
            
            // Send notification email to admin
            await sendIPBlockNotification(userIP);
            
            console.log('🚫 IP address blocked:', userIP);
        } catch (error) {
            console.error('Error blocking IP:', error);
        }
    }
    
    async function getFailedLoginAttempts() {
        try {
            const userIP = await getUserIP();
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.loginAttempts)
                .select('*')
                .eq('ip_address', userIP)
                .eq('success', false)
                .gte('created_at', oneHourAgo);
            
            return data ? data.length : 0;
        } catch {
            return 0;
        }
    }
    
    async function recordFailedLogin() {
        try {
            const userIP = await getUserIP();
            
            await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.loginAttempts)
                .insert([{
                    ip_address: userIP,
                    user_agent: navigator.userAgent,
                    success: false,
                    created_at: new Date().toISOString()
                }]);
        } catch (error) {
            console.error('Error recording failed login:', error);
        }
    }
    
    async function clearFailedLoginAttempts() {
        try {
            const userIP = await getUserIP();
            
            await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.loginAttempts)
                .delete()
                .eq('ip_address', userIP)
                .eq('success', false);
        } catch (error) {
            console.error('Error clearing failed login attempts:', error);
        }
    }
    
    async function getUserIP() {
        try {
            // Try to get IP from external service
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            // Fallback to a placeholder
            return 'unknown';
        }
    }
    
    // ===== VALIDATION FUNCTIONS =====
    function validateProjectData(data) {
        if (!data.name || data.name.length < 3 || data.name.length > 100) {
            throw new Error('Project name must be between 3 and 100 characters');
        }
        
        if (!data.description || data.description.length < 10 || data.description.length > 500) {
            throw new Error('Project description must be between 10 and 500 characters');
        }
        
        if (!data.url || !isValidUrl(data.url)) {
            throw new Error('Valid project URL is required');
        }
    }
    
    function validateCertificateData(data) {
        if (!data.name || data.name.length < 3 || data.name.length > 100) {
            throw new Error('Certificate name must be between 3 and 100 characters');
        }
        
        if (!data.description || data.description.length < 10 || data.description.length > 300) {
            throw new Error('Certificate description must be between 10 and 300 characters');
        }
        
        if (!data.image_url || !isValidUrl(data.image_url)) {
            throw new Error('Valid certificate image URL is required');
        }
        
        if (!data.issuer || data.issuer.length < 2 || data.issuer.length > 100) {
            throw new Error('Certificate issuer must be between 2 and 100 characters');
        }
    }
    
    function validateContactData(data) {
        if (!data.name || data.name.length < 2 || data.name.length > 50) {
            throw new Error('Name must be between 2 and 50 characters');
        }
        
        if (!data.email || !isValidEmail(data.email)) {
            throw new Error('Valid email address is required');
        }
        
        if (!data.subject || data.subject.length < 5 || data.subject.length > 100) {
            throw new Error('Subject must be between 5 and 100 characters');
        }
        
        if (!data.message || data.message.length < 10 || data.message.length > 1000) {
            throw new Error('Message must be between 10 and 1000 characters');
        }
    }
    
    function sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }
    
    function validateUrl(url) {
        if (!isValidUrl(url)) {
            throw new Error('Invalid URL format');
        }
        return url;
    }
    
    function validateEmail(email) {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        return email.toLowerCase();
    }
    
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }
    
    // ===== INITIALIZATION HELPERS =====
    async function initializeDatabaseTables() {
        // This would typically be done via Supabase dashboard or migration scripts
        // Included here for reference
        console.log('📋 Database tables should be initialized via Supabase dashboard');
    }
    
    function setupAuthStateListener() {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (event === 'SIGNED_OUT') {
                adminSession = null;
                // Clear any sensitive data from memory
                clearSensitiveData();
            }
        });
    }
    
    function setupSecurityMonitoring() {
        // Monitor for suspicious activities
        window.addEventListener('beforeunload', () => {
            // Auto-logout on page unload for security
            if (adminSession) {
                adminLogout();
            }
        });
        
        // Monitor for tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && adminSession) {
                // Start idle timer when tab is hidden
                startIdleTimer();
            } else {
                // Clear idle timer when tab is visible
                clearIdleTimer();
            }
        });
    }
    
    function setupAdminSessionMonitoring() {
        // Check session validity periodically
        setInterval(async () => {
            if (adminSession) {
                const isValid = await validateAdminSession();
                if (!isValid) {
                    await adminLogout();
                    window.location.reload();
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    // ===== ERROR HANDLING =====
    function handleInitializationError(error) {
        if (connectionState.retryCount < SUPABASE_CONFIG.security.maxRetries) {
            connectionState.retryCount++;
            console.log(`🔄 Retrying Supabase initialization (${connectionState.retryCount}/${SUPABASE_CONFIG.security.maxRetries})`);
            
            setTimeout(() => {
                initializeSupabase();
            }, 2000 * connectionState.retryCount);
        } else {
            console.error('💥 Supabase initialization failed permanently');
            // Show user-friendly error message
            showDatabaseError();
        }
    }
    
    function showDatabaseError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'database-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Database Connection Error</h3>
                <p>Unable to connect to the database. Some features may not work properly.</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background: var(--error-color, #ef4444);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    // ===== UTILITY FUNCTIONS (Placeholder for complex functions) =====
    async function verifyAdminPrivileges(userId) {
        // This would check if user is in admin_users table
        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.database.tables.adminUsers)
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();
            
            return data !== null;
        } catch {
            return false;
        }
    }
    
    async function createAdminSession(user) {
        // Create admin session record
        const sessionData = {
            id: generateSessionId(),
            user: user,
            createdAt: Date.now(),
            is2FAVerified: false
        };
        
        return sessionData;
    }
    
    async function send2FACode(email) {
        // This would integrate with email service to send 2FA code
        console.log('📧 2FA code would be sent to:', email);
    }
    
    async function validate2FACode(email, code) {
        // This would validate the 2FA code
        // For demo purposes, accept "123456"
        return code === '123456';
    }
    
    async function sendIPBlockNotification(ip) {
        // This would send notification to admin about blocked IP
        console.log('🚨 IP blocked notification would be sent for:', ip);
    }
    
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function clearSensitiveData() {
        adminSession = null;
        // Clear any cached admin data
    }
    
    function startIdleTimer() {
        // Start idle session timer
    }
    
    function clearIdleTimer() {
        // Clear idle session timer
    }
    
    async function validateAdminSession() {
        // Validate current admin session
        return adminSession !== null;
    }
    
    async function updateAdminSession(sessionId, updates) {
        // Update admin session in database
        console.log('Session updated:', sessionId, updates);
    }
    
    async function invalidateAdminSession(sessionId) {
        // Invalidate admin session in database
        console.log('Session invalidated:', sessionId);
    }
    
    // ===== PUBLIC API =====
    window.supabase = {
        // Database operations
        getProjects,
        createProject,
        updateProject,
        deleteProject,
        getCertificates,
        createCertificate,
        saveContactMessage,
        
        // Admin operations
        adminLogin,
        verify2FACode,
        adminLogout,
        
        // Utility functions
        getConnectionState: () => ({ ...connectionState }),
        isAdminLoggedIn: () => adminSession !== null && adminSession.is2FAVerified,
        
        // Configuration
        config: SUPABASE_CONFIG
    };
    
    // Make client available globally for debugging
    if (process.env.NODE_ENV === 'development') {
        window.supabaseClient = supabaseClient;
    }
    
})();

// ===== DATABASE SCHEMA REFERENCE =====
/* 
-- Run these SQL commands in your Supabase SQL editor to create the necessary tables

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    technologies TEXT[],
    category VARCHAR(50) DEFAULT 'web',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    issuer VARCHAR(100) NOT NULL,
    issue_date DATE,
    credential_id VARCHAR(100),
    credential_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked IPs table
CREATE TABLE blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Login attempts table
CREATE TABLE login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read access for projects and certificates)
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (is_active = true);
CREATE POLICY "Public read certificates" ON certificates FOR SELECT USING (is_active = true);

-- Admin-only policies
CREATE POLICY "Admin full access projects" ON projects FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access certificates" ON certificates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin read contacts" ON contact_messages FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

*/
