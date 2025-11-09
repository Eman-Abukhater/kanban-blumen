import React, { useState, useEffect } from "react";

interface AddEditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleEditProject: (
    newTitle: string,
    newDescription: string,
    projectId: number
  ) => void;
  handleAddProject: (newTitle: string, newDescription: string) => void;
  project: any;
}

const AddEditProjectModal: React.FC<AddEditProjectModalProps> = ({
  isOpen,
  onClose,
  handleEditProject,
  handleAddProject,
  project,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (project) {
      setNewTitle(project.title || "");
      setNewDescription(project.description || "");
    } else {
      setNewTitle("");
      setNewDescription("");
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      alert("Please enter a project title");
      return;
    }

    if (project) {
      // Edit existing project
      handleEditProject(newTitle, newDescription, project.id);
    } else {
      // Add new project
      handleAddProject(newTitle, newDescription);
    }

    // Reset form
    setNewTitle("");
    setNewDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          {project ? "Edit Project" : "Add New Project"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project title"
              required
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description (optional)"
              rows={4}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {newDescription.length}/500 characters
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setNewTitle("");
                setNewDescription("");
                onClose();
              }}
              className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors focus:outline-none hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600"
            >
              {project ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProjectModal;
