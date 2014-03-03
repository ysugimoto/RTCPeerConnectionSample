// ====================================================
// Drag drop management class
// ====================================================
function DragDrop(node) {
    this.node   = node;
    this.ondrop = null;
}

DragDrop.prototype.start = function(fn) {
    var doc  = document,
        drop = this.node;

    drop.setAttribute('draggable', 'on');
    drop.style.KhtmlUserDrag    = 'element';
    drop.style.WebkitUserDrag   = 'element';
    drop.style.KhtmlUserSelect  = 'none';
    drop.style.WebkitUserSelect = 'none';

    doc.addEventListener('dragenter', this, false);
    doc.addEventListener('dragover',  this, false);
    doc.addEventListener('dragleave', this, false);
    
    // Drop element event handle
    drop.addEventListener('dragenter', this.cancelEvent, false);
    drop.addEventListener('dragover',  this.cancelEvent, false);
    drop.addEventListener('dragleave', this.cancelEvent, false);
    drop.addEventListener('drop',      this,             false);
    console.log('event start');

    this.ondrop = fn || this.ondrop;
};

DragDrop.prototype.cancelEvent = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
};

DragDrop.prototype.handleEvent = function(evt) {
    console.log('event: ' + evt.type);
    switch ( evt.type ) {
        case 'dragenter':
        case 'dragover':
            this.node.style.display = 'block';
            break;

        case 'dragleave':
            if ( evt.target === document.body || evt.clientX <= 0 || evt.clientY <= 0 ) {
                this.node.style.display = 'none';
            }
            break;

        case 'drop':
            this.cancelEvent(evt);

            this.handleDropFile(evt.dataTransfer.files[0]);
            this.node.style.display = 'none';
            break;
    }
};

DragDrop.prototype.handleDropFile = function(file) {
    var fr = new FileReader(),
        fileData = {name: file.fileName || file.name},
        handler = this.ondrop;

    fr.onload = function(evt) {
        fileData.buffer = evt.target.result;
        handler(fileData);
    };

    fr.onerror = function(e) {
        throw new Error('File Read Error');
    };

    fr.readAsArrayBuffer(file);
};

DragDrop.prototype.stop = function() {
    var doc  = document,
        drop = this.node;

    doc.removeEventListener('dragenter', this);
    doc.removeEventListener('dragleave', this);
    drop.removeEventListener('drop',     this);
}

