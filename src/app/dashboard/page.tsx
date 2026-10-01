import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentUploadManager } from "@/components/DocumentUploadManager";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Upload PDF or Word documents. Once processed, ask questions about them from the Chat tab."
      />
      <div className="p-6 sm:p-8">
        <DocumentUploadManager />
      </div>
    </div>
  );
}
