// ====================================================
// Connected member chat class
// ====================================================
function MemberChat(node) {
    this.node    = node;
    this.post    = null;
    this.input   = null;
    this.stub    = null;
    this.upload  = null;
    this.dataChannel   = null;
    this.streamChanne  = null;
    this.isCompositing = false;
    this.beforePost    = "";

    this.stackFiles = [];
    this.fileReceiveAccepted = false;

    this.init();
}

MemberChat.prototype.init = function() {
    this.post   = this.node.querySelector('.post');
    this.input  = this.node.querySelector('#chat');
    this.stub   = doc.createElement('div');

    this.input.addEventListener('keydown',          this, false);
    this.input.addEventListener('compositionstart', this, false);
    this.input.addEventListener('compositionend',   this, false);

    this.input.disabled = true;
};

MemberChat.prototype.start = function(dataChannel, streamChannel) {
    this.dataChannel        = dataChannel;
    this.streamChannel      = streamChannel;
    this.input.disabled     = false;
    this.node.style.opacity = 1;

    this.upload = new DragDrop(this.node.querySelector('#droparea'));
    this.upload.start(function(fileData) {
        console.log('file raded');
        console.log(fileData);

        this.dataChannel.sender.send(JSON.stringify({
            "type": "__FILE_REQUESTED__",
            "data": fileData.name
        }));
        this.stackFiles.push(fileData);
        this.createPost(fileData.name + 'を送信中…');
    }.bind(this));

    this.dataChannel.receiver.on('end', function(data) {
        console.log('datachannel end');
        var json;

        try {
            json = JSON.parse(data);

            switch ( json.type ) {
                case "__TEXT__":
                    this.createPost(json.data, false);
                    break;

                case "__FILE_REQUESTED__":
                    this.confirmFileReceive(json.data);
                    break;

                case "__FILE_ACCEPTED__":
                    this.sendStackedFile(json.data);
                    this.createPost(json.data + 'を送信しました。', true);
                    break;

                case "__FILE_REJECTED__":
                    this.rejectStackFile(json.data);
                    this.createPost(json.data + 'の送信は拒否されました。', true);
                    break;
            }
        } catch ( e ) {
            console.log(e);
            this.createPost(data);
        }
    }.bind(this));

    this.streamChannel.receiver.on('end', function(aryBuf) {
        this.createPost(aryBuf);
    }.bind(this));

    // debug
    this.dataChannel.sender.on('sended', function() {
        console.log('data sended');
    });
    this.dataChannel.receiver.on('data', function(data) {
        console.log('datachannel received');
        console.log(data);
    });
};

MemberChat.prototype.end = function() {
    this.input.disabled     = true;
    this.node.style.opacity = 0.2;

    this.upload.stop();
};

MemberChat.prototype.handleEvent = function(evt) {
    var value;

    switch ( evt.type ) {
        case 'keydown':
            if ( evt.keyCode == 27 ) {
                try {
                    peer.close();
                } catch ( e ) {}
                return;
            }

            value = this.input.value.trim();
            if ( value === "" || this.isCompositing === true || evt.keyCode != 13 ) {
                return;
            }
            evt.preventDefault();
            // simple validation
            if ( value === this.beforePost ) {
                console.log("同じ投稿はやめテ！");
                return;
            }
            this.beforePost  = value;
            this.input.value = "";
            this.dataChannel.sender.send(JSON.stringify({
                "type": "__TEXT__",
                "data": value
            }));
            this.createPost(value, true);
            //websocket.send(JSON.stringify({
            //    "type": PeerConnection.MESSAGE_TYPE_CHAT,
            //    "data": value,
            //    "from": uuid
            //}));
            break;

        case 'compositionstart':
            this.isCompositing = true;
            break;

        case 'compositionend':
            this.isCompositing = false;
            break;
    }
};

MemberChat.prototype.createPost = function(value, isSelf) {
    var div = this.stub.cloneNode(),
        a,
        blob;

    if ( isSelf ) {
        div.classList.add('self');
    }

    if ( value instanceof ArrayBuffer ) {
        a = doc.createElement('a');
        a.download = this.fileReceiveAccepted;
        blob = new Blob([value]);
        a.href = window.webkitURL.createObjectURL(blob);
        a.appendChild(doc.createTextNode(this.fileReceiveAccepted));
        div.appendChild(a);
        this.fileReceiveAccepted = false;
    } else {
        div.appendChild(doc.createTextNode(value));
    }

    if ( this.post.firstChild ) {
        this.post.insertBefore(div, this.post.firstChild);
    } else {
        this.post.appendChild(div);
    }
};

MemberChat.prototype.confirmFileReceive = function(fileName) {
    var conf = confirm(fileName + 'の送信要求が届いています。受信しますか？');

    if ( conf ) {
        this.fileReceiveAccepted = fileName;
        this.dataChannel.sender.send(JSON.stringify({
            "type": "__FILE_ACCEPTED__",
            "data": fileName
        }));
    } else {
        this.fileReceiveAccepted = true;
        this.dataChannel.sender.send(JSON.stringify({
            "type": "__FILE_REJECTED__",
            "data": fileName
        }));
    }
};

MemberChat.prototype.sendStackedFile = function(fileName) {
    console.log(this.stackFiles);
    var file = this.getFile(fileName);

    console.log('stacked file');
    console.log(file);
    if ( ! file ) {
        console.log('Send file is not found.');
        return;
    }

    this.streamChannel.sender.send(file.buffer);
};

MemberChat.prototype.getFile = function(fileName) {
    var fileData,
        size = this.stackFiles.length,
        i    = 0;

    for ( ; i < size; ++i ) {
        if ( this.stackFiles[i].name === fileName ) {
            fileData = this.stackFiles[i];
            this.stackFiles.splice(i, 1);
            break;
        }
    }

    return fileData;
};


MemberChat.prototype.rejectStackFile = function(fileName) {
    // simply delete file object if exists
    this.getFile(fileName);
};
