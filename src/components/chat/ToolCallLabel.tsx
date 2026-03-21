import { type ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallLabelProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;
  const isComplete = toolInvocation.state === "result";
  const command = args?.command as string | undefined;
  const path = args?.path as string | undefined;

  if (toolName === "str_replace_editor") {
    const verb = (() => {
      switch (command) {
        case "create":
          return isComplete ? "Created" : "Creating";
        case "str_replace":
        case "insert":
          return isComplete ? "Edited" : "Editing";
        case "view":
          return isComplete ? "Read" : "Reading";
        default:
          return isComplete ? "Updated" : "Working on";
      }
    })();
    return path ? `${verb} ${path}` : verb;
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path as string | undefined;
    switch (command) {
      case "rename": {
        if (isComplete && path && newPath) return `Renamed ${path} to ${newPath}`;
        return path ? `Renaming ${path}` : "Renaming";
      }
      case "delete":
        return path
          ? `${isComplete ? "Deleted" : "Deleting"} ${path}`
          : isComplete ? "Deleted" : "Deleting";
      default:
        return path
          ? `${isComplete ? "Updated" : "Working on"} ${path}`
          : isComplete ? "Updated" : "Working on";
    }
  }

  return toolName;
}

export function ToolCallLabel({ toolInvocation }: ToolCallLabelProps) {
  const isComplete =
    toolInvocation.state === "result" && toolInvocation.result;
  const label = getLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
