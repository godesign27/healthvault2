import { Image, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_id: string;
  duplicated_from?: string | null;
  image_url?: string | null;
}

interface ProjectsPageProps {
  onProjectOpen: (id: string) => void;
}

export function ProjectsPage({ onProjectOpen }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectImage, setNewProjectImage] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'demo-user';

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription,
          user_id: userId,
          image_url: newProjectImage
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectImage(null);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const dupUserId = session?.user?.id || 'demo-user';

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${project.name} (Copy)`,
          description: project.description,
          user_id: dupUserId,
          duplicated_from: project.id,
          image_url: project.image_url
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const { data: segmentations, error: segError } = await supabase
        .from('segmentations')
        .select('*')
        .eq('project_id', project.id);

      if (segError) throw segError;

      if (segmentations && segmentations.length > 0) {
        const newSegmentations = segmentations.map(seg => ({
          project_id: newProject.id,
          name: seg.name,
          business_unit: seg.business_unit,
          docs: seg.docs,
          users: seg.users,
          has_scenario: seg.has_scenario
        }));

        const { data: createdSegmentations, error: insertSegError } = await supabase
          .from('segmentations')
          .insert(newSegmentations)
          .select();

        if (insertSegError) throw insertSegError;

        const { data: scenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .select('*')
          .eq('project_id', project.id);

        if (scenariosError) throw scenariosError;

        if (scenarios && scenarios.length > 0) {
          const newScenarios = scenarios.map(scenario => ({
            project_id: newProject.id,
            segmentation_name: scenario.segmentation_name,
            business_unit: scenario.business_unit,
            time_period: scenario.time_period,
            name: scenario.name,
            type: scenario.type,
            customer_type: scenario.customer_type,
            level: scenario.level,
            level_name: scenario.level_name,
            modeling_framework: scenario.modeling_framework,
            num_dimensions: scenario.num_dimensions,
            dimensions: scenario.dimensions,
            current_step: scenario.current_step,
            status: scenario.status,
            modified_by: scenario.modified_by
          }));

          const { error: insertScenError } = await supabase
            .from('scenarios')
            .insert(newScenarios);

          if (insertScenError) throw insertScenError;
        }
      }

      setProjects([newProject, ...projects]);
    } catch (error) {
      console.error('Error duplicating project:', error);
      alert('Failed to duplicate project. Please try again.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleRenameProject = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
    } catch (error) {
      console.error('Error renaming project:', error);
      alert('Failed to rename project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">
              Create and manage your design projects
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first project</p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={onProjectOpen}
                onDuplicate={handleDuplicateProject}
                onDelete={handleDeleteProject}
                onRename={handleRenameProject}
              />
            ))}
          </div>
        )}
      </div>

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">New Project</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  {newProjectImage ? (
                    <div className="relative w-full h-48 rounded-lg border-2 border-gray-300 overflow-hidden">
                      <img
                        src={newProjectImage}
                        alt="Project preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setNewProjectImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[indigo-600] hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 font-medium mb-1">Click to upload image</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewProjectImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectImage(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors font-medium"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
