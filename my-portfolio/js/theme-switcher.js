/* ===== THEME SWITCHER - DUAL THEME FUNCTIONALITY ===== */
/* Professional & Creative Theme Toggle with 2025 Best Practices */

(function() {
    'use strict';
    
    // ===== THEME CONFIGURATION =====
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    };
    
    const THEME_CONFIG = {
        storageKey: 'portfolio-theme-preference',
        attributeName: 'data-theme',
        transitionClass: 'theme-transitioning',
        transitionDuration: 300 // milliseconds
    };
    
    // ===== STATE MANAGEMENT =====
    let currentTheme = THEMES.LIGHT;
    let systemPreference = THEMES.LIGHT;
    let userPreference = null;
    let themeToggleButton = null;
    let isTransitioning = false;
    
    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initializeThemeSystem();
    });
    
    // ===== MAIN INITIALIZATION =====
    function initializeThemeSystem() {
        detectSystemPreference();
        loadUserPreference();
        determineActiveTheme();
        setupThemeToggle();
        applyTheme(currentTheme, false);
        setupSystemPreferenceListener();
        setupKeyboardShortcuts();
        
        console.log('🎨 Theme system initialized:', {
            current: currentTheme,
            system: systemPreference,
            user: userPreference
        });
    }
    
    // ===== SYSTEM PREFERENCE DETECTION =====
    function detectSystemPreference() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            systemPreference = darkModeQuery.matches ? THEMES.DARK : THEMES.LIGHT;
            
            console.log('🖥️ System preference detected:', systemPreference);
        }
    }
    
    function setupSystemPreferenceListener() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Modern browsers support addEventListener on MediaQueryList
            if (darkModeQuery.addEventListener) {
                darkModeQuery.addEventListener('change', handleSystemPreferenceChange);
            } else {
                // Fallback for older browsers
                darkModeQuery.addListener(handleSystemPreferenceChange);
            }
        }
    }
    
    function handleSystemPreferenceChange(e) {
        systemPreference = e.matches ? THEMES.DARK : THEMES.LIGHT;
        
        // Only update theme if user hasn't set explicit preference
        if (!userPreference || userPreference === THEMES.AUTO) {
            determineActiveTheme();
            applyTheme(currentTheme, true);
            updateToggleButtonState();
        }
        
        console.log('🔄 System preference changed:', systemPreference);
    }
    
    // ===== USER PREFERENCE MANAGEMENT =====
    function loadUserPreference() {
        try {
            const stored = localStorage.getItem(THEME_CONFIG.storageKey);
            if (stored && Object.values(THEMES).includes(stored)) {
                userPreference = stored;
                console.log('💾 User preference loaded:', userPreference);
            }
        } catch (error) {
            console.warn('⚠️ Could not load theme preference:', error);
            // Fallback to no user preference
            userPreference = null;
        }
    }
    
    function saveUserPreference(preference) {
        try {
            localStorage.setItem(THEME_CONFIG.storageKey, preference);
            userPreference = preference;
            console.log('💾 User preference saved:', preference);
        } catch (error) {
            console.warn('⚠️ Could not save theme preference:', error);
        }
    }
    
    // ===== THEME DETERMINATION LOGIC =====
    function determineActiveTheme() {
        // Preference cascade: user preference > system preference > default
        if (userPreference && userPreference !== THEMES.AUTO) {
            currentTheme = userPreference;
        } else {
            // Use system preference or fallback to light
            currentTheme = systemPreference || THEMES.LIGHT;
        }
        
        console.log('🎯 Active theme determined:', currentTheme);
    }
    
    // ===== THEME APPLICATION =====
    function applyTheme(theme, animate = true) {
        if (isTransitioning && animate) {
            return; // Prevent multiple simultaneous transitions
        }
        
        const htmlElement = document.documentElement;
        const bodyElement = document.body;
        
        if (animate) {
            isTransitioning = true;
            bodyElement.classList.add(THEME_CONFIG.transitionClass);
        }
        
        // Remove all theme attributes first
        htmlElement.removeAttribute(THEME_CONFIG.attributeName);
        
        // Apply the new theme
        if (theme === THEMES.DARK) {
            htmlElement.setAttribute(THEME_CONFIG.attributeName, THEMES.DARK);
        }
        // Light theme is default (no attribute needed)
        
        // Update meta theme-color for mobile browsers
        updateMetaThemeColor(theme);
        
        // Update CSS custom properties if needed
        updateCSSCustomProperties(theme);
        
        // Trigger custom event for other components
        dispatchThemeChangeEvent(theme);
        
        if (animate) {
            // Remove transition class after animation completes
            setTimeout(() => {
                bodyElement.classList.remove(THEME_CONFIG.transitionClass);
                isTransitioning = false;
            }, THEME_CONFIG.transitionDuration);
        }
        
        console.log('🎨 Theme applied:', theme);
    }
    
    // ===== THEME TOGGLE SETUP =====
    function setupThemeToggle() {
        themeToggleButton = document.getElementById('theme-toggle');
        
        if (!themeToggleButton) {
            console.warn('⚠️ Theme toggle button not found');
            return;
        }
        
        // Set up click handler
        themeToggleButton.addEventListener('click', handleThemeToggle);
        
        // Set up keyboard accessibility
        themeToggleButton.addEventListener('keydown', handleThemeToggleKeyboard);
        
        // Initialize button state
        updateToggleButtonState();
        
        // Add ARIA attributes for accessibility
        setupAccessibilityAttributes();
    }
    
    function setupAccessibilityAttributes() {
        if (!themeToggleButton) return;
        
        themeToggleButton.setAttribute('role', 'button');
        themeToggleButton.setAttribute('tabindex', '0');
        updateAriaLabel();
    }
    
    function updateAriaLabel() {
        if (!themeToggleButton) return;
        
        const nextTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        const label = `Switch to ${nextTheme === THEMES.DARK ? 'creative' : 'professional'} theme`;
        themeToggleButton.setAttribute('aria-label', label);
    }
    
    // ===== THEME TOGGLE HANDLERS =====
    function handleThemeToggle(e) {
        e.preventDefault();
        toggleTheme();
    }
    
    function handleThemeToggleKeyboard(e) {
        // Handle Enter and Space keys
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    }
    
    function toggleTheme() {
        if (isTransitioning) {
            return; // Prevent rapid toggling
        }
        
        const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        
        // Save user preference
        saveUserPreference(newTheme);
        
        // Update current theme
        currentTheme = newTheme;
        
        // Apply the new theme
        applyTheme(newTheme, true);
        
        // Update button state
        updateToggleButtonState();
        
        // Analytics tracking (optional)
        trackThemeChange(newTheme);
        
        console.log('🔄 Theme toggled to:', newTheme);
    }
    
    // ===== BUTTON STATE UPDATES =====
    function updateToggleButtonState() {
        if (!themeToggleButton) return;
        
        const icon = themeToggleButton.querySelector('i');
        if (!icon) return;
        
        // Update icon based on current theme
        if (currentTheme === THEMES.DARK) {
            // Show sun icon (to indicate switching to light)
            icon.className = 'fas fa-sun';
            themeToggleButton.classList.add('dark-active');
        } else {
            // Show moon icon (to indicate switching to dark)
            icon.className = 'fas fa-moon';
            themeToggleButton.classList.remove('dark-active');
        }
        
        // Update aria label
        updateAriaLabel();
        
        // Add visual feedback
        themeToggleButton.classList.add('theme-changed');
        setTimeout(() => {
            themeToggleButton.classList.remove('theme-changed');
        }, 200);
    }
    
    // ===== META THEME COLOR UPDATE =====
    function updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }
        
        const themeColors = {
            [THEMES.LIGHT]: '#ffffff',
            [THEMES.DARK]: '#0f172a'
        };
        
        metaThemeColor.setAttribute('content', themeColors[theme]);
    }
    
    // ===== CSS CUSTOM PROPERTIES UPDATE =====
    function updateCSSCustomProperties(theme) {
        // Additional dynamic color updates if needed
        const root = document.documentElement;
        
        if (theme === THEMES.DARK) {
            // Set any additional CSS custom properties for dark theme
            root.style.setProperty('--selection-bg', 'rgba(139, 92, 246, 0.3)');
            root.style.setProperty('--scrollbar-thumb', 'rgba(139, 92, 246, 0.6)');
        } else {
            // Set properties for light theme
            root.style.setProperty('--selection-bg', 'rgba(99, 102, 241, 0.3)');
            root.style.setProperty('--scrollbar-thumb', 'rgba(99, 102, 241, 0.6)');
        }
    }
    
    // ===== CUSTOM EVENTS =====
    function dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: theme,
                timestamp: Date.now(),
                isUserInitiated: true
            },
            bubbles: true,
            cancelable: false
        });
        
        document.dispatchEvent(event);
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Shift + D for theme toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                toggleTheme();
            }
        });
    }
    
    // ===== ANALYTICS & TRACKING =====
    function trackThemeChange(newTheme) {
        // Optional analytics tracking
        try {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'theme_change', {
                    'theme': newTheme,
                    'timestamp': new Date().toISOString()
                });
            }
            
            // Custom analytics
            if (window.portfolioAnalytics) {
                window.portfolioAnalytics.track('theme_changed', {
                    theme: newTheme,
                    previous_theme: currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
                });
            }
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    function getCurrentTheme() {
        return currentTheme;
    }
    
    function getUserPreference() {
        return userPreference;
    }
    
    function getSystemPreference() {
        return systemPreference;
    }
    
    function setTheme(theme, savePreference = true) {
        if (!Object.values(THEMES).includes(theme)) {
            console.warn('Invalid theme:', theme);
            return false;
        }
        
        currentTheme = theme;
        
        if (savePreference) {
            saveUserPreference(theme);
        }
        
        applyTheme(theme, true);
        updateToggleButtonState();
        
        return true;
    }
    
    // ===== RESET FUNCTIONALITY =====
    function resetThemePreference() {
        try {
            localStorage.removeItem(THEME_CONFIG.storageKey);
            userPreference = null;
            determineActiveTheme();
            applyTheme(currentTheme, true);
            updateToggleButtonState();
            
            console.log('🔄 Theme preference reset');
            return true;
        } catch (error) {
            console.error('Failed to reset theme preference:', error);
            return false;
        }
    }
    
    // ===== PUBLIC API =====
    window.themeManager = {
        // Theme control
        toggle: toggleTheme,
        setTheme: setTheme,
        reset: resetThemePreference,
        
        // Theme information
        getCurrentTheme: getCurrentTheme,
        getUserPreference: getUserPreference,
        getSystemPreference: getSystemPreference,
        
        // Theme constants
        THEMES: THEMES,
        
        // Utility
        isTransitioning: () => isTransitioning
    };
    
    // ===== ERROR HANDLING =====
    window.addEventListener('error', function(e) {
        if (e.message.includes('localStorage') || e.message.includes('theme')) {
            console.warn('Theme system error handled:', e.message);
            // Fallback to light theme
            currentTheme = THEMES.LIGHT;
            applyTheme(currentTheme, false);
        }
    });
    
    // ===== PERFORMANCE OPTIMIZATION =====
    
    // Debounce rapid theme changes
    function debounceToggle(func, wait) {
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
    
    // Override toggle with debounced version for performance
    const debouncedToggle = debounceToggle(toggleTheme, 100);
    
    // ===== ACCESSIBILITY ENHANCEMENTS =====
    
    // Focus management for theme toggle
    function enhanceAccessibility() {
        if (themeToggleButton) {
            // Add focus indicator
            themeToggleButton.addEventListener('focus', function() {
                this.classList.add('keyboard-focus');
            });
            
            themeToggleButton.addEventListener('blur', function() {
                this.classList.remove('keyboard-focus');
            });
        }
    }
    
    // Initialize accessibility enhancements
    document.addEventListener('DOMContentLoaded', enhanceAccessibility);
    
    // ===== PREFERS-REDUCED-MOTION SUPPORT =====
    function respectsReducedMotion() {
        if (window.matchMedia) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (prefersReducedMotion.matches) {
                THEME_CONFIG.transitionDuration = 0; // Disable animations
            }
        }
    }
    
    // Check for reduced motion preference
    respectsReducedMotion();
    
})();

// ===== ADDITIONAL CSS FOR THEME TRANSITIONS =====
const themeTransitionStyles = `
    <style>
        .theme-transitioning *,
        .theme-transitioning *:before,
        .theme-transitioning *:after {
            transition: background-color 300ms ease,
                       color 300ms ease,
                       border-color 300ms ease,
                       box-shadow 300ms ease !important;
        }
        
        .theme-toggle {
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .theme-toggle.dark-active {
            background: var(--accent-color);
            color: white;
        }
        
        .theme-toggle.theme-changed {
            animation: themeTogglePulse 0.3s ease;
        }
        
        .theme-toggle.keyboard-focus {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }
        
        @keyframes themeTogglePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* Smooth icon transitions */
        .theme-toggle i {
            transition: all 0.3s ease;
            display: inline-block;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .theme-transitioning *,
            .theme-transitioning *:before,
            .theme-transitioning *:after,
            .theme-toggle,
            .theme-toggle i {
                transition: none !important;
                animation: none !important;
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .theme-toggle {
                border: 2px solid currentColor;
            }
            
            .theme-toggle:focus {
                outline-width: 3px;
            }
        }
    </style>
`;

// Inject theme transition styles
document.head.insertAdjacentHTML('beforeend', themeTransitionStyles);
