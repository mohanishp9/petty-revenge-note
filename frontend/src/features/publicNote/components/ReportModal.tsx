import React, { useState } from "react";
import toast from "react-hot-toast";
import { reportNoteAPI } from "@/features/publicNote/publicNoteApi";
import { Flag, X } from "lucide-react";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
};

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, noteId }) => {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await reportNoteAPI(noteId, reason, details);
      toast.success("Note reported successfully");
      onClose();
      // Reset form
      setReason("spam");
      setDetails("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to report note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-md p-6 shadow-2xl relative"
        style={{
          backgroundColor: "#f2e2b0",
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(120,80,20,0.15) 28px)",
          backgroundSize: "100% 28px",
          backgroundPositionY: "6px",
          border: "1px solid rgba(120,80,20,0.2)",
        }}
      >
        <div className="absolute bottom-0 left-8 top-0 w-px" style={{ background: "rgba(180,40,30,0.3)" }} />
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-[#7a5a22] hover:bg-[#e8d5a5] p-1 rounded transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pl-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-5 w-5 text-[#8a6030]" />
            <h2 className="font-im-fell text-2xl font-bold" style={{ color: "#1e0f02" }}>Report Note</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-special-elite text-[#3a2008] mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border p-2 text-sm font-crimson focus:outline-none focus:ring-1 bg-[#fffbf0] rounded-sm"
                style={{ borderColor: "rgba(120,80,20,0.3)", color: "#1e0f02" }}
                required
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-special-elite text-[#3a2008] mb-1">Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full border p-2 text-sm font-crimson min-h-[100px] resize-none focus:outline-none focus:ring-1 bg-[#fffbf0] rounded-sm"
                style={{ borderColor: "rgba(120,80,20,0.3)", color: "#1e0f02" }}
                placeholder="Provide more context for this report..."
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="font-special-elite rounded-sm px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-black hover:text-white disabled:opacity-50"
                style={{ border: "1px solid rgba(120,80,20,0.4)", color: "#1e0f02" }}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
