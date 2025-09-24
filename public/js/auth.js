class AuthManager {
    constructor() {
        this.token = localStorage.getItem('pos_token');
        this.user = JSON.parse(localStorage.getItem('pos_user') || 'null');
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('pos_token', this.token);
                localStorage.setItem('pos_user', JSON.stringify(this.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    }

    async register(email, password, name, role = 'admin') {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name, role })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('pos_token', this.token);
                localStorage.setItem('pos_user', JSON.stringify(this.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.href = '/';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('pos_user', JSON.stringify(this.user));
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
            return false;
        }
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    getUser() {
        return this.user;
    }
}

// Global auth instance
const auth = new AuthManager();

// Check authentication on protected pages
if (window.location.pathname !== '/' && !auth.isAuthenticated()) {
    window.location.href = '/';
}
