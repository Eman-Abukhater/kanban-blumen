// src/components/kanban/ProjectCard.tsx
import { MoreVertical, Users, LayoutGrid, Eye } from "lucide-react";

type Project = {
  id: number;
  title: string;
  description?: string;
  createdBy?: { username?: string };
  members?: { username?: string }[];
  boards?: any[];
};

type Props = {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProjectCard({ project, onView, onEdit, onDelete }: Props) {
  const membersCount = project?.members?.length ?? 0;
  const boardsCount = project?.boards?.length ?? 0;

  return (
    <div className="card p-5">
      {/* top row */}
      <div className="flex items-start justify-between">
        <span className="id-badge">ID : {String(project.id).padStart(3, "0")}</span>
        <button className="rounded-full p-1.5 text-slate600 hover:bg-slate500_12" onClick={onEdit} title="More">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* title */}
      <h3 className="mt-3 text-[16px] font-semibold text-ink">
        {project.title}
      </h3>

      {/* meta */}
      <div className="mt-3 space-y-2 text-[14px]">
        <div className="flex gap-2">
          <span className="text-slate500 min-w-[88px]">Created By</span>
          <span className="font-semibold"> {project.createdBy?.username ?? "Admin"}</span>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-slate500 min-w-[88px]">Member(s)</span>
          {/* simple avatar pills */}
          <div className="flex items-center gap-1">
            {[0,1,2].slice(0,Math.min(3, membersCount || 3)).map((i) => (
              <span key={i} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold text-ink"
                style={{ background: i===0 ? "#CAFDF5" : i===1 ? "#EFD6FF" : "#FFE9D5" }}>
                {i===0 ? "S" : i===1 ? "B" : "3"}
              </span>
            ))}
            {membersCount > 3 && (
              <span className="inline-flex h-6 px-1 items-center justify-center rounded-full text-[12px] font-semibold text-ink" style={{background:"#FFF5CC"}}>
                +{membersCount-3}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-slate500 min-w-[88px]">Artboard</span>
          <span className="font-semibold">{boardsCount || "20+"}</span>
        </div>
      </div>

      {/* divider */}
      <div className="my-4 divider" />

      {/* actions */}
      <div className="flex justify-between">
        <button className="btn btn-outline" onClick={onView}>
          <Eye className="mr-2 h-4 w-4" /> View
        </button>
        {/* delete (optional for parity with old UI) */}
        {/* <button className="btn border border-danger/30 text-danger" onClick={onDelete}>Delete</button> */}
      </div>
    </div>
  );
}
