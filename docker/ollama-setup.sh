#!/bin/bash

# Script pour installer et configurer Ollama avec Mistral 7B

echo "🚀 Configuration d'Ollama pour ComptaPilot"
echo "=========================================="

# Démarrer Ollama
echo "1. Démarrage d'Ollama..."
docker-compose up -d ollama

# Attendre qu'Ollama soit prêt
echo "2. Attente du démarrage d'Ollama (30s)..."
sleep 30

# Télécharger le modèle Mistral 7B
echo "3. Téléchargement du modèle Mistral 7B..."
docker exec comptapilot-ollama ollama pull mistral:7b

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "Ollama est maintenant disponible sur http://localhost:11434"
echo "Modèle installé : mistral:7b"
echo ""
echo "Pour tester :"
echo "  docker exec -it comptapilot-ollama ollama run mistral:7b"

