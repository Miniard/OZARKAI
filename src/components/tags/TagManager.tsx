/**
 * Gestionnaire de Tags pour Factures
 * Permet d'ajouter/supprimer des tags personnalisés
 */

'use client';

import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';

export interface TagType {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  documentId: string;
  existingTags: TagType[];
  onTagsUpdate: (tags: TagType[]) => void;
}

const PREDEFINED_TAGS: TagType[] = [
  { id: 'urgent', name: 'Urgent', color: '#E74C3C' },
  { id: 'valider', name: 'À valider', color: '#F39C12' },
  { id: 'deductible', name: 'Déductible', color: '#2ECC71' },
  { id: 'personnel', name: 'Personnel', color: '#9B59B6' },
  { id: 'professionnel', name: 'Professionnel', color: '#3498DB' },
  { id: 'recurrent', name: 'Récurrent', color: '#1ABC9C' },
  { id: 'attente', name: 'En attente', color: '#95A5A6' },
];

export function TagManager({ documentId, existingTags, onTagsUpdate }: TagManagerProps) {
  const [selectedTags, setSelectedTags] = useState<TagType[]>(existingTags);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customTagName, setCustomTagName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addTag = (tag: TagType) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      onTagsUpdate(newTags);
    }
    setShowDropdown(false);
  };

  const removeTag = (tagId: string) => {
    const newTags = selectedTags.filter(t => t.id !== tagId);
    setSelectedTags(newTags);
    onTagsUpdate(newTags);
  };

  const createCustomTag = () => {
    if (customTagName.trim()) {
      const customTag: TagType = {
        id: `custom-${Date.now()}`,
        name: customTagName,
        color: '#7F8C8D'
      };
      addTag(customTag);
      setCustomTagName('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="relative">
      {/* Tags affichés */}
      <div className="flex flex-wrap gap-2 items-center">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white transition-all hover:opacity-80"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Bouton ajouter */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border-2 border-dashed border-gray-400 text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-all"
        >
          <Plus className="w-3 h-3" />
          Ajouter un tag
        </button>
      </div>

      {/* Dropdown des tags */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute z-20 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Tags prédéfinis
              </p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS
                  .filter(tag => !selectedTags.find(t => t.id === tag.id))
                  .map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => addTag(tag)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white hover:opacity-80 transition-all"
                      style={{ backgroundColor: tag.color }}
                    >
                      <Tag className="w-3 h-3" />
                      {tag.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Créer un tag personnalisé
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customTagName}
                    onChange={(e) => setCustomTagName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createCustomTag()}
                    placeholder="Nom du tag..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createCustomTag}
                      className="flex-1 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomTagName('');
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

