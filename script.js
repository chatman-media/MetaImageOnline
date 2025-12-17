const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const output = document.getElementById("output");
const preview = document.getElementById("preview");
const imagePreview = document.getElementById("imagePreview");

/* =========================
   Helpers
========================= */

function isImageFile(file) {
  return file.type.startsWith("image/");
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
    const reader = new FileReader();
    reader.onload = function (e) {
      const view = new DataView(e.target.result);
      // Minimal EXIF presence check (JPEG only)
      if (view.getUint16(0, false) !== 0xffd8) {
        resolve(null);
        return;
      }
      resolve("EXIF data may exist (full parsing extensible)");
    };
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
  });
}

/* =========================
   Main Processing
========================= */

async function processFile(file) {
  output.innerHTML = "";
  preview.classList.add("hidden");

  if (!isImageFile(file)) {
    output.innerHTML = `<p class="text-red-600">Not a valid image file.</p>`;
    return;
  }

  const img = new Image();
  const url = URL.createObjectURL(file);

  img.onload = async () => {
    imagePreview.src = url;
    preview.classList.remove("hidden");

    const exifInfo = await readExif(file);

    output.innerHTML = `
      <p><strong>Name:</strong> ${file.name}</p>
      <p><strong>Type:</strong> ${file.type}</p>
      <p><strong>Size:</strong> ${formatBytes(file.size)}</p>
      <p><strong>Width:</strong> ${img.width}px</p>
      <p><strong>Height:</strong> ${img.height}px</p>
      <p><strong>Aspect Ratio:</strong> ${(img.width / img.height).toFixed(2)}</p>
      <p><strong>Metadata:</strong> ${exifInfo || "No EXIF data detected"}</p>
    `;
  };

  img.onerror = () => {
    output.innerHTML = `<p class="text-red-600">Failed to load image.</p>`;
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
