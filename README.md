# MetaImageOnline

MetaImageOnline is a lightweight, web-based image inspection tool that validates image files,
extracts technical properties (dimensions, format, size), and reads embedded metadata
(EXIF, GPS, camera, author, etc.) directly in the browser.

The project is designed to be dependency-light, privacy-friendly, and extensible for
advanced image analysis workflows.

---

## Core Capabilities

### 1. Image Validation
- Detects whether a selected or dragged file is a valid image
- MIME-type and binary-level verification
- Rejects spoofed or unsupported files gracefully

### 2. Format Support
Supports as many formats as browsers allow, including:
- JPEG / JPG
- PNG
- GIF
- WebP
- BMP
- TIFF (partial, browser-dependent)
- HEIC / HEIF (where supported)
- SVG (metadata limited)

### 3. Image Properties Extraction
- Width and height (pixels)
- File size
- MIME type
- Aspect ratio

### 4. Metadata (EXIF) Reading
When available:
- Camera make and model
- Lens information
- Photographer / artist
- Date taken
- Orientation
- GPS coordinates (latitude / longitude)
- Software used for editing

### 5. Privacy-First Design
- All processing happens locally in the browser
- No uploads to any server
- No tracking or analytics

---

## Technical Design

### Frontend
- HTML5
- Vanilla JavaScript (ES6+)
- TailwindCSS (CDN)

### Metadata Parsing
- EXIF data extracted using binary parsing via `DataView`
- Designed to allow optional integration with libraries like:
  - exifr
  - piexifjs
  - libheif (future)

---

## Use Cases

- OSINT / forensic image inspection
- Verifying image authenticity
- Educational tooling
- Photographer metadata auditing
- Web upload validation

---

## Future Roadmap

- Drag-and-drop batch processing
- Map preview for GPS metadata
- Hashing (SHA-256) for image fingerprinting
- Server-side API version (Node.js)
- WASM-based extended format support

---

## License

MIT

Copyright 2025, Seyyed Ali Mohammadiyeh (Max Base)
