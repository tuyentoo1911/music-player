// Sidebar functionality - Simplified for hover behavior
class Sidebar {
    constructor() {
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.setupElements();
        this.handleResize();
    }

    // Setup DOM elements
    setupElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.menuToggle = document.getElementById('menu-toggle');
        this.mainContent = document.querySelector('.main-content');
        this.loginBtn = document.getElementById('login-btn');
        this.signupBtn = document.getElementById('signup-btn');
    }

    // Setup event listeners
    setupEventListeners() {
        // Mobile menu toggle only
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Navigation items
        this.setupNavigation();

        // Authentication buttons
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => {
                console.log('Login clicked');
                // Add login functionality here
            });
        }

        if (this.signupBtn) {
            this.signupBtn.addEventListener('click', () => {
                console.log('Signup clicked');
                // Add signup functionality here
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Click outside to close on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !this.menuToggle.contains(e.target)) {
                    this.closeMobileMenu();
                }
            }
        });
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
        }
    }

    // Close mobile menu
    closeMobileMenu() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
        }
    }

    // Setup navigation functionality
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
                
                console.log('Navigation clicked:', item.querySelector('span').textContent);
            });
        });
    }

    // Handle window resize
    handleResize() {
        if (window.innerWidth > 768) {
            // Desktop: remove mobile classes
            if (this.sidebar) {
                this.sidebar.classList.remove('active');
            }
        }
    }

    // Premium upgrade functionality
    setupPremiumUpgrade() {
        const premiumBtn = document.querySelector('.premium-btn');
        if (premiumBtn) {
            premiumBtn.addEventListener('click', () => {
                console.log('Premium upgrade clicked');
                // Add premium upgrade functionality here
            });
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
});

// Export for potential use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
} 