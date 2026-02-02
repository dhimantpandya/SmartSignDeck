# STRUCTURE

## Project Structure

### `api/`

- **`api.service.ts`**: Contains services for handling backend API communication using `fetch`.
- **`auth.service.ts`**: Manages authentication-related services like login, registration, and token management.
- **`index.ts`**: Acts as an entry point, exporting modules from the `api` directory.

### `app/`

- **`index.css`**: Global CSS styles for the application.
- **`main.tsx`**: Main entry point for your React application, rendering the root component.
- **`index.tsx`**: Entry point for the apps section of your application.

### `pages/`

- Directory containing different pages of the application:
  - **`apps/`**: Pages related to various apps.
  - **`auth/`**: Authentication-related pages and components.
  - **`dashboard/`**: Pages and components for the main dashboard.
  - **`errors/`**: Error handling pages and components.
  - **`extra-components/`**: Additional reusable components.
  - **`settings/`**: Pages and components for user settings.
  - **`tasks/`**: Pages and components related to task management.

### `components/`

- Reusable UI components used across the application, organized into directories (`custom/`, `ui/`) based on functionality.

### `assets/`

- Contains assets such as images, logos, etc., used in the application.

### `hooks/`

- Custom hooks used for managing state, authentication, localStorage operations, etc.

### `lib/`

- **`utils.ts`**: Utility functions for data manipulation, date formatting, etc.

### `models/`

- **`user.model.ts`**: Defines the structure for user data include the response type.

### `validations/`

- Contains validations schema written using zod.

### `store/`

- **`store.ts`**: Centralized state management setup using `Jotai`.
- **`token.ts`**: Handles token management.

### `utilities/`

- **`routes.ts`**: Defines routes or navigation paths used throughout the application.
