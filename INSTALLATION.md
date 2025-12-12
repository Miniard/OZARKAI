# 🚀 Guide d'Installation Komptal

Guide pas à pas pour installer et configurer Komptal sur votre machine locale.

---

## ⚡ Installation Rapide (5 minutes)

### 1. Prérequis

Assurez-vous d'avoir installé :
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### 2. Cloner le projet

```bash
git clone https://github.com/votre-repo/komptal.git
cd komptal
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer les variables d'environnement

Copiez le fichier d'exemple :

```bash
# Linux/Mac
cp .env.local.example .env.local

# Windows
copy .env.local.example .env.local
```

Éditez `.env.local` et configurez au minimum :

```bash
# Base de données (adapter selon votre config PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/komptal?schema=public"

# Secret NextAuth (générer avec la commande ci-dessous)
NEXTAUTH_SECRET="votre-secret-ici"

# API OpenAI (créer une clé sur https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-..."
```

**Générer un secret NextAuth :**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 5. Créer la base de données

**Sur Linux/Mac :**
```bash
createdb komptal
```

**Sur Windows (PowerShell) :**
```powershell
# Option 1 : Commande directe
psql -U postgres -c "CREATE DATABASE komptal;"

# Option 2 : Avec psql interactif
psql -U postgres
# Puis dans psql :
CREATE DATABASE komptal;
\q
```

**Avec pgAdmin (Windows/Mac/Linux) :**
1. Ouvrir pgAdmin
2. Clic droit sur "Databases"
3. Create > Database
4. Nom : `komptal`
5. Cliquer "Save"

**Avec Docker (recommandé) :**
```bash
docker-compose up -d postgres
# La base sera créée automatiquement
```

### 6. Initialiser la base de données

```bash
npx prisma db push
```

### 7. Lancer l'application

```bash
npm run dev
```

Ouvrez **http://localhost:3000** dans votre navigateur ! 🎉

---

## 🔧 Configuration Avancée

### S3 / Cloudflare R2 (Upload de fichiers)

Pour activer l'upload de documents :

1. Créez un bucket S3 ou R2
2. Obtenez vos clés d'accès
3. Ajoutez dans `.env.local` :

```bash
S3_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET_NAME="komptal-documents"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
```

### Clé de chiffrement

Générez une clé pour chiffrer les données sensibles :

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Ajoutez dans `.env.local` :

```bash
ENCRYPTION_KEY="votre-cle-de-32-caracteres-hexadecimal"
```

### Ollama (Modèle IA local - optionnel)

Pour utiliser un modèle local au lieu d'OpenAI :

**Option 1 : Avec Docker (recommandé)**

```bash
# Lancer PostgreSQL et Ollama
docker-compose up -d postgres ollama

# Installer le modèle Mistral 7B
chmod +x docker/ollama-setup.sh
./docker/ollama-setup.sh
```

**Option 2 : Installation manuelle Ollama**

1. Installez Ollama : https://ollama.ai/download
2. Téléchargez le modèle :

```bash
ollama pull mistral:7b
```

3. Activez dans `.env.local` :

```bash
OLLAMA_URL="http://localhost:11434"
USE_LOCAL_MODEL="true"
```

---

## 🐳 Installation avec Docker (tout-en-un)

### 1. Lancer tous les services

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL (port 5432)
- Ollama (port 11434)

### 2. Installer le modèle Ollama

```bash
./docker/ollama-setup.sh
```

### 3. Lancer l'app en développement

```bash
npm run dev
```

---

## 📊 Vérification de l'Installation

### Tester la base de données

```bash
npx prisma studio
```

Ouvre une interface graphique pour explorer la base de données.

### Tester Ollama (si installé)

```bash
# Avec Docker
docker exec -it komptal-ollama ollama run mistral:7b "Bonjour, comment vas-tu?"

# Sans Docker
ollama run mistral:7b "Bonjour, comment vas-tu?"
```

### Tester l'API OpenAI

Créez un fichier de test `test-openai.js` :

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Test' }],
});

console.log(response.choices[0].message.content);
```

```bash
node test-openai.js
```

---

## 🚨 Problèmes Courants

### Erreur : "Cannot connect to database"

**Solution :**

1. Vérifiez que PostgreSQL est lancé
2. Vérifiez `DATABASE_URL` dans `.env.local`
3. Testez la connexion :

```bash
psql postgresql://user:password@localhost:5432/komptal
```

### Erreur : "Prisma schema not found"

**Solution :**

```bash
npx prisma generate
```

### Erreur : "NEXTAUTH_SECRET missing"

**Solution :**

Générez et ajoutez un secret dans `.env.local` :

```bash
openssl rand -base64 32
```

### Port 3000 déjà utilisé

**Solution :**

Changez le port dans `package.json` :

```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

### Ollama ne démarre pas

**Solution :**

Si vous n'avez pas de GPU NVIDIA, éditez `docker-compose.yml` et commentez la section `deploy` :

```yaml
ollama:
  # deploy:
  #   resources:
  #     reservations:
  #       devices:
  #         - driver: nvidia
```

---

## 📝 Prochaines Étapes

1. ✅ Installation terminée
2. 🎨 Personnalisez l'interface dans `src/app/`
3. 🔐 Configurez S3 pour l'upload de documents
4. 🤖 Testez l'analyse de factures
5. 💬 Essayez le chat IA
6. 🚀 Déployez en production

---

## 🆘 Besoin d'Aide ?

- 📖 Consultez le [README.md](README.md)
- 🐛 Ouvrez une [issue GitHub](https://github.com/votre-repo/komptal/issues)
- 💬 Discord : [lien vers serveur]
- 📧 Email : contact@komptal.fr

---

**Bon développement ! 🎉**

