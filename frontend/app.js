document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const statusBox = document.getElementById('uploadStatus');
  const resultsSection = document.getElementById('results');

  statusBox.style.display = 'block';
  statusBox.className = 'status-box loading';
  statusBox.innerHTML = '⏳ Uploading and validating your add-on...';

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    displayResults(data);
    statusBox.className = 'status-box success';
    statusBox.innerHTML = '✅ ' + data.message;
    resultsSection.style.display = 'block';
    form.reset();
    resultsSection.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    statusBox.className = 'status-box error';
    statusBox.innerHTML = `❌ Error: ${error.message}`;
  }
});

function displayResults(data) {
  const detailsContent = document.getElementById('detailsContent');
  const validation = data.validation;

  let html = '<table class="details-table">';
  html += `<tr><td class="detail-label">Pack Name:</td><td>${escapeHtml(document.getElementById('name').value)}</td></tr>`;
  html += `<tr><td class="detail-label">Creator:</td><td>${escapeHtml(document.getElementById('creator').value)}</td></tr>`;
  html += `<tr><td class="detail-label">Version:</td><td>${escapeHtml(document.getElementById('version').value)}</td></tr>`;
  html += `<tr><td class="detail-label">Format:</td><td>${validation.packType}</td></tr>`;
  html += `<tr><td class="detail-label">Has Valid Manifest:</td><td>${validation.hasManifest ? '✅ Yes' : '❌ No'}</td></tr>`;
  html += `<tr><td class="detail-label">Valid UUIDs:</td><td>${validation.hasValidUUID ? '✅ Yes' : '❌ No'}</td></tr>`;
  html += `<tr><td class="detail-label">Min Engine Version:</td><td>${validation.minEngineVersion}</td></tr>`;

  if (validation.contentWarnings && validation.contentWarnings.length > 0) {
    html += `<tr><td class="detail-label">⚠️ Warnings:</td><td>`;
    validation.contentWarnings.forEach(warning => {
      html += `<div>${escapeHtml(warning)}</div>`;
    });
    html += `</td></tr>`;
  }

  html += '</table>';

  detailsContent.innerHTML = html;

  const downloadLink = document.getElementById('downloadMcpack');
  downloadLink.href = data.downloads.mcpack;
  downloadLink.download = `${escapeHtml(document.getElementById('name').value)}.mcpack`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
