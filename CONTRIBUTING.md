# Contributing to OpenFishh

Thanks for your interest in contributing! OpenFishh is an open-source collective intelligence platform, and we welcome contributions of all kinds.

## Quick Start

```bash
git clone https://github.com/MohdTalib0/OpenFishh.git
cd OpenFishh

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd ../frontend && npm install && npm run dev
```

## How to Contribute

### Reporting Bugs
- Use the [Bug Report](https://github.com/MohdTalib0/OpenFishh/issues/new?template=bug_report.md) template
- Include steps to reproduce, expected vs actual behavior, and your environment

### Suggesting Features
- Use the [Feature Request](https://github.com/MohdTalib0/OpenFishh/issues/new?template=feature_request.md) template
- Describe the problem you're solving, not just the solution

### Submitting Code

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test: `cd frontend && npm run build` (must pass)
5. Commit with a clear message
6. Push and open a Pull Request

### What We're Looking For

- **New intelligence beats** -- add RSS feeds for new topic areas
- **Epistemic framework improvements** -- better confidence decomposition, new claim types
- **Frontend polish** -- mobile UX, accessibility, animations
- **Search providers** -- integrate new search engines beyond DuckDuckGo
- **Documentation** -- guides, tutorials, translations
- **Bug fixes** -- always welcome

## Code Style

- **Python**: Follow existing patterns. No type stubs needed, but docstrings on public functions.
- **React**: Inline styles (project convention). Functional components with hooks.
- **Commits**: Clear, concise messages. One logical change per commit.

## Community

- [Discord](https://discord.gg/jMwfepkD) -- ask questions, discuss ideas
- [Issues](https://github.com/MohdTalib0/OpenFishh/issues) -- bugs and features

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
