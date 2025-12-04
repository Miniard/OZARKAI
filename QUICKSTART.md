# ⚡ QuickStart ComptaPilot

Démarrage rapide en 5 minutes !

---

## 🚀 Installation Express

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env.local
cp .env.local.example .env.local

# 3. Éditer .env.local avec vos clés
# Minimum requis :
#   - DATABASE_URL (PostgreSQL)
#   - NEXTAUTH_SECRET (générer avec : openssl rand -base64 32)
#   - OPENAI_API_KEY (obtenir sur https://platform.openai.com)

# 4. Créer la base de données

# Sur Linux/Mac :
createdb comptapilot

# Sur Windows (PowerShell) - RECOMMANDÉ :
psql -U postgres -c "CREATE DATABASE comptapilot;"

# Ou avec pgAdmin (interface graphique) :
# 1. Ouvrir pgAdmin
# 2. Clic droit sur "Databases" > Create > Database
# 3. Nom : comptapilot

# Ou avec Docker :
docker-compose up -d postgres

# 5. Initialiser le schéma
npx prisma db push

# 6. Lancer l'app
npm run dev
```

**➡️ Ouvrir http://localhost:3000**

---

## 📋 Checklist Configuration

- [ ] Node.js 18+ installé
- [ ] PostgreSQL installé et lancé
- [ ] `.env.local` créé et configuré
- [ ] Base de données `comptapilot` créée
- [ ] Prisma initialisé (`npx prisma db push`)
- [ ] Application lancée (`npm run dev`)

---

## 🔑 Variables d'Environnement Essentielles

```bash
# Dans .env.local

# 1. Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/comptapilot?schema=public"

# 2. NextAuth secret (générer avec : openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-de-32-caracteres"

# 3. OpenAI API Key (obtenir sur https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-..."

# 4. Clé de chiffrement (générer avec : openssl rand -hex 32)
ENCRYPTION_KEY="votre-cle-de-chiffrement-32-caracteres"
```

---

## 🎯 Premier Pas sur l'Application

### 1. Créer un compte

```
http://localhost:3000/register

- Nom : Jean Dupont
- Email : jean@exemple.fr
- Mot de passe : minimum 8 caractères
- Nom entreprise : Ma TPE (optionnel)
```

### 2. Se connecter

```
http://localhost:3000/login

- Email : jean@exemple.fr
- Mot de passe : ***
```

### 3. Tester les fonctionnalités

✅ **Dashboard** : Visualiser les KPI financiers  
✅ **Upload** : Télécharger une facture test  
✅ **Chat IA** : Poser une question comptable  

---

## 🐳 Alternative : Docker (avec PostgreSQL + Ollama)

```bash
# Lancer PostgreSQL et Ollama
docker-compose up -d

# Installer le modèle local Mistral 7B
chmod +x docker/ollama-setup.sh
./docker/ollama-setup.sh

# Activer le modèle local dans .env.local
USE_LOCAL_MODEL="true"
OLLAMA_URL="http://localhost:11434"

# Lancer l'app
npm run dev
```

---

## 🧪 Tester l'IA

### Test OpenAI

```bash
# Créer un compte test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.fr",
    "password": "password123",
    "name": "Test User",
    "companyName": "Test Company"
  }'
```

### Test Chat IA (après connexion)

Aller sur `/dashboard` → Onglet "Chat IA" → Poser une question :

```
"Comment catégoriser une facture d'achat de fournitures ?"
```

---

## 📚 Commandes Utiles

```bash
# Développement
npm run dev              # Lancer en dev (port 3000)

# Base de données
npx prisma studio        # Interface graphique DB
npx prisma db push       # Sync schema
npx prisma migrate dev   # Créer migration
npx prisma generate      # Régénérer client Prisma

# Docker
docker-compose up -d           # Lancer PostgreSQL + Ollama
docker-compose down            # Arrêter tous les services
docker logs comptapilot-ollama # Voir logs Ollama

# Build production
npm run build            # Builder l'app
npm run start            # Lancer en production
```

---

## 🐛 Problème ? Solutions Rapides

### Port 3000 occupé

```bash
npm run dev -- -p 3001
```

### Prisma ne trouve pas la DB

```bash
npx prisma generate
npx prisma db push
```

### Erreur OpenAI API

Vérifier que `OPENAI_API_KEY` est bien dans `.env.local` et que vous avez des crédits.

### Ollama ne répond pas

```bash
docker restart comptapilot-ollama
docker exec comptapilot-ollama ollama pull mistral:7b
```

---

## 📖 Documentation Complète

- **README.md** : Documentation générale
- **INSTALLATION.md** : Guide d'installation détaillé
- **prisma/schema.prisma** : Schéma de base de données

---

## 🎉 C'est Parti !

Vous êtes prêt à utiliser ComptaPilot !

**Prochaines étapes :**

1. ✅ Créer votre premier compte
2. 📄 Uploader une facture test
3. 💬 Discuter avec l'IA comptable
4. 📊 Explorer le dashboard financier

**Besoin d'aide ?** Consultez [INSTALLATION.md](INSTALLATION.md)

---

**Bon développement ! 🚀**

