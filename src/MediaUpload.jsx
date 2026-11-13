import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./MediaUpload.css";

const allowedImages = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const sizeLimit = {
  profile: 2 * 1024 * 1024,
  projects: 2 * 1024 * 1024,
  cv: 5 * 1024 * 1024
};

async function optimizeImage(file, maxDimension) {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable.");

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        result => result
          ? resolve(result)
          : reject(new Error("Image conversion failed.")),
        "image/webp",
        0.82
      );
    });

    if (blob.type !== "image/webp") {
      throw new Error("WebP encoding is not supported.");
    }

    return new File(
      [blob],
      "optimized.webp",
      { type: "image/webp" }
    );
  } finally {
    bitmap.close();
  }
}

export default function MediaUpload({
  label,
  kind,
  value,
  onUploaded,
  onClear
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const isPdf = kind === "cv";

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function selectFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("");
    setSelectedFile(null);

    if (isPdf && file.type !== "application/pdf") {
      setStatus("Please choose a PDF file.");
      event.target.value = "";
      return;
    }

    if (!isPdf && !allowedImages.includes(file.type)) {
      setStatus("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    // Prevent unreasonably large source files.
    const sourceLimit = isPdf
      ? sizeLimit.cv
      : 15 * 1024 * 1024;

    if (file.size > sourceLimit) {
      setStatus("The selected file is too large.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    event.target.value = "";
  }

  async function upload() {
    if (!selectedFile || busy) return;

    setBusy(true);
    setStatus("Preparing file...");

    try {
      let file = selectedFile;

      // Temporarily bypass compression to diagnose uploads.
      console.log("Original file:", {
        name: file.name,
        type: file.type,
        size: file.size
      });

      if (file.size > sizeLimit[kind]) {
        throw new Error(
          "The processed file exceeds the upload limit. " +
          "Choose a smaller image or PDF."
        );
      }

      const extension = file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/png" ? "png" : "jpg";

      const path = `${kind}/${crypto.randomUUID()}.${extension}`;

      setStatus("Uploading to Supabase...");

      console.log("Starting Storage upload:", {
        path,
        size: file.size,
        type: file.type
      });

      const uploadRequest = supabase.storage
        .from("portfolio-media")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false
        });

      const result = await Promise.race([
        uploadRequest,
        new Promise((_, reject) =>
          setTimeout(() => reject(
            new Error(
              "Upload did not respond within 25 seconds. " +
              "Check the browser Network tab and Supabase Storage."
            )
          ), 25000)
        )
      ]);

      if (result.error) {
        console.error("Supabase Storage error:", result.error);
        throw result.error;
      }

      console.log("Storage upload successful:", result.data);

      const { data } = supabase.storage
        .from("portfolio-media")
        .getPublicUrl(path);

      onUploaded(data.publicUrl);
      setSelectedFile(null);
      setStatus(
        "Upload complete. Click Save & Publish to make this change public."
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function clearMedia() {
    if (!onClear || busy) return;

    onClear();
    setSelectedFile(null);
    setStatus(
      "Media removed from this portfolio entry. " +
      "Click Save & Publish to confirm."
    );
  }

  return (
    <div className="media-upload">
      <span className="media-label">{label}</span>

      {value && (
        <div className="media-current">
          {isPdf ? (
            <a href={value} target="_blank"
              rel="noopener noreferrer">
              View current PDF
            </a>
          ) : (
            <img src={value} alt="Current media"
              className="media-preview" loading="lazy" />
          )}

          {onClear && (
            <button
              type="button"
              className="media-remove"
              onClick={clearMedia}
              disabled={busy}
            >
              Remove from Portfolio
            </button>
          )}
        </div>
      )}

      <label className="media-picker">
        <span>Choose {isPdf ? "PDF" : "Image"}</span>
        <input
          type="file"
          accept={isPdf
            ? "application/pdf,.pdf"
            : "image/jpeg,image/png,image/webp"}
          onChange={selectFile}
          disabled={busy}
        />
      </label>

      {selectedFile && previewUrl && (
        <div className="media-selected">
          {isPdf ? (
            <p>Selected PDF: {selectedFile.name}</p>
          ) : (
            <img src={previewUrl}
              alt="Selected image preview"
              className="media-preview" />
          )}

          <p>{((selectedFile?.size ?? 0) / 1024).toFixed(0)} KB original</p>
          <button type="button" onClick={upload}
            disabled={busy} className="media-upload-button">
            {busy ? "Processing..." : "Optimize & Upload"}
          </button>
        </div>
      )}

      <p className="media-hint">
        {isPdf
          ? "PDF only, maximum 5 MB."
          : "JPG, PNG or WebP. Images are automatically resized."}
      </p>

      {status && (
        <p className="media-message" role="status">
          {status}
        </p>
      )}
    </div>
  );
}



