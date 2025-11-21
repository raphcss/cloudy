# Panel Vue.js

Panel web pour la gestion du bot de modération Discord.

## Installation

```bash
npm install
```

## Développement

```bash
npm run serve
```

Le panel sera accessible sur `http://localhost:8080`

## Build de production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## Configuration

Créez un fichier `.env` basé sur `.env.example` et configurez l'URL de l'API.

## Structure

- `src/views/` - Pages de l'application
- `src/components/` - Composants réutilisables
- `src/stores/` - Stores Pinia (state management)
- `src/services/` - Services (API, etc.)
- `src/router/` - Configuration des routes
