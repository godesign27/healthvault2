import { Copy, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  duplicated_from?: string | null;
  image_url?: string | null;
}

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onDuplicate: (project: Project) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function ProjectCard({ project, onOpen, onDuplicate, onDelete, onRename }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <button
        onClick={() => onOpen(project.id)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:ring-offset-2 rounded-lg"
      >
        {project.image_url && (
          <div className="w-full h-48 bg-gray-100">
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 min-h-[200px] flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {project.name}
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRenameDialog(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Name
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(project);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate Project
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this project?')) {
                        onDelete(project.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex-1"></div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Created {formatDate(project.created_at)}</span>
          {project.duplicated_from && (
            <span className="flex items-center gap-1">
              <Copy className="w-3 h-3" />
              Duplicated
            </span>
          )}
        </div>
        </div>
      </button>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Project Name</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRenameDialog(false);
                  setNewName(project.name);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newName.trim()) {
                    onRename(project.id, newName.trim());
                    setShowRenameDialog(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded-md hover:bg-[indigo-700] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
