# 📄 Factures de Test pour ComptaPilot

Ce dossier contient **5 factures de test** pour tester toutes les fonctionnalités de ComptaPilot.

---

## 📋 Liste des factures

### 1️⃣ **Facture Achat - Fournitures** (01-facture-achat-fournitures.html)
- **Type:** FACTURE_ACHAT (Dépense 💸)
- **Montant:** 1 560,00 € TTC
- **TVA:** 260,00 €
- **Catégorie attendue:** 6064 - Fournitures matériel informatique
- **Fournisseur:** BUREAU EXPRESS

### 2️⃣ **Facture Vente - Client** (02-facture-vente-client.html)
- **Type:** FACTURE_VENTE (Revenu 💰)
- **Montant:** 4 800,00 € TTC
- **TVA:** 800,00 €
- **Catégorie attendue:** 411 - Clients
- **Client:** Société ABC SARL
- **Prestations:** Développement web + SEO + Formation

### 3️⃣ **Note de Frais - Restaurant** (03-note-frais-restaurant.html)
- **Type:** NOTE_FRAIS (Dépense 💸)
- **Montant:** 139,15 € TTC
- **TVA:** 12,65 € (TVA 10% restauration)
- **Catégorie attendue:** 6257 - Réceptions
- **Contexte:** Repas d'affaires avec client

### 4️⃣ **Facture Loyer Bureau** (04-facture-loyer-bureau.html)
- **Type:** FACTURE_ACHAT (Dépense 💸)
- **Montant:** 1 890,00 € TTC
- **TVA:** 315,00 €
- **Catégorie attendue:** 613 - Locations
- **Fournisseur:** IMMOBILIÈRE DES BUREAUX
- **Période:** Avril 2024

### 5️⃣ **Reçu Carburant** (05-recu-carburant.html)
- **Type:** RECU (Dépense 💸)
- **Montant:** 82,21 € TTC
- **TVA:** 13,70 €
- **Catégorie attendue:** 6061 - Carburant
- **Station:** TOTAL - Autoroute A6

---

## 🔄 Comment convertir en PDF ?

### Méthode 1 : Avec Chrome/Edge (RECOMMANDÉ)
1. Double-cliquez sur le fichier HTML
2. Appuyez sur **Ctrl+P**
3. Destination : **"Enregistrer au format PDF"**
4. Cliquez sur **Enregistrer**

### Méthode 2 : PowerShell (automatique)
```powershell
# Convertir TOUS les fichiers HTML en PDF d'un coup
$files = Get-ChildItem *.html
foreach ($file in $files) {
    $pdfName = $file.BaseName + ".pdf"
    & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --print-to-pdf="$pdfName" $file.FullName
}
```

---

## 🧪 Scénario de test complet

### Étape 1 : Convertir tous les HTML en PDF
Utilise une des méthodes ci-dessus

### Étape 2 : Tester l'upload
1. Va sur http://localhost:3000/dashboard
2. Onglet **"📤 Uploader une facture"**
3. Upload les 5 PDF un par un

### Étape 3 : Vérifier le Dashboard
Va dans **"📊 Tableau de bord"**
- **Revenus:** Devrait afficher 4 800,00 € (facture vente)
- **Dépenses:** Devrait afficher 3 671,36 € (total des 4 factures d'achat)
- **TVA:** Devrait afficher le total des TVA
- **Solde:** 4 800 - 3 671,36 = 1 128,64 €

### Étape 4 : Voir les détails
Va dans **"📄 Mes factures"**
- Tu verras les 5 factures listées
- Clique sur chacune pour voir les détails
- Vérifie que l'IA a bien catégorisé

### Étape 5 : Tester le Chat IA
Va dans **"💬 Chat IA"**

Exemples de questions :
- "Explique-moi ma facture de loyer"
- "Est-ce que je peux déduire mes frais de restaurant ?"
- "Comment comptabiliser mon carburant ?"
- "Quelle est la différence entre HT et TTC ?"

---

## 🎯 Résultats attendus

### Dashboard après upload des 5 factures :

| Indicateur | Valeur attendue |
|------------|-----------------|
| 💰 Revenus | 4 800,00 € |
| 💸 Dépenses | 3 671,36 € |
| 🏛️ TVA | 601,35 € |
| 💵 Solde | +1 128,64 € |

### Types détectés par l'IA :

✅ Facture achat → Catégorie 6064  
✅ Facture vente → Catégorie 411  
✅ Note de frais → Catégorie 6257  
✅ Loyer → Catégorie 613  
✅ Carburant → Catégorie 6061  

---

## 💡 Conseils

- **Upload dans l'ordre** : Ça te permettra de voir le dashboard se remplir progressivement
- **Vérifie chaque analyse** : L'IA OpenAI devrait correctement identifier chaque type
- **Teste le chat** : Pose des questions sur tes factures uploadées
- **Regarde l'évolution** : Le graphique mensuel se mettra à jour

---

**Bon test ! 🚀**

