"use client";

import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            variant === "danger"
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
