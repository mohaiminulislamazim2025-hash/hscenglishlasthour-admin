"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/feedback";
import { IconUpload } from "@/components/ui/icons";
import {
  fileExtension,
  requestSignedUpload,
  uploadFileToStorage,
} from "@/lib/upload/client";
import type { UploadKind } from "@/lib/validation/upload";
import {
  finalizeCoverUploadAction,
  finalizePageUploadAction,
  finalizePdfUploadAction,
} from "@/lib/books/actions";
import type { ActionResult } from "@/lib/actions/types";

type Phase = "idle" | "signing" | "uploading" | "finalizing" | "done" | "error";

export function AssetUploader({
  bookId,
  kind,
  pageNumber,
  pageId,
  accept,
  maxBytes,
  label,
  successMessage,
  variant = "subtle",
}: {
  bookId: string;
  kind: UploadKind;
  pageNumber?: number;
  pageId?: string;
  accept: string;
  maxBytes: number;
  label: string;
  successMessage?: string;
  variant?: "primary" | "secondary" | "subtle" | "ghost";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const busy = phase === "signing" || phase === "uploading" || phase === "finalizing";

  async function handleFile(file: File) {
    setMessage(null);

    const ext = fileExtension(file.name);
    if (kind === "pdf" && ext !== "pdf") {
      setPhase("error");
      setMessage("Please choose a PDF file.");
      return;
    }
    if (file.size > maxBytes) {
      setPhase("error");
      setMessage(`File is too large. Maximum ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }

    try {
      setPhase("signing");
      const sign = await requestSignedUpload({
        bookId,
        kind,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        ...(pageNumber ? { pageNumber } : {}),
      });

      setPhase("uploading");
      await uploadFileToStorage(sign, file);

      setPhase("finalizing");
      let result: ActionResult;
      if (kind === "cover") {
        result = await finalizeCoverUploadAction({ bookId, path: sign.path });
      } else if (kind === "pdf") {
        result = await finalizePdfUploadAction({ bookId, path: sign.path });
      } else {
        result = await finalizePageUploadAction({
          bookId,
          pageNumber: pageNumber ?? 1,
          path: sign.path,
          ...(pageId ? { pageId } : {}),
        });
      }

      if (!result.ok) throw new Error(result.message ?? "Could not save the upload.");

      setPhase("done");
      setMessage(successMessage ?? "Upload complete.");
      startTransition(() => router.refresh());
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Spinner className="h-3.5 w-3.5" /> : <IconUpload width={15} height={15} />}
        {busy ? phaseLabel(phase) : label}
      </Button>
      {message ? (
        <p
          className={`text-xs ${phase === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-positive)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "signing":
      return "Preparing…";
    case "uploading":
      return "Uploading…";
    case "finalizing":
      return "Saving…";
    default:
      return "Working…";
  }
}
