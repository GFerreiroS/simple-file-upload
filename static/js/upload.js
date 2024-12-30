const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const progressContainer = document.getElementById('progress-container');
const clearButton = document.getElementById('clear-button');
const fileList = document.getElementById('file-list');
let filesData = [];
let nameSortOrder = 'asc'; // Default sort order for name
let timeSortOrder = 'desc'; // Default sort order for time

uploadButton.addEventListener('click', () => {
    const files = fileInput.files;
    if (files.length === 0) {
        alert('Please select files to upload.');
        return;
    }

    for (const file of files) {
        uploadFile(file);
    }
});

clearButton.addEventListener('click', () => {
    const completedBars = document.querySelectorAll('.progress-wrapper.completed');
    completedBars.forEach(bar => bar.remove());
    if (document.querySelectorAll('.progress-wrapper.completed').length === 0) {
        clearButton.style.display = 'none';
    }
});

async function fetchFiles() {
    const response = await fetch('/files');
    filesData = await response.json();
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    filesData.forEach(file => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${file.name}</td>
            <td>${file.time}</td>
        `;
        fileList.appendChild(row);
    });
}

function uploadFile(file) {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const progressWrapper = document.createElement('div');
    progressWrapper.classList.add('progress-wrapper');

    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('progress');

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBar.textContent = '0%';

    progressBarContainer.appendChild(progressBar);
    progressWrapper.appendChild(progressBarContainer);

    const fileName = document.createElement('div');
    fileName.classList.add('file-name');
    fileName.textContent = file.name;

    progressWrapper.appendChild(fileName);
    progressContainer.appendChild(progressWrapper);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.style.width = `${percentComplete}%`;
            progressBar.textContent = `${Math.round(percentComplete)}%`;
        }
    };

    xhr.onload = async () => {
        if (xhr.status === 200) {
            progressBar.textContent = 'Upload Complete';
            progressBar.style.backgroundColor = '#4caf50';
            progressWrapper.classList.add('completed');
            clearButton.style.display = 'inline-block';
            await fetchFiles(); // Refresh the file list
        } else {
            progressBar.textContent = 'Upload Failed';
            progressBar.style.backgroundColor = '#f44336';
        }
    };

    xhr.open('POST', '/upload', true);
    xhr.send(formData);
}

function toggleSort(sortField) {
    if (sortField === 'name') {
        nameSortOrder = nameSortOrder === 'asc' ? 'desc' : 'asc';
        filesData.sort((a, b) =>
            nameSortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
        );
    } else if (sortField === 'time') {
        timeSortOrder = timeSortOrder === 'asc' ? 'desc' : 'asc';
        filesData.sort((a, b) =>
            timeSortOrder === 'asc'
                ? new Date(a.time) - new Date(b.time)
                : new Date(b.time) - new Date(a.time)
        );
    }
    updateFileList();
}

document.getElementById('sort-name').addEventListener('click', () => toggleSort('name'));
document.getElementById('sort-time').addEventListener('click', () => toggleSort('time'));

// Load files on page load
fetchFiles();
