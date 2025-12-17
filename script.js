const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const output = document.getElementById("output");
const preview = document.getElementById("preview");
const imagePreview = document.getElementById("imagePreview");

/* =========================
   Helpers
========================= */

function isImageFile(file) {
  // Accept common image types, including SVG, TIFF, ICO, AVIF, etc.
  const acceptedTypes = [
    "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp",
    "image/svg+xml", "image/tiff", "image/x-icon", "image/vnd.microsoft.icon", "image/avif"
  ];
  if (file.type.startsWith("image/")) return true;
  // Fallback for some browsers: check extension if type is empty
  if (!file.type && file.name) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ["jpg","jpeg","png","gif","bmp","webp","svg","tif","tiff","ico","avif"].includes(ext);
  }
  return acceptedTypes.includes(file.type);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/* =========================
   EXIF Parsing (Minimal)
========================= */

function readExif(file) {
  return new Promise(resolve => {
    // Only JPEG and TIFF have EXIF in standard form
    if (!file.type.match(/jpeg|tiff/)) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const view = new DataView(e.target.result);
      // Minimal EXIF presence check (JPEG only)
      if (view.getUint16(0, false) !== 0xffd8 && view.getUint16(0, false) !== 0x4949 && view.getUint16(0, false) !== 0x4D4D) {
        resolve(null);
        return;
      }
      resolve("EXIF data may exist (full parsing extensible)");
    };
    reader.readAsArrayBuffer(file.slice(0, 256 * 1024));
  });
}

/* =========================
   Main Processing
========================= */

async function processFile(file) {
  output.innerHTML = "";
  preview.classList.add("hidden");

  if (!isImageFile(file)) {
    output.innerHTML = `<div class="rounded bg-red-100 text-red-700 px-4 py-2">Not a valid or supported image file.</div>`;
    return;
  }

  const url = URL.createObjectURL(file);
  let img = new Image();
  let isBitmap = false;

  // Special handling for SVG: display as-is, no width/height
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    imagePreview.src = url;
    preview.classList.remove("hidden");
    output.innerHTML = `
      <p><strong>Name:</strong> ${file.name}</p>
      <p><strong>Type:</strong> ${file.type || "image/svg+xml"}</p>
      <p><strong>Size:</strong> ${formatBytes(file.size)}</p>
      <p><strong>Width/Height:</strong> (SVG - scalable)</p>
      <p><strong>Aspect Ratio:</strong> (SVG - scalable)</p>
      <p><strong>Metadata:</strong> SVG image (no EXIF)</p>
    `;
    return;
  }

  // Try to load as bitmap image
  img.onload = async () => {
    imagePreview.src = url;
    preview.classList.remove("hidden");

    let exifInfo = null;
    try {
      exifInfo = await readExif(file);
    } catch (e) {
      exifInfo = null;
    }

    output.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <div><span class="font-semibold">Name:</span> ${file.name}</div>
        <div><span class="font-semibold">Type:</span> ${file.type || "Unknown"}</div>
        <div><span class="font-semibold">Size:</span> ${formatBytes(file.size)}</div>
        <div><span class="font-semibold">Width:</span> ${img.width ? img.width + "px" : "-"}</div>
        <div><span class="font-semibold">Height:</span> ${img.height ? img.height + "px" : "-"}</div>
        <div><span class="font-semibold">Aspect Ratio:</span> ${(img.width && img.height) ? (img.width / img.height).toFixed(2) : "-"}</div>
        <div class="col-span-2"><span class="font-semibold">Metadata:</span> ${exifInfo || "No EXIF data detected"}</div>
      </div>
    `;
  };

  img.onerror = () => {
    // Try fallback for ICO, TIFF, AVIF, etc. (show as download link)
    output.innerHTML = `
      <div class="rounded bg-yellow-100 text-yellow-800 px-4 py-2 mb-2">Preview not supported for this image type in your browser.</div>
      <div class="grid grid-cols-2 gap-2">
        <div><span class="font-semibold">Name:</span> ${file.name}</div>
        <div><span class="font-semibold">Type:</span> ${file.type || "Unknown"}</div>
        <div><span class="font-semibold">Size:</span> ${formatBytes(file.size)}</div>
        <div class="col-span-2"><a href="${url}" download class="text-blue-600 underline">Download image</a></div>
      </div>
    `;
    imagePreview.src = "";
    preview.classList.add("hidden");
  };

  img.src = url;
}

/* =========================
   Events
========================= */

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", e => {
  if (e.target.files.length) {
    processFile(e.target.files[0]);
  }
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("bg-gray-50");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("bg-gray-50");
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("bg-gray-50");
  if (e.dataTransfer.files.length) {
    processFile(e.dataTransfer.files[0]);
  }
});
