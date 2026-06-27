"use client";



interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteSubject?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  noteSubject,
  isDeleting = false,
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(20,10,0,0.42)", backdropFilter: "blur(3px)" }}
    >
      <div className="relative w-full max-w-md max-h-[95vh]">
        <div className="relative overflow-hidden rounded-sm border p-6"
             style={{
               background: "repeating-linear-gradient(180deg, rgba(124,83,20,0.02), rgba(124,83,20,0.02) 33px, rgba(124,83,20,0.14) 33px, rgba(124,83,20,0.14) 34px),linear-gradient(180deg, #f6ebc7 0%, #f2e4ba 48%, #eeddb0 100%)",
               borderColor: "rgba(120,80,20,0.24)",
               boxShadow: "0 30px 70px rgba(40,20,0,0.28)"
             }}>
          <div className="mb-6">
            <div>
              <h2 className="font-im-fell mt-2 text-2xl italic" style={{ color: "#4c2810" }}>
                Delete Note
              </h2>
              <p className="font-crimson mt-2 text-sm italic" style={{ color: "#8a6030" }}>
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
            </div>
            {noteSubject && (
              <div className="my-4 p-3 rounded-sm" style={{ background: "rgba(255,249,236,0.76)", borderColor: "rgba(120,80,20,0.16)" }}>
                <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a2008" }}>
                  &quot;{noteSubject}&quot;
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]"
              style={{ border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]"
              style={{
                background: "rgba(160,40,20,0.08)",
                border: "1px solid rgba(160,40,20,0.35)",
                color: "#8a2510",
                opacity: isDeleting ? 0.7 : 1,
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;