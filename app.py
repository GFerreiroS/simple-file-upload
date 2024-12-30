import os
import logging
from flask import Flask, request, render_template, jsonify
from datetime import datetime

app = Flask(__name__)

# Set up the upload folder and allowed extensions
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'alac'}
LOG_FOLDER = './logs'

# Ensure the necessary directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(LOG_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Set up logging to daily log files for detailed request logging
def setup_logging():
    """Set up logging with a daily log file."""
    log_filename = datetime.now().strftime('%d%m%Y.log')
    log_path = os.path.join(LOG_FOLDER, log_filename)

    # Create a log formatter to match the specified format
    log_formatter = logging.Formatter('%(asctime)s - Request %(method)s %(path)s from %(remote_addr)s', datefmt='%Y-%m-%d %H:%M:%S')

    # Set up the logger to log all request information
    log_handler = logging.FileHandler(log_path)
    log_handler.setFormatter(log_formatter)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(log_handler)

    return log_path

# Function to log each request
def log_request():
    """Log the request details including method, path, and IP address."""
    log_path = setup_logging()
    logger = logging.getLogger()

    method = request.method
    path = request.path

    # Extract the client IP address from X-Forwarded-For or fallback to remote_addr
    if 'X-Forwarded-For' in request.headers:
        ip = request.headers['X-Forwarded-For'].split(',')[0].strip()
    else:
        ip = request.remote_addr

    # Log the request with method, path, and IP
    logger.info('', extra={'method': method, 'path': path, 'remote_addr': ip})

# Function to log file upload
def log_upload(file_name):
    """Log the file upload event."""
    log_path = setup_logging()
    logger = logging.getLogger()
    
    logger.info(f'"{file_name}" uploaded!')

    # After logging, check if the log file is empty, and delete it if necessary
    if os.stat(log_path).st_size == 0:
        os.remove(log_path)

@app.before_request
def before_request():
    """Log each incoming request."""
    log_request()

@app.route('/')
def upload_page():
    return render_template('upload.html')

@app.route('/files', methods=['GET'])
def get_files():
    """Return the list of uploaded files with upload times."""
    files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        upload_time = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime('%d/%m/%Y %H:%M:%S')
        files.append({'name': filename, 'time': upload_time})
    return jsonify(sorted(files, key=lambda x: x['name']))

@app.route('/upload', methods=['POST'])
def upload_files():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed: {file.filename}'}), 400

    file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))

    # Log the upload
    log_upload(file.filename)

    return jsonify({'message': 'File uploaded successfully', 'filename': file.filename}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
