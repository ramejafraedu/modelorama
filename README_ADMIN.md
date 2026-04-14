# Admin Panel Instructions

An Admin Panel has been added to the project to allow easy management of product prices.

## How to Access
1. Open `admin.html` in your browser.
2. Login with the password: `admin123`.

## Features
- **Dashboard**: View all current products and their prices.
- **Edit Prices**: Click the "Editar" button on any product to update its price.
- **Live Updates**: Changes are saved immediately and will be reflected on the main `index.html` page (refresh required on the main page).
- **Security Check**: The admin panel uses basic session storage authentication.

## Technical Details
- **Data Source**: `js/products.js` serves as the single source of truth for product data.
- **Persistence**: Price overrides are stored in the browser's `localStorage` (key: `modelorama_prices`).
- **Files**:
    - `admin.html`: The interface.
    - `js/admin.js`: Logic for the admin panel.
    - `js/products.js`: Shared data.
