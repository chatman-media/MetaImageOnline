// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resetButton = document.getElementById('resetButton');
const errorResetButton = document.getElementById('errorResetButton');

// Info display elements
const validationStatus = document.getElementById('validationStatus');
const basicProperties = document.getElementById('basicProperties');
const imageDimensions = document.getElementById('imageDimensions');
const fileInformation = document.getElementById('fileInformation');
const cameraInformation = document.getElementById('cameraInformation');
const gpsLocation = document.getElementById('gpsLocation');
const authorInfo = document.getElementById('authorInfo');
const additionalExif = document.getElementById('additionalExif');

// Card elements
const cameraCard = document.getElementById('cameraCard');
const gpsCard = document.getElementById('gpsCard');
const authorCard = document.getElementById('authorCard');
const exifCard = document.getElementById('exifCard');

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
resetButton.addEventListener('click', resetApp);
errorResetButton.addEventListener('click', resetApp);

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Main file handler
function handleFile(file) {
    // Validate file
    if (!validateFile(file)) {
        return;
    }

    // Hide upload area and error section
    uploadArea.parentElement.style.display = 'none';
    errorSection.style.display = 'none';

    // Show preview section
    previewSection.style.display = 'block';

    // Read and process file
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            imagePreview.src = e.target.result;
            extractImageData(file, img, e.target.result);
        };
        img.onerror = function() {
            showError('Failed to load image. The file may be corrupted.');
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        showError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
}

// Validate file
function validateFile(file) {
    // Check if file exists
    if (!file) {
        showError('No file selected.');
        return false;
    }

    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
        showError(`Unsupported file format: ${file.type || 'unknown'}. Please select a valid image file.`);
        return false;
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showError('File size exceeds 50MB limit. Please select a smaller file.');
        return false;
    }

    return true;
}

// Extract all image data
function extractImageData(file, img, dataUrl) {
    // Display validation status
    displayValidationStatus(file);

    // Display basic properties
    displayBasicProperties(file);

    // Display dimensions
    displayDimensions(img);

    // Display file information
    displayFileInformation(file);

    // Extract EXIF data
    extractExifData(img, dataUrl);

    // Show results section
    resultsSection.style.display = 'block';
}

// Display validation status
function displayValidationStatus(file) {
    const isValid = SUPPORTED_FORMATS.includes(file.type);
    validationStatus.innerHTML = `
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
                <span class="status-badge ${isValid ? 'status-valid' : 'status-invalid'}">
                    ${isValid ? '✓ Valid Image' : '✗ Invalid Image'}
                </span>
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Validated:</span>
            <span class="info-value">${new Date().toLocaleString()}</span>
        </div>
    `;
}

// Display basic properties
function displayBasicProperties(file) {
    const format = file.type.split('/')[1].toUpperCase();
    basicProperties.innerHTML = `
        <div class="info-row">
            <span class="info-label">Format:</span>
            <span class="info-value">${format}</span>
        </div>
        <div class="info-row">
            <span class="info-label">MIME Type:</span>
            <span class="info-value">${file.type}</span>
        </div>
        <div class="info-row">
            <span class="info-label">File Name:</span>
            <span class="info-value">${file.name}</span>
        </div>
    `;
}

// Display dimensions
function displayDimensions(img) {
    const aspectRatio = (img.width / img.height).toFixed(2);
    const megapixels = ((img.width * img.height) / 1000000).toFixed(2);
    
    imageDimensions.innerHTML = `
        <div class="info-row">
            <span class="info-label">Width:</span>
            <span class="info-value">${img.width} px</span>
        </div>
        <div class="info-row">
            <span class="info-label">Height:</span>
            <span class="info-value">${img.height} px</span>
        </div>
        <div class="info-row">
            <span class="info-label">Aspect Ratio:</span>
            <span class="info-value">${aspectRatio}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Megapixels:</span>
            <span class="info-value">${megapixels} MP</span>
        </div>
    `;
}

// Display file information
function displayFileInformation(file) {
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const lastModified = new Date(file.lastModified).toLocaleString();

    fileInformation.innerHTML = `
        <div class="info-row">
            <span class="info-label">File Size:</span>
            <span class="info-value">${sizeMB} MB (${sizeKB} KB)</span>
        </div>
        <div class="info-row">
            <span class="info-label">Last Modified:</span>
            <span class="info-value">${lastModified}</span>
        </div>
    `;
}

// Extract EXIF data
function extractExifData(img, dataUrl) {
    EXIF.getData(img, function() {
        const allExifData = EXIF.getAllTags(this);
        
        // Display camera information
        displayCameraInformation(allExifData);
        
        // Display GPS location
        displayGPSLocation(allExifData);
        
        // Display author and copyright
        displayAuthorInformation(allExifData);
        
        // Display additional EXIF data
        displayAdditionalExif(allExifData);
    });
}

// Display camera information
function displayCameraInformation(exifData) {
    const cameraInfo = [];
    
    if (exifData.Make) {
        cameraInfo.push({ label: 'Camera Make', value: exifData.Make });
    }
    if (exifData.Model) {
        cameraInfo.push({ label: 'Camera Model', value: exifData.Model });
    }
    if (exifData.LensModel) {
        cameraInfo.push({ label: 'Lens Model', value: exifData.LensModel });
    }
    if (exifData.ExposureTime) {
        const exposure = exifData.ExposureTime;
        const exposureStr = exposure < 1 ? `1/${Math.round(1/exposure)}` : `${exposure}`;
        cameraInfo.push({ label: 'Exposure Time', value: `${exposureStr} sec` });
    }
    if (exifData.FNumber) {
        cameraInfo.push({ label: 'F-Number', value: `f/${exifData.FNumber}` });
    }
    if (exifData.ISO || exifData.ISOSpeedRatings) {
        cameraInfo.push({ label: 'ISO', value: exifData.ISO || exifData.ISOSpeedRatings });
    }
    if (exifData.FocalLength) {
        cameraInfo.push({ label: 'Focal Length', value: `${exifData.FocalLength} mm` });
    }
    if (exifData.Flash) {
        cameraInfo.push({ label: 'Flash', value: exifData.Flash });
    }
    if (exifData.WhiteBalance) {
        cameraInfo.push({ label: 'White Balance', value: exifData.WhiteBalance === 0 ? 'Auto' : 'Manual' });
    }

    if (cameraInfo.length > 0) {
        cameraCard.style.display = 'block';
        cameraInformation.innerHTML = cameraInfo.map(info => `
            <div class="info-row">
                <span class="info-label">${info.label}:</span>
                <span class="info-value">${info.value}</span>
            </div>
        `).join('');
    } else {
        cameraCard.style.display = 'none';
    }
}

// Display GPS location
function displayGPSLocation(exifData) {
    const gpsInfo = [];
    
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
        const lat = convertDMSToDD(
            exifData.GPSLatitude[0],
            exifData.GPSLatitude[1],
            exifData.GPSLatitude[2],
            exifData.GPSLatitudeRef
        );
        const lon = convertDMSToDD(
            exifData.GPSLongitude[0],
            exifData.GPSLongitude[1],
            exifData.GPSLongitude[2],
            exifData.GPSLongitudeRef
        );
        
        gpsInfo.push({ label: 'Latitude', value: `${lat.toFixed(6)}° ${exifData.GPSLatitudeRef}`, isText: true });
        gpsInfo.push({ label: 'Longitude', value: `${lon.toFixed(6)}° ${exifData.GPSLongitudeRef}`, isText: true });
        gpsInfo.push({ 
            label: 'Map Link', 
            mapLink: { lat, lon },
            isText: false
        });
    }
    
    if (exifData.GPSAltitude) {
        const altRef = exifData.GPSAltitudeRef === 1 ? 'Below' : 'Above';
        gpsInfo.push({ label: 'Altitude', value: `${exifData.GPSAltitude} m ${altRef} sea level`, isText: true });
    }
    
    if (exifData.GPSDateStamp && exifData.GPSTimeStamp && Array.isArray(exifData.GPSTimeStamp) && exifData.GPSTimeStamp.length >= 3) {
        const time = `${exifData.GPSTimeStamp[0]}:${exifData.GPSTimeStamp[1]}:${exifData.GPSTimeStamp[2]}`;
        gpsInfo.push({ label: 'GPS Date/Time', value: `${exifData.GPSDateStamp} ${time}`, isText: true });
    }

    if (gpsInfo.length > 0) {
        gpsCard.style.display = 'block';
        gpsLocation.innerHTML = '';
        gpsInfo.forEach(info => {
            const row = document.createElement('div');
            row.className = 'info-row';
            
            const label = document.createElement('span');
            label.className = 'info-label';
            label.textContent = info.label + ':';
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'info-value';
            
            if (info.mapLink) {
                // Create link element for map
                const link = document.createElement('a');
                link.href = `https://www.google.com/maps?q=${info.mapLink.lat},${info.mapLink.lon}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.color = '#3b82f6';
                link.style.textDecoration = 'underline';
                link.textContent = 'View on Map';
                valueSpan.appendChild(link);
            } else {
                valueSpan.textContent = info.value;
            }
            
            row.appendChild(label);
            row.appendChild(valueSpan);
            gpsLocation.appendChild(row);
        });
    } else {
        gpsCard.style.display = 'none';
    }
}

// Display author and copyright information
function displayAuthorInformation(exifData) {
    const authorInfo_data = [];
    
    if (exifData.Artist) {
        authorInfo_data.push({ label: 'Artist/Author', value: exifData.Artist });
    }
    if (exifData.Copyright) {
        authorInfo_data.push({ label: 'Copyright', value: exifData.Copyright });
    }
    if (exifData.ImageDescription) {
        authorInfo_data.push({ label: 'Description', value: exifData.ImageDescription });
    }
    if (exifData.Software) {
        authorInfo_data.push({ label: 'Software', value: exifData.Software });
    }

    if (authorInfo_data.length > 0) {
        authorCard.style.display = 'block';
        authorInfo.innerHTML = authorInfo_data.map(info => `
            <div class="info-row">
                <span class="info-label">${info.label}:</span>
                <span class="info-value">${info.value}</span>
            </div>
        `).join('');
    } else {
        authorCard.style.display = 'none';
    }
}

// Display additional EXIF data
function displayAdditionalExif(exifData) {
    const excludeKeys = [
        'Make', 'Model', 'LensModel', 'ExposureTime', 'FNumber', 'ISO', 'ISOSpeedRatings',
        'FocalLength', 'Flash', 'WhiteBalance', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef',
        'GPSLongitudeRef', 'GPSAltitude', 'GPSAltitudeRef', 'GPSDateStamp', 'GPSTimeStamp',
        'Artist', 'Copyright', 'ImageDescription', 'Software', 'thumbnail', 'undefined'
    ];

    const additionalData = [];
    for (let key in exifData) {
        if (!excludeKeys.includes(key) && exifData[key] !== undefined && exifData[key] !== null) {
            let value = exifData[key];
            
            // Handle special data types
            if (typeof value === 'object' && !Array.isArray(value)) {
                continue; // Skip complex objects
            }
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
            
            // Format key name (add spaces before capital letters)
            const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
            
            additionalData.push({ label: formattedKey, value: String(value) });
        }
    }

    if (additionalData.length > 0) {
        exifCard.style.display = 'block';
        additionalExif.innerHTML = additionalData.map(info => `
            <div class="info-row">
                <span class="info-label">${info.label}:</span>
                <span class="info-value">${info.value}</span>
            </div>
        `).join('');
    } else {
        exifCard.style.display = 'none';
    }
}

// Convert GPS coordinates from DMS to Decimal Degrees
function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
    }
    return dd;
}

// Show error message
function showError(message) {
    uploadArea.parentElement.style.display = 'none';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// Reset application
function resetApp() {
    // Reset file input
    fileInput.value = '';
    
    // Hide all sections except upload
    uploadArea.parentElement.style.display = 'block';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    // Clear image preview
    imagePreview.src = '';
    
    // Hide optional cards
    cameraCard.style.display = 'none';
    gpsCard.style.display = 'none';
    authorCard.style.display = 'none';
    exifCard.style.display = 'none';
    
    // Clear all content
    validationStatus.innerHTML = '';
    basicProperties.innerHTML = '';
    imageDimensions.innerHTML = '';
    fileInformation.innerHTML = '';
    cameraInformation.innerHTML = '';
    gpsLocation.innerHTML = '';
    authorInfo.innerHTML = '';
    additionalExif.innerHTML = '';
}

// Initialize
console.log('MetaImageOnline initialized');
