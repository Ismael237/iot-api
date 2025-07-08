# Middlewares d'Authentification

Ce dossier contient les middlewares d'authentification pour l'API IoT. Les middlewares utilisent JWT (JSON Web Tokens) pour l'authentification et offrent différentes déclinaisons selon les besoins.

## Middlewares Disponibles

### 1. `authenticate`
Middleware d'authentification de base qui vérifie la présence et la validité du token JWT.

```typescript
import { authenticate } from '../middleware/auth.middleware';

app.get('/protected', { onRequest: [authenticate] }, async (req, reply) => {
  // L'utilisateur est authentifié
  const userId = req.user.userId;
  const role = req.user.role;
});
```

### 2. `authenticateAdmin`
Middleware pour les routes accessibles uniquement aux administrateurs.

```typescript
import { authenticateAdmin } from '../middleware/auth.middleware';

app.get('/admin/users', { onRequest: [authenticateAdmin] }, async (req, reply) => {
  // Seuls les admins peuvent accéder
});
```

### 3. `authenticateRole(role)`
Middleware pour les routes nécessitant un rôle spécifique.

```typescript
import { authenticateRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';

app.get('/admin-only', { onRequest: [authenticateRole(UserRole.ADMIN)] }, async (req, reply) => {
  // Seuls les utilisateurs avec le rôle ADMIN peuvent accéder
});
```

### 4. `authenticateAnyRole(roles[])`
Middleware pour les routes accessibles aux utilisateurs ayant au moins un des rôles spécifiés.

```typescript
import { authenticateAnyRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/common.types';

app.get('/sensors', { onRequest: [authenticateAnyRole([UserRole.ADMIN, UserRole.USER])] }, async (req, reply) => {
  // Accessible aux admins et utilisateurs
});
```

### 5. `authenticateOptional`
Middleware d'authentification optionnelle. Ne bloque pas la requête si pas de token, mais ajoute les infos utilisateur si présent.

```typescript
import { authenticateOptional } from '../middleware/auth.middleware';

app.get('/public-data', { onRequest: [authenticateOptional] }, async (req, reply) => {
  if (req.user) {
    // Utilisateur authentifié
  } else {
    // Utilisateur anonyme
  }
});
```

### 6. `authenticateOwnership(getOwnerId)`
Middleware pour vérifier la propriété d'une ressource. L'utilisateur doit être le propriétaire OU avoir le rôle admin.

```typescript
import { authenticateOwnership } from '../middleware/auth.middleware';

app.get('/users/:id', { 
  onRequest: [authenticateOwnership(async (req) => {
    const userId = parseInt(req.params.id);
    return isNaN(userId) ? null : userId;
  })]
}, async (req, reply) => {
  // L'utilisateur peut voir son propre profil ou les admins peuvent voir tous les profils
});
```

### 7. `refreshToken`
Middleware pour rafraîchir un token d'accès.

```typescript
import { refreshToken } from '../middleware/auth.middleware';

app.post('/auth/refresh', async (req, reply) => {
  await refreshToken(req, reply);
});
```

## Extraction des Tokens

Les middlewares supportent plusieurs méthodes d'extraction des tokens :

1. **Header Authorization** : `Authorization: Bearer <token>`
2. **Cookies** : `accessToken` et `refreshToken`
3. **Paramètres de requête** : `?token=<token>`
4. **Body de requête** : `{ "refreshToken": "<token>" }`

## Gestion des Erreurs

Les middlewares retournent des réponses d'erreur standardisées :

- **401 Unauthorized** : Token manquant, invalide ou expiré
- **403 Forbidden** : Permissions insuffisantes
- **404 Not Found** : Ressource non trouvée (pour `authenticateOwnership`)
- **500 Internal Server Error** : Erreur serveur

## Exemples d'Utilisation

### Route Publique
```typescript
app.get('/public', async (req, reply) => {
  // Pas d'authentification requise
});
```

### Route Authentifiée Simple
```typescript
app.get('/protected', { onRequest: [authenticate] }, async (req, reply) => {
  // Utilisateur authentifié requis
});
```

### Route Admin Seulement
```typescript
app.get('/admin', { onRequest: [authenticateAdmin] }, async (req, reply) => {
  // Admin seulement
});
```

### Route avec Rôle Spécifique
```typescript
app.get('/user-only', { onRequest: [authenticateRole(UserRole.USER)] }, async (req, reply) => {
  // Utilisateurs seulement
});
```

### Route avec Authentification Optionnelle
```typescript
app.get('/optional-auth', { onRequest: [authenticateOptional] }, async (req, reply) => {
  if (req.user) {
    // Utilisateur connecté
  } else {
    // Utilisateur anonyme
  }
});
```

### Route avec Vérification de Propriété
```typescript
app.get('/my-devices/:id', { 
  onRequest: [authenticateOwnership(async (req) => {
    const deviceId = parseInt(req.params.id);
    // Retourner l'ID du propriétaire du device
    return await getDeviceOwnerId(deviceId);
  })]
}, async (req, reply) => {
  // L'utilisateur peut voir ses propres devices ou les admins peuvent voir tous
});
```

## Configuration

Les middlewares utilisent la configuration JWT définie dans `src/config/index.ts` :

- `JWT_SECRET` : Clé secrète pour signer les tokens
- `JWT_ACCESS_EXPIRES` : Durée de vie des tokens d'accès
- `JWT_REFRESH_EXPIRES` : Durée de vie des refresh tokens

## Sécurité

- Les tokens sont vérifiés à chaque requête
- Les refresh tokens sont stockés dans des cookies httpOnly
- Les tokens d'accès sont transmis via le header Authorization
- Les erreurs d'authentification ne révèlent pas d'informations sensibles 