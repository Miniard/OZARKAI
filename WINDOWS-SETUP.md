# 🪟 Installation Windows - Komptal

Guide spécifique pour Windows 10/11

---

## ⚡ Installation Rapide Windows

### 1. Prérequis

**Installer dans cet ordre :**

1. **Node.js 18+** : https://nodejs.org/
   - Télécharger "LTS" (recommandé)
   - Cocher "Automatically install necessary tools"

2. **PostgreSQL 14+** : https://www.postgresql.org/download/windows/
   - Télécharger l'installeur
   - Pendant l'installation, noter le mot de passe `postgres`
   - Installer pgAdmin (inclus par défaut)

3. **Git** : https://git-scm.com/download/win
   - Installer avec les options par défaut

### 2. Cloner le projet

```powershell
# Ouvrir PowerShell ou Windows Terminal
cd Desktop
git clone https://github.com/votre-repo/komptal.git
cd komptal
```

### 3. Installer les dépendances

```powershell
npm install
```

⏱️ Cela prend 2-3 minutes

### 4. Créer le fichier .env.local

```powershell
# Copier le template
copy .env.local.example .env.local

# Éditer avec Notepad
notepad .env.local
```

**Configuration minimale :**

```env
# Adapter avec votre mot de passe PostgreSQL
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/komptal?schema=public"

# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"

# Clé OpenAI
OPENAI_API_KEY="sk-..."

# Clé de chiffrement - Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="votre-cle-de-chiffrement"
```

**Générer les secrets :**

```powershell
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Créer la base de données PostgreSQL

**Option A : Avec pgAdmin (Interface graphique - RECOMMANDÉ)**

1. Ouvrir **pgAdmin** depuis le menu Démarrer
2. Entrer le mot de passe `postgres`
3. Dans le panneau gauche : Clic droit sur "Databases"
4. Sélectionner "Create" > "Database..."
5. Nom : `komptal`
6. Cliquer "Save"

**Option B : Avec PowerShell**

```powershell
# Se connecter à PostgreSQL (entrer le mot de passe quand demandé)
psql -U postgres

# Dans psql, taper :
CREATE DATABASE komptal;
\q
```

**Option C : Une ligne PowerShell**

```powershell
psql -U postgres -c "CREATE DATABASE komptal;"
# Entrer le mot de passe quand demandé
```

### 6. Initialiser Prisma

```powershell
npx prisma db push
```

✅ Vous devriez voir : "Database is now in sync with schema"

### 7. Lancer l'application

```powershell
npm run dev
```

🎉 **Ouvrir http://localhost:3000**

---

## 🐳 Alternative : Docker Desktop (Plus Simple)

Si vous voulez éviter d'installer PostgreSQL :

### 1. Installer Docker Desktop

https://www.docker.com/products/docker-desktop/

### 2. Lancer PostgreSQL

```powershell
# Dans le dossier komptal
docker-compose up -d postgres
```

### 3. Utiliser cette DATABASE_URL

```env
DATABASE_URL="postgresql://komptal:komptal_password@localhost:5432/komptal?schema=public"
```

### 4. Continuer normalement

```powershell
npx prisma db push
npm run dev
```

---

## 🔧 Problèmes Courants Windows

### ❌ "psql n'est pas reconnu"

**Solution :** Ajouter PostgreSQL au PATH

1. Chercher "Variables d'environnement" dans Windows
2. Cliquer "Variables d'environnement"
3. Dans "Variables système", trouver "Path"
4. Cliquer "Modifier"
5. Ajouter : `C:\Program Files\PostgreSQL\15\bin` (adapter la version)
6. Redémarrer PowerShell

**Ou utiliser le chemin complet :**

```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

### ❌ "Cannot connect to database"

**Vérifier que PostgreSQL est lancé :**

1. Ouvrir "Services" (services.msc)
2. Chercher "postgresql-x64-15" (ou votre version)
3. Vérifier qu'il est "En cours d'exécution"
4. Si non, clic droit > Démarrer

**Ou en PowerShell (admin) :**

```powershell
Get-Service -Name "postgresql*"
Start-Service "postgresql-x64-15"
```

### ❌ "Port 3000 already in use"

```powershell
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# Ou utiliser un autre port
npm run dev -- -p 3001
```

### ❌ Erreur "Cannot find module"

```powershell
# Supprimer et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 📝 Commandes PowerShell Utiles

```powershell
# Vérifier Node.js
node --version

# Vérifier npm
npm --version

# Vérifier PostgreSQL
psql --version

# Voir les services PostgreSQL
Get-Service postgresql*

# Lancer PostgreSQL
Start-Service postgresql-x64-15

# Arrêter PostgreSQL
Stop-Service postgresql-x64-15

# Ouvrir Prisma Studio
npx prisma studio

# Build production
npm run build
npm run start
```

---

## 🎯 Checklist Installation Windows

- [ ] Node.js 18+ installé
- [ ] PostgreSQL 14+ installé
- [ ] Git installé
- [ ] Projet cloné
- [ ] `npm install` exécuté
- [ ] `.env.local` créé et configuré
- [ ] Base de données `komptal` créée
- [ ] `npx prisma db push` exécuté avec succès
- [ ] `npm run dev` lance l'app
- [ ] http://localhost:3000 accessible

---

## 🆘 Besoin d'Aide ?

**Si vous êtes bloqué :**

1. Vérifier les logs d'erreur dans PowerShell
2. Consulter [INSTALLATION.md](INSTALLATION.md) pour plus de détails
3. Utiliser Docker Desktop (plus simple)
4. Ouvrir une issue GitHub

---

**Windows Tips :**
- Utiliser **Windows Terminal** pour une meilleure expérience
- Exécuter PowerShell en tant qu'administrateur si nécessaire
- pgAdmin est votre ami pour gérer PostgreSQL visuellement

---

**Bon développement sur Windows ! 🚀**

