import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase, type DesignToken, type Component, type ComponentVariant } from '../lib/supabase';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'components'>('tokens');
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [variants, setVariants] = useState<ComponentVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingToken, setEditingToken] = useState<Partial<DesignToken> | null>(null);
  const [editingComponent, setEditingComponent] = useState<Partial<Component> | null>(null);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isAddingComponent, setIsAddingComponent] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokensData, componentsData, variantsData] = await Promise.all([
        supabase.from('design_tokens').select('*').order('category'),
        supabase.from('components').select('*').order('category'),
        supabase.from('component_variants').select('*')
      ]);

      if (tokensData.data) setTokens(tokensData.data);
      if (componentsData.data) setComponents(componentsData.data);
      if (variantsData.data) setVariants(variantsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!editingToken) return;

    try {
      if (editingToken.id) {
        await supabase
          .from('design_tokens')
          .update({
            category: editingToken.category,
            name: editingToken.name,
            value: editingToken.value,
            description: editingToken.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingToken.id);
      } else {
        await supabase.from('design_tokens').insert([
          {
            category: editingToken.category,
            name: editingToken.name,
            value: editingToken.value,
            description: editingToken.description
          }
        ]);
      }

      await loadData();
      setEditingToken(null);
      setIsAddingToken(false);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token?')) return;

    try {
      await supabase.from('design_tokens').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  const handleSaveComponent = async () => {
    if (!editingComponent) return;

    try {
      if (editingComponent.id) {
        await supabase
          .from('components')
          .update({
            name: editingComponent.name,
            category: editingComponent.category,
            description: editingComponent.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingComponent.id);
      } else {
        await supabase.from('components').insert([
          {
            name: editingComponent.name,
            category: editingComponent.category,
            description: editingComponent.description
          }
        ]);
      }

      await loadData();
      setEditingComponent(null);
      setIsAddingComponent(false);
    } catch (error) {
      console.error('Error saving component:', error);
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    try {
      await supabase.from('components').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  const groupedTokens = tokens.reduce((acc, token) => {
    if (!acc[token.category]) {
      acc[token.category] = [];
    }
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, DesignToken[]>);

  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<string, Component[]>);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-sunken">
        <div className="text-content-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Admin Panel</h1>
          <p className="text-content-secondary">Manage design tokens and components</p>
        </div>

        <div className="mb-6 border-b border-stroke-subtle">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'tokens'
                  ? 'border-[indigo-600] text-[indigo-600]'
                  : 'border-transparent text-content-secondary hover:text-content-secondary'
              }`}
            >
              Design Tokens
            </button>
            <button
              onClick={() => setActiveTab('components')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'components'
                  ? 'border-[indigo-600] text-[indigo-600]'
                  : 'border-transparent text-content-secondary hover:text-content-secondary'
              }`}
            >
              Components
            </button>
          </nav>
        </div>

        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-content-primary">Design Tokens</h2>
              <button
                onClick={() => {
                  setIsAddingToken(true);
                  setEditingToken({ category: '', name: '', value: '', description: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Token
              </button>
            </div>

            {isAddingToken && editingToken && (
              <div className="bg-surface-raised rounded-lg shadow-sm p-6 border-2 border-[indigo-600]">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Add New Token</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Category (e.g., colors)"
                    value={editingToken.category || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, category: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                  <input
                    type="text"
                    placeholder="Name (e.g., primary-dark)"
                    value={editingToken.name || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., #1C2938)"
                    value={editingToken.value || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, value: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={editingToken.description || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, description: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveToken}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0B8457] text-white rounded hover:bg-[#096B45] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingToken(false);
                      setEditingToken(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-overlay text-content-secondary rounded hover:bg-surface-sunken transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {Object.entries(groupedTokens).map(([category, categoryTokens]) => (
              <div key={category} className="bg-surface-raised rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-content-primary mb-4 capitalize">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-sunken border-b border-stroke-subtle">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-content-secondary">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-content-secondary">Value</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-content-secondary">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-content-secondary">Preview</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-content-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke-subtle">
                      {categoryTokens.map((token) => (
                        <tr key={token.id} className="hover:bg-surface-sunken">
                          {editingToken?.id === token.id ? (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingToken.name || ''}
                                  onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                                  className="w-full px-2 py-1 border border-stroke-default rounded text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingToken.value || ''}
                                  onChange={(e) => setEditingToken({ ...editingToken, value: e.target.value })}
                                  className="w-full px-2 py-1 border border-stroke-default rounded text-sm font-mono"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingToken.description || ''}
                                  onChange={(e) => setEditingToken({ ...editingToken, description: e.target.value })}
                                  className="w-full px-2 py-1 border border-stroke-default rounded text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {category === 'colors' && (
                                  <div
                                    className="w-12 h-6 rounded border border-stroke-default"
                                    style={{ backgroundColor: editingToken.value }}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={handleSaveToken}
                                    className="p-1 text-[#0B8457] hover:bg-green-50 rounded"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingToken(null)}
                                    className="p-1 text-content-secondary hover:bg-surface-sunken rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-content-primary">{token.name}</td>
                              <td className="px-4 py-3 text-sm text-content-secondary font-mono">{token.value}</td>
                              <td className="px-4 py-3 text-sm text-content-secondary">{token.description}</td>
                              <td className="px-4 py-3">
                                {category === 'colors' && (
                                  <div
                                    className="w-12 h-6 rounded border border-stroke-default"
                                    style={{ backgroundColor: token.value }}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingToken(token)}
                                    className="p-1 text-[indigo-600] hover:bg-teal-50 rounded"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteToken(token.id)}
                                    className="p-1 text-[#C81E1E] hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-content-primary">Components</h2>
              <button
                onClick={() => {
                  setIsAddingComponent(true);
                  setEditingComponent({ name: '', category: '', description: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Component
              </button>
            </div>

            {isAddingComponent && editingComponent && (
              <div className="bg-surface-raised rounded-lg shadow-sm p-6 border-2 border-[indigo-600]">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Add New Component</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name (e.g., Radio Button)"
                    value={editingComponent.name || ''}
                    onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g., Form Controls)"
                    value={editingComponent.category || ''}
                    onChange={(e) => setEditingComponent({ ...editingComponent, category: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600]"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={editingComponent.description || ''}
                    onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                    className="px-4 py-2 border border-stroke-default rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600] col-span-2"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveComponent}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0B8457] text-white rounded hover:bg-[#096B45] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingComponent(false);
                      setEditingComponent(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-overlay text-content-secondary rounded hover:bg-surface-sunken transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
              <div key={category} className="bg-surface-raised rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-content-primary mb-4">{category}</h3>
                <div className="grid gap-4">
                  {categoryComponents.map((component) => (
                    <div
                      key={component.id}
                      className="border border-stroke-subtle rounded-lg p-4 hover:border-[indigo-600] transition-colors"
                    >
                      {editingComponent?.id === component.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingComponent.name || ''}
                            onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                            className="w-full px-3 py-2 border border-stroke-default rounded text-lg font-semibold"
                          />
                          <input
                            type="text"
                            value={editingComponent.description || ''}
                            onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                            className="w-full px-3 py-2 border border-stroke-default rounded text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveComponent}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#0B8457] text-white rounded hover:bg-[#096B45] transition-colors text-sm"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingComponent(null)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-surface-overlay text-content-secondary rounded hover:bg-surface-sunken transition-colors text-sm"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-content-primary">{component.name}</h4>
                            <p className="text-sm text-content-secondary mt-1">{component.description}</p>
                            <p className="text-xs text-content-tertiary mt-2">
                              {variants.filter((v) => v.component_id === component.id).length} variants
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingComponent(component)}
                              className="p-2 text-[indigo-600] hover:bg-teal-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComponent(component.id)}
                              className="p-2 text-[#C81E1E] hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
