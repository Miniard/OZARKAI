# 🤖 ComptaPilot

**IA comptable intelligente pour TPE et cabinets comptables**

ComptaPilot est une application web complète qui utilise l'intelligence artificielle pour simplifier la comptabilité des TPE. Upload de factures, analyse automatique, chat avec un expert-comptable virtuel, et tableau de bord financier intuitif.

---

## 🎯 Fonctionnalités

### ✨ Pour TPE
- **📄 Upload & Analyse automatique** : Uploadez vos factures/reçus, l'IA extrait et catégorise automatiquement les informations
- **💬 Chat comptable IA** : Posez vos questions en français simple à votre expert-comptable virtuel 24/7
- **📊 Dashboard financier** : Visualisez revenus, dépenses, TVA estimée avec des graphiques clairs
- **🔒 100% sécurisé** : Anonymisation des données sensibles avant envoi à l'IA

### 🏢 Pour cabinets comptables
- Gestion multi-dossiers clients
- Assistant IA pour collaborateurs
- Validation et export des écritures

---

## 🏗️ Architecture

```
ComptaPilot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Pages dashboard
│   │   └── ...
│   ├── components/            # Composants React
│   ├── lib/                   # Logique métier
│   │   ├── ai/               # IA (OpenAI + Ollama)
│   │   ├── db/               # Database (Prisma)
│   │   ├── security/         # Sécurité & encryption
│   │   └── upload/           # Upload S3
│   └── types/                # Types TypeScript
├── prisma/                   # Schéma DB
├── docker/                   # Docker configs
└── README.md
```

---

## 🔧 Stack Technique

| Layer | Technologie |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS |
| **Backend** | Next.js API Routes, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js v5 |
| **Storage** | S3-compatible (AWS S3 / Cloudflare R2) |
| **IA** | OpenAI API + Ollama (Mistral 7B local) |
| **Security** | bcrypt, rate-limit, sanitization |

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+ (ou Docker)
- Docker & Docker Compose (optionnel, pour Ollama)
- Compte OpenAI (API key)
- Compte S3 / Cloudflare R2 (optionnel)

**👉 Utilisateurs Windows** : Consultez [WINDOWS-SETUP.md](WINDOWS-SETUP.md) pour un guide détaillé

### 1. Cloner le repository

```bash
git clone https://github.com/votre-repo/comptapilot.git
cd comptapilot
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine :

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/comptapilot?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-aleatoire-32-caracteres"

# OpenAI
OPENAI_API_KEY="sk-..."

# Ollama (modèle local - optionnel)
OLLAMA_URL="http://localhost:11434"
USE_LOCAL_MODEL="false"

# S3 / Cloudflare R2
S3_ENDPOINT="https://..."
S3_REGION="auto"
S3_BUCKET_NAME="comptapilot-documents"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."

# Encryption
ENCRYPTION_KEY="votre-cle-de-chiffrement-32-caracteres"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"
```

### 4. Générer la clé NextAuth

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 5. Configurer la base de données

```bash
# Créer la base de données et les tables
npx prisma db push

# Ou avec migrations
npx prisma migrate dev
```

### 6. (Optionnel) Configurer Ollama pour modèle local

Lancer PostgreSQL et Ollama avec Docker :

```bash
docker-compose up -d postgres ollama
```

Installer le modèle Mistral 7B :

```bash
chmod +x docker/ollama-setup.sh
./docker/ollama-setup.sh
```

Activer le modèle local dans `.env.local` :

```bash
USE_LOCAL_MODEL="true"
```

### 7. Lancer l'application

```bash
npm run dev
```

L'application est disponible sur **http://localhost:3000**

---

## 📝 Utilisation

### Première connexion

1. Accédez à http://localhost:3000
2. Cliquez sur "Créer un compte"
3. Remplissez le formulaire d'inscription
4. Connectez-vous avec vos identifiants

### Upload de documents

1. Allez dans l'onglet "Uploader"
2. Glissez-déposez ou sélectionnez votre facture (PDF, JPG, PNG)
3. L'IA analyse automatiquement le document
4. Les données sont extraites et catégorisées

### Chat avec l'IA

1. Cliquez sur l'onglet "Chat IA"
2. Posez votre question en français
3. L'expert-comptable IA répond instantanément

### Dashboard

Le tableau de bord affiche :
- Revenus et dépenses
- TVA estimée
- Solde actuel
- Graphiques mensuels
- Liste des documents récents

---

## 🔐 Sécurité

ComptaPilot implémente plusieurs couches de sécurité :

### Anonymisation des données

**Avant** envoi à l'API OpenAI, toutes les données sensibles sont anonymisées :
- SIRET/SIREN → `SIRET_001`
- IBAN → `IBAN_001`
- Adresses → `ADDR_001`
- Emails → `EMAIL_001`
- Noms propres → `NOM_001`

Voir `src/lib/ai/sanitize.ts` pour l'implémentation.

### Chiffrement

- Mots de passe : bcrypt avec 12 rounds
- Données sensibles en DB : AES-256-GCM
- Communication : HTTPS en production

### Rate Limiting

- Max 100 requêtes par 15 minutes par IP
- Protection contre les abus

### Upload sécurisé

- URLs présignées S3 (valides 5 minutes)
- Validation stricte des types de fichiers
- Limite de taille : 10 MB

---

## 🧪 Tests

```bash
# Lancer les tests (à implémenter)
npm test

# Vérifier les types TypeScript
npx tsc --noEmit
```

---

## 🚢 Déploiement en Production

### Option 1 : Vercel (recommandé pour Next.js)

1. Pushez votre code sur GitHub
2. Importez le projet sur [Vercel](https://vercel.com)
3. Configurez les variables d'environnement
4. Déployez !

### Option 2 : Docker

```bash
# Build l'image
docker build -t comptapilot .

# Lancer avec docker-compose (inclut PostgreSQL)
docker-compose up -d
```

---

## 📊 Base de données

### Modèles principaux

- **User** : Utilisateurs (TPE ou cabinet)
- **Company** : Entreprises
- **Document** : Factures uploadées
- **Entry** : Écritures comptables
- **Conversation** : Historique de chat IA

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer en production
npx prisma migrate deploy

# Ouvrir Prisma Studio (GUI)
npx prisma studio
```

---

## 🤖 IA et Modèles

### OpenAI (défaut)

Utilise GPT-4o-mini pour :
- Analyse de documents
- Chat comptable
- Extraction OCR

### Ollama (local - optionnel)

Utilise Mistral 7B pour :
- Analyses simples (catégorisation)
- Alternative gratuite et privée
- Nécessite GPU recommandé

Activer dans `.env.local` :
```bash
USE_LOCAL_MODEL="true"
```

---

## 🛠️ Scripts utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm run start

# Database
npm run db:push      # Sync schema
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio

# Linting
npm run lint
```

---

## 📚 Documentation API

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/register` | POST | Inscription |
| `/api/auth/[...nextauth]` | GET/POST | Authentification |
| `/api/upload` | POST | Générer URL upload |
| `/api/analyze` | POST | Analyser un document |
| `/api/chat` | POST | Chat avec l'IA |
| `/api/dashboard` | GET | Données dashboard |
| `/api/companies` | GET | Liste des entreprises |

### Exemple : Upload + Analyse

```typescript
// 1. Demander une URL présignée
const uploadRes = await fetch('/api/upload', {
  method: 'POST',
  body: JSON.stringify({
    filename: 'facture.pdf',
    fileType: 'application/pdf',
    fileSize: 123456,
    companyId: 'xxx',
  }),
});
const { uploadUrl, documentId } = await uploadRes.json();

// 2. Upload direct vers S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
});

// 3. Déclencher l'analyse
await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ documentId }),
});
```

---

## 🐛 Troubleshooting

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est lancé
docker ps | grep postgres

# Relancer PostgreSQL
docker-compose up -d postgres
```

### Ollama ne répond pas

```bash
# Vérifier le statut
docker logs comptapilot-ollama

# Redémarrer
docker-compose restart ollama

# Réinstaller le modèle
docker exec comptapilot-ollama ollama pull mistral:7b
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
npx prisma generate

# Reset la base (⚠️ supprime les données)
npx prisma migrate reset
```

---

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request.

---

## 📧 Contact

Pour toute question : contact@comptapilot.fr

---

**Fait avec ❤️ pour simplifier la comptabilité des TPE françaises**

