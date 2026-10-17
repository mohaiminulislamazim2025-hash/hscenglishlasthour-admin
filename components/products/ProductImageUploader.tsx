"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/feedback";
import { IconUpload } from "@/components/ui/icons";
import { requestSignedUpload, uploadFileToStorage } from "@/lib/upload/client";
import { MAX_IMAGE_BYTES } from "@/lib/validation/upload";
import { finalizeProductImageUploadAction } from "@/lib/products/actions";
import type { ActionResult } from "@/lib/actions/types";

type Phase = "idle" | "signing" | "uploading" | "finalizing" | "done" | "error";

export function ProductImageUploader({
  productId,
  accept,
  label,
  successMessage,
  variant = "subtle",
}: {
  productId: string;
  accept: string;
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
    if (file.size > MAX_IMAGE_BYTES) {
      setPhase("error");
      setMessage(`File is too large. Maximum ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`);
      return;
    }

    try {
      setPhase("signing");
      const sign = await requestSignedUpload({
        productId,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });

      setPhase("uploading");
      await uploadFileToStorage(sign, file);

      setPhase("finalizing");
      const result: ActionResult = await finalizeProductImageUploadAction({ productId, path: sign.path });
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
      <Button type="button" variant={variant} size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Spinner className="h-3.5 w-3.5" /> : <IconUpload width={15} height={15} />}
        {busy ? phaseLabel(phase) : label}
      </Button>
      {message ? (
        <p className={`text-xs ${phase === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-positive)]"}`} role="status">
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
