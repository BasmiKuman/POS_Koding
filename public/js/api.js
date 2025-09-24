class APIClient {
    constructor() {
        this.baseURL = '';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth headers if available
        if (auth && auth.isAuthenticated()) {
            config.headers = {
                ...config.headers,
                ...auth.getAuthHeaders()
            };
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                if (auth) {
                    auth.logout();
                }
                return null;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Dashboard API
    async getDashboardStats() {
        return this.request('/api/dashboard/stats');
    }

    // Categories API
    async getCategories() {
        return this.request('/api/categories');
    }

    async createCategory(category) {
        return this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(category)
        });
    }

    async updateCategory(id, category) {
        return this.request(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(category)
        });
    }

    async deleteCategory(id) {
        return this.request(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // Products API
    async getProducts() {
        return this.request('/api/products');
    }

    async getProduct(id) {
        return this.request(`/api/products/${id}`);
    }

    async createProduct(product) {
        return this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }

    async updateProduct(id, product) {
        return this.request(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }

    async deleteProduct(id) {
        return this.request(`/api/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Sales API
    async getSales() {
        return this.request('/api/sales');
    }

    async getSale(id) {
        return this.request(`/api/sales/${id}`);
    }

    async createSale(sale) {
        return this.request('/api/sales', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    }

    // Reports API
    async getSalesReport(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        return this.request(`/api/reports/sales?${params.toString()}`);
    }

    async getProductsReport() {
        return this.request('/api/reports/products');
    }

    // Export functions
    exportCSV(type = 'sales') {
        const url = `/api/reports/export/csv?type=${type}`;
        window.open(url, '_blank');
    }

    exportXLSX(type = 'sales') {
        const url = `/api/reports/export/xlsx?type=${type}`;
        window.open(url, '_blank');
    }
}

// Global API client instance
const api = new APIClient();

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Find a container to show the alert
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.margin = '0 auto';
    
    element.innerHTML = '';
    element.appendChild(spinner);
}

function hideLoading(element, originalContent = '') {
    element.innerHTML = originalContent;
}

// Form validation utilities
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value && value.toString().trim().length > 0;
}

function validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
}

// Event handling utilities
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

// Local storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}
