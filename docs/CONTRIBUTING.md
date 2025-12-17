# Contributing to Nodi

## Code of Conduct

Be respectful and constructive. Focus on improving the project.

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Provide clear reproduction steps
3. Include browser version and OS
4. Attach console logs if relevant

### Suggesting Features

1. Search existing issues and discussions
2. Describe the use case clearly
3. Explain why it fits the project scope

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with clear commit messages
4. Test thoroughly in Firefox/Zen Browser
5. Submit PR with description of changes

## Development Setup

```bash
git clone https://github.com/Kabe-Innovates/unNamed.git
cd unNamed
npm install
npm run build
```

Load the extension in Firefox (`about:debugging`) to test.

## Code Standards

- TypeScript for all source code
- Follow existing code style
- Add comments for complex logic
- Update docs if changing behavior

## Testing

- Test all changes in Firefox and Zen Browser
- Verify geolocation features work correctly
- Check that settings persist across sessions
- Ensure no console errors

## Questions?

Open an issue for discussion before starting major changes.
