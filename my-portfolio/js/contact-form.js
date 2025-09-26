/* ===== CONTACT FORM - SECURE EMAIL INTEGRATION ===== */
/* Modern Contact Form with 2025 Security & UX Best Practices */

(function() {
    'use strict';
    
    // ===== CONFIGURATION =====
    const CONFIG = {
        // EmailJS Configuration (will be set up with your account)
        emailJS: {
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY', // Replace with actual key
            serviceId: 'YOUR_SERVICE_ID',         // Replace with actual service ID
            templateId: 'YOUR_TEMPLATE_ID'        // Replace with actual template ID
        },
        
        // Validation Rules
        validation: {
            name: {
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s'-]+$/
            },
            email: {
                pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            },
            subject: {
                minLength: 5,
                maxLength: 100
            },
            message: {
                minLength: 10,
                maxLength: 1000
            }
        },
        
        // Security Settings
        security: {
            maxSubmissionsPerHour: 5,
            honeypotFieldName: 'website', // Hidden field to catch bots
            rateLimitKey: 'contactFormSubmissions',
            enableIPBlocking: false // Set to true if you have IP tracking
        },
        
        // UI Settings
        ui: {
            showRealTimeValidation: true,
            enableProgressIndicator: true,
            animationDuration: 300,
            successMessageDuration: 5000
        }
    };
    
    // ===== GLOBAL STATE =====
    let formState = {
        isSubmitting: false,
        validationErrors: {},
        isValid: false,
        submissionCount: 0,
        lastSubmissionTime: null
    };
    
    // ===== DOM ELEMENTS =====
    let elements = {};
    
    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initializeContactForm();
    });
    
    function initializeContactForm() {
        // Get DOM elements
        elements = {
            form: document.getElementById('contact-form'),
            nameField: document.querySelector('input[name="name"]'),
            emailField: document.querySelector('input[name="email"]'),
            subjectField: document.querySelector('input[name="subject"]'),
            messageField: document.querySelector('textarea[name="message"]'),
            submitButton: document.querySelector('button[type="submit"]'),
            honeypot: null // Will be created dynamically
        };
        
        if (!elements.form) {
            console.warn('⚠️ Contact form not found');
            return;
        }
        
        setupFormSecurity();
        setupEventListeners();
        setupValidation();
        loadEmailJS();
        initializeRateLimiting();
        
        console.log('📧 Contact form initialized successfully');
    }
    
    // ===== SECURITY SETUP =====
    function setupFormSecurity() {
        // Create honeypot field (hidden field to catch bots)
        createHoneypotField();
        
        // Add CSRF-like token
        addFormToken();
        
        // Setup input sanitization
        setupInputSanitization();
        
        // Prevent autocomplete on sensitive fields
        elements.emailField.setAttribute('autocomplete', 'email');
        elements.nameField.setAttribute('autocomplete', 'name');
    }
    
    function createHoneypotField() {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = CONFIG.security.honeypotFieldName;
        honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
        
        elements.form.appendChild(honeypot);
        elements.honeypot = honeypot;
    }
    
    function addFormToken() {
        const token = generateFormToken();
        const tokenField = document.createElement('input');
        tokenField.type = 'hidden';
        tokenField.name = 'form_token';
        tokenField.value = token;
        elements.form.appendChild(tokenField);
    }
    
    function generateFormToken() {
        return 'form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function setupInputSanitization() {
        // Add input event listeners for real-time sanitization
        [elements.nameField, elements.subjectField, elements.messageField].forEach(field => {
            if (field) {
                field.addEventListener('input', sanitizeInput);
                field.addEventListener('paste', handlePaste);
            }
        });
    }
    
    function sanitizeInput(e) {
        const field = e.target;
        let value = field.value;
        
        // Remove potentially dangerous characters
        value = value.replace(/[<>]/g, '');
        
        // Limit length based on field type
        const fieldName = field.getAttribute('name');
        const maxLength = CONFIG.validation[fieldName]?.maxLength;
        
        if (maxLength && value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        field.value = value;
    }
    
    function handlePaste(e) {
        // Allow paste but sanitize the content
        setTimeout(() => {
            sanitizeInput(e);
        }, 0);
    }
    
    // ===== EMAIL JS SETUP =====
    function loadEmailJS() {
        if (window.emailjs) {
            emailjs.init({
                publicKey: CONFIG.emailJS.publicKey
            });
            console.log('📧 EmailJS initialized');
        } else {
            console.warn('⚠️ EmailJS not loaded. Please include the EmailJS script.');
        }
    }
    
    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Form submission
        elements.form.addEventListener('submit', handleFormSubmit);
        
        // Real-time validation
        if (CONFIG.ui.showRealTimeValidation) {
            setupRealTimeValidation();
        }
        
        // Prevent multiple rapid submissions
        elements.submitButton.addEventListener('click', preventDoubleClick);
        
        // Accessibility enhancements
        setupAccessibilityFeatures();
        
        // Auto-resize textarea
        if (elements.messageField) {
            elements.messageField.addEventListener('input', autoResizeTextarea);
        }
    }
    
    function setupRealTimeValidation() {
        Object.values(elements).forEach(element => {
            if (element && element.tagName && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                element.addEventListener('blur', validateField);
                element.addEventListener('input', debounce(validateField, 500));
            }
        });
    }
    
    function setupAccessibilityFeatures() {
        // Add ARIA labels and descriptions
        const fields = [
            { element: elements.nameField, label: 'Full name', required: true },
            { element: elements.emailField, label: 'Email address', required: true },
            { element: elements.subjectField, label: 'Subject', required: true },
            { element: elements.messageField, label: 'Message', required: true }
        ];
        
        fields.forEach(field => {
            if (field.element) {
                field.element.setAttribute('aria-label', field.label);
                if (field.required) {
                    field.element.setAttribute('aria-required', 'true');
                }
            }
        });
    }
    
    // ===== FORM VALIDATION =====
    function setupValidation() {
        // Create error message containers
        Object.entries(elements).forEach(([key, element]) => {
            if (element && element.tagName && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                createErrorContainer(element);
            }
        });
    }
    
    function createErrorContainer(field) {
        const container = field.closest('.form-group');
        if (container && !container.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.style.cssText = `
                color: var(--error-color, #ef4444);
                font-size: 0.875rem;
                margin-top: 0.5rem;
                display: none;
                animation: slideDown 0.3s ease;
            `;
            container.appendChild(errorDiv);
        }
    }
    
    function validateField(e) {
        const field = e.target;
        const fieldName = field.getAttribute('name');
        const value = field.value.trim();
        
        if (!fieldName || fieldName === CONFIG.security.honeypotFieldName) {
            return true;
        }
        
        const validation = CONFIG.validation[fieldName];
        if (!validation) return true;
        
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (!value) {
            isValid = false;
            errorMessage = `${capitalizeFirst(fieldName)} is required`;
        }
        // Length validation
        else if (validation.minLength && value.length < validation.minLength) {
            isValid = false;
            errorMessage = `${capitalizeFirst(fieldName)} must be at least ${validation.minLength} characters`;
        }
        else if (validation.maxLength && value.length > validation.maxLength) {
            isValid = false;
            errorMessage = `${capitalizeFirst(fieldName)} must be less than ${validation.maxLength} characters`;
        }
        // Pattern validation
        else if (validation.pattern && !validation.pattern.test(value)) {
            isValid = false;
            if (fieldName === 'email') {
                errorMessage = 'Please enter a valid email address';
            } else if (fieldName === 'name') {
                errorMessage = 'Name can only contain letters, spaces, apostrophes, and hyphens';
            } else {
                errorMessage = `${capitalizeFirst(fieldName)} format is invalid`;
            }
        }
        
        // Update UI
        updateFieldValidation(field, isValid, errorMessage);
        
        // Update form state
        if (isValid) {
            delete formState.validationErrors[fieldName];
        } else {
            formState.validationErrors[fieldName] = errorMessage;
        }
        
        // Update overall form validity
        updateFormValidity();
        
        return isValid;
    }
    
    function updateFieldValidation(field, isValid, errorMessage) {
        const container = field.closest('.form-group');
        const errorDiv = container.querySelector('.error-message');
        
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (errorDiv) {
                errorDiv.textContent = errorMessage;
                errorDiv.style.display = 'block';
            }
        }
    }
    
    function validateForm() {
        let isValid = true;
        
        // Validate all fields
        Object.values(elements).forEach(element => {
            if (element && element.tagName && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                const fieldValid = validateField({ target: element });
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        // Security validations
        if (!performSecurityChecks()) {
            isValid = false;
        }
        
        return isValid;
    }
    
    function updateFormValidity() {
        const hasErrors = Object.keys(formState.validationErrors).length > 0;
        formState.isValid = !hasErrors;
        
        // Update submit button state
        if (elements.submitButton) {
            elements.submitButton.disabled = !formState.isValid || formState.isSubmitting;
            
            if (formState.isValid && !formState.isSubmitting) {
                elements.submitButton.classList.add('ready');
            } else {
                elements.submitButton.classList.remove('ready');
            }
        }
    }
    
    // ===== SECURITY CHECKS =====
    function performSecurityChecks() {
        // Check honeypot field
        if (elements.honeypot && elements.honeypot.value) {
            console.warn('🚫 Bot detected via honeypot');
            return false;
        }
        
        // Rate limiting check
        if (!checkRateLimit()) {
            showError('Too many submissions. Please wait before trying again.');
            return false;
        }
        
        // Content security check
        if (!checkMessageContent()) {
            showError('Message contains prohibited content.');
            return false;
        }
        
        return true;
    }
    
    function checkRateLimit() {
        const now = Date.now();
        const submissions = getSubmissionHistory();
        
        // Clean old submissions (older than 1 hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        const recentSubmissions = submissions.filter(time => time > oneHourAgo);
        
        // Update storage
        saveSubmissionHistory(recentSubmissions);
        
        // Check if under limit
        return recentSubmissions.length < CONFIG.security.maxSubmissionsPerHour;
    }
    
    function checkMessageContent() {
        const message = elements.messageField.value.toLowerCase();
        
        // Basic spam/malicious content detection
        const prohibitedPatterns = [
            /\b(viagra|casino|lottery|winner|congratulations|click here|buy now)\b/i,
            /https?:\/\/[^\s]+/g, // Excessive URLs
            /(.)\1{10,}/g // Excessive repeated characters
        ];
        
        return !prohibitedPatterns.some(pattern => pattern.test(message));
    }
    
    function getSubmissionHistory() {
        try {
            const stored = localStorage.getItem(CONFIG.security.rateLimitKey);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }
    
    function saveSubmissionHistory(submissions) {
        try {
            localStorage.setItem(CONFIG.security.rateLimitKey, JSON.stringify(submissions));
        } catch {
            console.warn('Could not save submission history');
        }
    }
    
    function recordSubmission() {
        const submissions = getSubmissionHistory();
        submissions.push(Date.now());
        saveSubmissionHistory(submissions);
    }
    
    // ===== FORM SUBMISSION =====
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (formState.isSubmitting) {
            return; // Prevent double submission
        }
        
        // Validate form
        if (!validateForm()) {
            showError('Please correct the errors above');
            return;
        }
        
        // Start submission process
        setSubmittingState(true);
        
        try {
            // Collect form data
            const formData = collectFormData();
            
            // Send email
            await sendEmail(formData);
            
            // Store in database (optional)
            await storeMessage(formData);
            
            // Record successful submission
            recordSubmission();
            
            // Show success message
            showSuccess('Message sent successfully! Thank you for reaching out.');
            
            // Reset form
            resetForm();
            
        } catch (error) {
            console.error('Form submission error:', error);
            showError('Failed to send message. Please try again later.');
        } finally {
            setSubmittingState(false);
        }
    }
    
    function collectFormData() {
        return {
            name: elements.nameField.value.trim(),
            email: elements.emailField.value.trim(),
            subject: elements.subjectField.value.trim(),
            message: elements.messageField.value.trim(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100), // Limit length
            formToken: elements.form.querySelector('input[name="form_token"]')?.value
        };
    }
    
    async function sendEmail(formData) {
        if (!window.emailjs) {
            throw new Error('EmailJS not available');
        }
        
        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            reply_to: formData.email,
            to_email: 'your.email@example.com' // Replace with your email
        };
        
        const response = await emailjs.send(
            CONFIG.emailJS.serviceId,
            CONFIG.emailJS.templateId,
            templateParams
        );
        
        if (response.status !== 200) {
            throw new Error(`EmailJS failed: ${response.status}`);
        }
        
        return response;
    }
    
    async function storeMessage(formData) {
        // Optional: Store message in Supabase
        if (typeof window.supabase !== 'undefined') {
            try {
                const { data, error } = await window.supabase
                    .from('contact_messages')
                    .insert([{
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message,
                        user_agent: formData.userAgent,
                        created_at: formData.timestamp
                    }]);
                
                if (error) {
                    console.warn('Failed to store message in database:', error);
                }
            } catch (error) {
                console.warn('Database storage failed:', error);
            }
        }
    }
    
    // ===== UI STATE MANAGEMENT =====
    function setSubmittingState(isSubmitting) {
        formState.isSubmitting = isSubmitting;
        
        if (elements.submitButton) {
            elements.submitButton.disabled = isSubmitting;
            
            if (isSubmitting) {
                elements.submitButton.innerHTML = `
                    <span class="loading-spinner"></span>
                    Sending...
                `;
                elements.submitButton.classList.add('submitting');
            } else {
                elements.submitButton.innerHTML = 'Send Message';
                elements.submitButton.classList.remove('submitting');
            }
        }
        
        // Disable form fields during submission
        Object.values(elements).forEach(element => {
            if (element && element.tagName && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                element.disabled = isSubmitting;
            }
        });
    }
    
    function resetForm() {
        elements.form.reset();
        
        // Clear validation states
        Object.values(elements).forEach(element => {
            if (element && element.classList) {
                element.classList.remove('valid', 'invalid');
            }
        });
        
        // Clear error messages
        elements.form.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
        
        // Reset form state
        formState.validationErrors = {};
        formState.isValid = false;
        
        updateFormValidity();
    }
    
    // ===== FEEDBACK MESSAGES =====
    function showSuccess(message) {
        showNotification(message, 'success');
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" aria-label="Close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'success' ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)'};
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Setup close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            hideNotification(notification);
        });
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    hideNotification(notification);
                }
            }, CONFIG.ui.successMessageDuration);
        }
        
        // Auto-hide error messages after longer delay
        if (type === 'error') {
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    hideNotification(notification);
                }
            }, CONFIG.ui.successMessageDuration * 1.5);
        }
    }
    
    function hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }
    
    // ===== UTILITY FUNCTIONS =====
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
    
    function preventDoubleClick(e) {
        if (formState.isSubmitting) {
            e.preventDefault();
            return false;
        }
    }
    
    function autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    function initializeRateLimiting() {
        // Clean up old rate limiting data on page load
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const submissions = getSubmissionHistory().filter(time => time > oneHourAgo);
        saveSubmissionHistory(submissions);
    }
    
    // ===== PUBLIC API =====
    window.contactForm = {
        validateForm: validateForm,
        resetForm: resetForm,
        setConfig: (newConfig) => {
            Object.assign(CONFIG, newConfig);
        },
        getState: () => ({ ...formState })
    };
    
    // ===== FALLBACK FOR EMAILJS =====
    if (!window.emailjs) {
        console.warn('⚠️ EmailJS not found. Loading from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        script.onload = loadEmailJS;
        document.head.appendChild(script);
    }
    
})();

// ===== ADDITIONAL CSS STYLES =====
const contactFormStyles = `
    <style>
        /* Form Validation Styles */
        .form-group input.valid,
        .form-group textarea.valid {
            border-color: var(--success-color, #10b981);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .form-group input.invalid,
        .form-group textarea.invalid {
            border-color: var(--error-color, #ef4444);
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .error-message {
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Submit Button States */
        .btn.ready {
            background: var(--success-color, #10b981);
            transform: scale(1.02);
        }
        
        .btn.submitting {
            background: var(--accent-color, #6366f1);
            cursor: not-allowed;
            opacity: 0.8;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 0.5rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Notification Styles */
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: currentColor;
            font-size: 1.25rem;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            margin-left: auto;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        /* Accessibility Enhancements */
        @media (prefers-reduced-motion: reduce) {
            .notification,
            .error-message,
            .loading-spinner {
                animation: none !important;
                transition: none !important;
            }
        }
        
        /* High Contrast Mode */
        @media (prefers-contrast: high) {
            .form-group input.invalid,
            .form-group textarea.invalid {
                border-width: 3px;
            }
            
            .error-message {
                font-weight: bold;
            }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .notification {
                left: 10px;
                right: 10px;
                top: 10px;
                max-width: none;
                transform: translateY(-100%);
            }
            
            .notification.show {
                transform: translateY(0);
            }
        }
    </style>
`;

// Inject contact form styles
document.head.insertAdjacentHTML('beforeend', contactFormStyles);
