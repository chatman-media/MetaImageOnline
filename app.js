const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resetButton = document.getElementById('resetButton');
const errorResetButton = document.getElementById('errorResetButton');

const validationStatus = document.getElementById('validationStatus');
const basicProperties = document.getElementById('basicProperties');
const imageDimensions = document.getElementById('imageDimensions');
const fileInformation = document.getElementById('fileInformation');
const cameraInformation = document.getElementById('cameraInformation');
const gpsLocation = document.getElementById('gpsLocation');
const authorInfo = document.getElementById('authorInfo');
const additionalExif = document.getElementById('additionalExif');

const cameraCard = document.getElementById('cameraCard');
const gpsCard = document.getElementById('gpsCard');
const authorCard = document.getElementById('authorCard');
const exifCard = document.getElementById('exifCard');

const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
const RAW_FORMATS = ['image/x-sony-arw', 'image/x-dcraw'];
const ALL_SUPPORTED_FORMATS = [...SUPPORTED_FORMATS, ...RAW_FORMATS];

uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
resetButton.addEventListener('click', resetApp);
errorResetButton.addEventListener('click', resetApp);

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

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!validateFile(file)) {
        return;
    }

    uploadArea.parentElement.style.display = 'none';
    errorSection.style.display = 'none';

    previewSection.style.display = 'block';

    if (isRawFile(file)) {
        handleRawFile(file);
    } else {
        handleStandardImage(file);
    }
}

function handleStandardImage(file) {
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

function handleRawFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const rawArrayBuffer = e.target.result;
        const jpegData = extractJpegFromRaw(rawArrayBuffer);

        if (!jpegData) {
            showError('Could not extract preview from RAW file. The file may be corrupted or unsupported.');
            return;
        }

        // Convert to base64 dataURL for display
        const uint8Array = new Uint8Array(jpegData);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = 'data:image/jpeg;base64,' + base64;

        const img = new Image();
        img.onload = function() {
            imagePreview.src = dataUrl;
            extractImageData(file, img, dataUrl, true, rawArrayBuffer);
        };
        img.onerror = function() {
            showError('Failed to load RAW preview. The file may be corrupted.');
        };
        img.src = dataUrl;
    };
    reader.onerror = function() {
        showError('Failed to read RAW file. Please try again.');
    };
    reader.readAsArrayBuffer(file);
}

function validateFile(file) {
    if (!file) {
        showError('No file selected.');
        return false;
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isRawByExtension = ['arw', 'raw'].includes(fileExtension);

    if (!ALL_SUPPORTED_FORMATS.includes(file.type) && !isRawByExtension) {
        showError(`Unsupported file format: ${file.type || 'unknown'}. Please select a valid image file.`);
        return false;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB for RAW files
    if (file.size > maxSize) {
        showError('File size exceeds 100MB limit. Please select a smaller file.');
        return false;
    }

    return true;
}

function isRawFile(file) {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    return RAW_FORMATS.includes(file.type) || ['arw', 'raw'].includes(fileExtension);
}

function extractJpegFromRaw(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    let jpegStart = -1;
    let jpegEnd = -1;
    let largestJpegSize = 0;
    let bestStart = -1;
    let bestEnd = -1;

    // Find all JPEG segments and pick the largest one (the main preview)
    for (let i = 0; i < data.length - 1; i++) {
        // JPEG start marker: FFD8
        if (data[i] === 0xFF && data[i + 1] === 0xD8) {
            jpegStart = i;
        }
        // JPEG end marker: FFD9
        if (data[i] === 0xFF && data[i + 1] === 0xD9 && jpegStart !== -1) {
            jpegEnd = i + 2;
            const size = jpegEnd - jpegStart;
            if (size > largestJpegSize && size > 10000) { // Must be > 10KB to be a real preview
                largestJpegSize = size;
                bestStart = jpegStart;
                bestEnd = jpegEnd;
            }
            jpegStart = -1;
        }
    }

    if (bestStart !== -1 && bestEnd !== -1) {
        return arrayBuffer.slice(bestStart, bestEnd);
    }

    return null;
}

function extractExifFromRaw(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const exifData = {};

    // Check TIFF header
    const byte0 = dataView.getUint8(0);
    const byte1 = dataView.getUint8(1);

    let bigEnd;
    if (byte0 === 0x49 && byte1 === 0x49) {
        bigEnd = false; // Little endian (Intel)
    } else if (byte0 === 0x4D && byte1 === 0x4D) {
        bigEnd = true; // Big endian (Motorola)
    } else {
        console.log('Not a valid TIFF file');
        displayCameraInformation({});
        displayGPSLocation({});
        displayAuthorInformation({});
        displayAdditionalExif({});
        return;
    }

    // Check TIFF magic number
    const magic = dataView.getUint16(2, !bigEnd);
    if (magic !== 0x002A && magic !== 0x2A00) {
        console.log('Not a valid TIFF magic number');
    }

    // Get first IFD offset
    const ifdOffset = dataView.getUint32(4, !bigEnd);

    // Read IFD0 tags
    readIFD(dataView, ifdOffset, bigEnd, exifData, arrayBuffer);

    // Display extracted data
    displayCameraInformation(exifData);
    displayGPSLocation(exifData);
    displayAuthorInformation(exifData);
    displayAdditionalExif(exifData);
}

function readIFD(dataView, offset, bigEnd, exifData, arrayBuffer) {
    if (offset >= dataView.byteLength - 2) return;

    const numEntries = dataView.getUint16(offset, !bigEnd);
    offset += 2;

    const tagNames = {
        0x010F: 'Make',
        0x0110: 'Model',
        0x0112: 'Orientation',
        0x011A: 'XResolution',
        0x011B: 'YResolution',
        0x0128: 'ResolutionUnit',
        0x0131: 'Software',
        0x0132: 'DateTime',
        0x013B: 'Artist',
        0x8298: 'Copyright',
        0x8769: 'ExifIFDPointer',
        0x8825: 'GPSInfoIFDPointer',
        0x829A: 'ExposureTime',
        0x829D: 'FNumber',
        0x8822: 'ExposureProgram',
        0x8827: 'ISOSpeedRatings',
        0x9003: 'DateTimeOriginal',
        0x9004: 'DateTimeDigitized',
        0x9201: 'ShutterSpeedValue',
        0x9202: 'ApertureValue',
        0x9204: 'ExposureBias',
        0x9205: 'MaxApertureValue',
        0x9207: 'MeteringMode',
        0x9209: 'Flash',
        0x920A: 'FocalLength',
        0xA402: 'ExposureMode',
        0xA403: 'WhiteBalance',
        0xA405: 'FocalLengthIn35mmFilm',
        0xA406: 'SceneCaptureType',
        0xA434: 'LensModel',
        // GPS tags
        0x0001: 'GPSLatitudeRef',
        0x0002: 'GPSLatitude',
        0x0003: 'GPSLongitudeRef',
        0x0004: 'GPSLongitude',
        0x0005: 'GPSAltitudeRef',
        0x0006: 'GPSAltitude',
    };

    for (let i = 0; i < numEntries; i++) {
        if (offset + 12 > dataView.byteLength) break;

        const tag = dataView.getUint16(offset, !bigEnd);
        const type = dataView.getUint16(offset + 2, !bigEnd);
        const count = dataView.getUint32(offset + 4, !bigEnd);
        const valueOffset = offset + 8;

        const tagName = tagNames[tag];

        if (tag === 0x8769) { // ExifIFDPointer
            const exifOffset = dataView.getUint32(valueOffset, !bigEnd);
            readIFD(dataView, exifOffset, bigEnd, exifData, arrayBuffer);
        } else if (tag === 0x8825) { // GPSInfoIFDPointer
            const gpsOffset = dataView.getUint32(valueOffset, !bigEnd);
            readGPSIFD(dataView, gpsOffset, bigEnd, exifData, arrayBuffer);
        } else if (tagName) {
            const value = readTagValue(dataView, type, count, valueOffset, bigEnd, arrayBuffer);
            if (value !== null) {
                exifData[tagName] = value;
            }
        }

        offset += 12;
    }
}

function readGPSIFD(dataView, offset, bigEnd, exifData, arrayBuffer) {
    if (offset >= dataView.byteLength - 2) return;

    const numEntries = dataView.getUint16(offset, !bigEnd);
    offset += 2;

    const gpsTagNames = {
        0x0001: 'GPSLatitudeRef',
        0x0002: 'GPSLatitude',
        0x0003: 'GPSLongitudeRef',
        0x0004: 'GPSLongitude',
        0x0005: 'GPSAltitudeRef',
        0x0006: 'GPSAltitude',
        0x0007: 'GPSTimeStamp',
        0x001D: 'GPSDateStamp',
    };

    for (let i = 0; i < numEntries; i++) {
        if (offset + 12 > dataView.byteLength) break;

        const tag = dataView.getUint16(offset, !bigEnd);
        const type = dataView.getUint16(offset + 2, !bigEnd);
        const count = dataView.getUint32(offset + 4, !bigEnd);
        const valueOffset = offset + 8;

        const tagName = gpsTagNames[tag];
        if (tagName) {
            const value = readTagValue(dataView, type, count, valueOffset, bigEnd, arrayBuffer);
            if (value !== null) {
                exifData[tagName] = value;
            }
        }

        offset += 12;
    }
}

function readTagValue(dataView, type, count, valueOffset, bigEnd, arrayBuffer) {
    const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    const size = (typeSizes[type] || 1) * count;

    let offset = valueOffset;
    if (size > 4) {
        offset = dataView.getUint32(valueOffset, !bigEnd);
    }

    if (offset + size > dataView.byteLength) return null;

    try {
        switch (type) {
            case 1: // BYTE
                return count === 1 ? dataView.getUint8(offset) : null;
            case 2: // ASCII
                let str = '';
                for (let i = 0; i < count - 1; i++) {
                    const char = dataView.getUint8(offset + i);
                    if (char === 0) break;
                    str += String.fromCharCode(char);
                }
                return str.trim();
            case 3: // SHORT
                if (count === 1) {
                    return size > 4 ? dataView.getUint16(offset, !bigEnd) : dataView.getUint16(valueOffset, !bigEnd);
                }
                return null;
            case 4: // LONG
                return dataView.getUint32(size > 4 ? offset : valueOffset, !bigEnd);
            case 5: // RATIONAL
                if (count === 1) {
                    const num = dataView.getUint32(offset, !bigEnd);
                    const den = dataView.getUint32(offset + 4, !bigEnd);
                    return den !== 0 ? num / den : 0;
                } else if (count === 3) { // GPS coordinates
                    const values = [];
                    for (let i = 0; i < 3; i++) {
                        const num = dataView.getUint32(offset + i * 8, !bigEnd);
                        const den = dataView.getUint32(offset + i * 8 + 4, !bigEnd);
                        values.push(den !== 0 ? num / den : 0);
                    }
                    return values;
                }
                return null;
            default:
                return null;
        }
    } catch (e) {
        return null;
    }
}

function extractImageData(file, img, dataUrl, isRaw = false, rawArrayBuffer = null) {
    displayValidationStatus(file, isRaw);

    displayBasicProperties(file, isRaw);

    displayDimensions(img, isRaw);

    displayFileInformation(file);

    if (isRaw && rawArrayBuffer) {
        extractExifFromRaw(rawArrayBuffer);
    } else {
        extractExifData(img, dataUrl);
    }

    resultsSection.style.display = 'block';
}

function displayValidationStatus(file, isRaw = false) {
    const isValid = ALL_SUPPORTED_FORMATS.includes(file.type) || isRaw;
    validationStatus.innerHTML = `
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
                <span class="status-badge ${isValid ? 'status-valid' : 'status-invalid'}">
                    ${isValid ? '✓ Valid Image' : '✗ Invalid Image'}
                </span>
            </span>
        </div>
        ${isRaw ? `
        <div class="info-row">
            <span class="info-label">Note:</span>
            <span class="info-value">RAW file - showing embedded preview</span>
        </div>
        ` : ''}
        <div class="info-row">
            <span class="info-label">Validated:</span>
            <span class="info-value">${new Date().toLocaleString()}</span>
        </div>
    `;
}

function displayBasicProperties(file, isRaw = false) {
    let format;
    if (isRaw) {
        const ext = file.name.split('.').pop().toUpperCase();
        format = `${ext} (RAW)`;
    } else {
        format = file.type.split('/')[1].toUpperCase();
    }
    const mimeType = file.type || 'application/octet-stream';

    basicProperties.innerHTML = `
        <div class="info-row">
            <span class="info-label">Format:</span>
            <span class="info-value">${format}</span>
        </div>
        <div class="info-row">
            <span class="info-label">MIME Type:</span>
            <span class="info-value">${mimeType}</span>
        </div>
        <div class="info-row">
            <span class="info-label">File Name:</span>
            <span class="info-value">${file.name}</span>
        </div>
    `;
}

function displayDimensions(img, isRaw = false) {
    const aspectRatio = (img.width / img.height).toFixed(2);
    const megapixels = ((img.width * img.height) / 1000000).toFixed(2);

    imageDimensions.innerHTML = `
        ${isRaw ? `
        <div class="info-row">
            <span class="info-label">Note:</span>
            <span class="info-value">Preview dimensions (not actual RAW)</span>
        </div>
        ` : ''}
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

function extractExifData(img, dataUrl) {
    EXIF.getData(img, function() {
        const allExifData = EXIF.getAllTags(this);
        
        displayCameraInformation(allExifData);
        
        displayGPSLocation(allExifData);
        
        displayAuthorInformation(allExifData);
        
        displayAdditionalExif(allExifData);
    });
}

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
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                continue;
            }
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
            
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

function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
    }
    return dd;
}

function showError(message) {
    uploadArea.parentElement.style.display = 'none';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function resetApp() {
    fileInput.value = '';
    
    uploadArea.parentElement.style.display = 'block';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    imagePreview.src = '';
    
    cameraCard.style.display = 'none';
    gpsCard.style.display = 'none';
    authorCard.style.display = 'none';
    exifCard.style.display = 'none';
    
    validationStatus.innerHTML = '';
    basicProperties.innerHTML = '';
    imageDimensions.innerHTML = '';
    fileInformation.innerHTML = '';
    cameraInformation.innerHTML = '';
    gpsLocation.innerHTML = '';
    authorInfo.innerHTML = '';
    additionalExif.innerHTML = '';
}

console.log('MetaImageOnline initialized');
