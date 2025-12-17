# MetaImageOnline

A lightweight, web-based image inspection tool that validates image files, extracts technical properties (dimensions, format, size), and reads embedded metadata (EXIF, GPS, camera, author, etc.) directly in the browser.

## Features

- **Image Validation**: Validates image files and displays their status
- **Technical Properties**: 
  - Image dimensions (width, height)
  - Format detection (JPEG, PNG, GIF, WebP, BMP, TIFF)
  - File size information
  - Aspect ratio and megapixels
- **EXIF Metadata Extraction**:
  - Camera information (make, model, lens)
  - Camera settings (exposure time, f-number, ISO, focal length)
  - GPS coordinates with map links
  - Author and copyright information
  - Additional EXIF data
- **Privacy First**: All processing happens locally in your browser - no data is uploaded to any server
- **Drag & Drop Support**: Easily drag and drop images for inspection
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Open `index.html` in your web browser
2. Either click the upload area or drag and drop an image file
3. View the extracted metadata and properties

### Supported Formats

- JPEG/JPG
- PNG
- GIF
- WebP
- BMP
- TIFF

## Live Demo

Simply open the `index.html` file in any modern web browser. No server or build process required!

## Screenshots

The tool provides a clean, intuitive interface for inspecting image metadata with organized sections for:
- Validation status
- Basic properties
- Image dimensions
- File information
- Camera information (if available)
- GPS location (if available)
- Author & copyright (if available)
- Additional EXIF data (if available)

## Technical Details

### Technologies Used

- **HTML5**: Structure and file input
- **CSS3**: Modern styling with gradients and responsive design
- **JavaScript (ES6)**: Image processing and metadata extraction
- **EXIF.js**: EXIF metadata reading library

### How It Works

1. **File Selection**: User selects an image via click or drag-and-drop
2. **Validation**: File type and size are validated
3. **Image Loading**: Image is loaded using FileReader API
4. **Property Extraction**: Basic properties are extracted from the Image object
5. **EXIF Reading**: EXIF.js library reads embedded metadata
6. **Display**: All information is organized and displayed in separate cards

### Privacy & Security

- All processing happens entirely in the browser
- No data is transmitted to any server
- Files are processed in memory and not stored
- Safe for sensitive images

## Development

No build process required! Just edit the files:
- `index.html` - Main HTML structure
- `style.css` - Styling
- `app.js` - JavaScript functionality

## Browser Compatibility

Works in all modern browsers that support:
- FileReader API
- HTML5 File API
- ES6 JavaScript

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Acknowledgments

- EXIF.js library for EXIF metadata extraction

## License

MIT License - See [LICENSE](LICENSE) file for details

Copyright (c) 2025 Seyyed Ali Mohammadiyeh (Max Base)
