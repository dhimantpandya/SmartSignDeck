# STANDARDS

## Project Branch Naming Conventions

To maintain a clear and consistent branch structure, we follow a specific naming pattern for our Git branches. This ensures that all team members can easily understand the purpose of each branch. Please adhere to the following branch naming conventions:

## Branch Naming Pattern

Branches should be named according to the type of work being done. The allowed branch names must follow one of these patterns:

- `master`
- `develop`
- `feature/<branch-name>`
- `fix/<branch-name>`
- `hotfix/<branch-name>`
- `release/<branch-name>`

#### Examples

- For a new feature: `feature/add-login-page`
- For a bug fix: `fix/button-alignment`
- For a hotfix: `hotfix/urgent-fix`
- For a release: `release/v1.0.0`

## Commit Message Format Guide

To ensure clear and consistent commit messages, we use `@commitlint/config-conventional` in this project. Follow these guidelines when writing commit messages:

### Commit Message Format

Each commit message should follow this format:

```
<type>(<scope>): <subject>
```

#### Example Commit Messages

- `feat(auth): add login functionality`
- `fix(ui): update button styles`
- `docs: update README with usage instructions`

#### Commit Types

Choose a type that best describes the changes:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: Code changes that neither fix a bug nor add a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

#### Commit Scope

Specify the scope of the commit within parentheses after the type (e.g., `feat(auth): add login form`). Use a scope to indicate the affected module, component, or feature.

#### Commit Subject

Write a concise and descriptive subject for the commit. Use the imperative mood (e.g., "add", "fix", "update") and limit the subject to 50 characters.

### Using Commitlint

Commitlint enforces these rules automatically to ensure consistent commit messages throughout the project. Non-compliant commit messages will result in a failed commit.

### Further Reading

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)

By following these guidelines, you can maintain a clear and structured commit history that enhances collaboration and understanding among team members.

## Code Standards

- **Prefer named exports throughout the project for better code readability and maintainability.**

- **When creating a new route, mention its path in `utilities/routes.ts` to maintain a centralized location for route definitions.**

- **We recommend sticking to only one package manager once you start the project for consistency.**

- **If you add a new variable to .env, ensure it is also added to .env.example and README.md for consistency.**

- **Stick to using only one package manager across the team for consistency.
