// ====================================================
// Connected member chat class
// ====================================================
function MemberChat(node) {
    this.node  = node;
    this.post  = null;
    this.input = null;
    this.stub  = null;
    this.isCompositing = false;
    this.beforePost    = "";

    this.init();
}

MemberChat.prototype.init = function() {
    this.post  = this.node.querySelector('.post');
    this.input = this.node.querySelector('#chat');
    this.stub  = doc.createElement('div');

    this.input.addEventListener('keydown',          this, false);
    this.input.addEventListener('compositionstart', this, false);
    this.input.addEventListener('compositionend',   this, false);

    this.input.disabled = true;
};

MemberChat.prototype.start = function() {
    this.input.disabled     = false;
    this.node.style.opacity = 1;
};

MemberChat.prototype.end = function() {
    this.input.disabled     = true;
    this.node.style.opacity = 0.2;
};

MemberChat.prototype.handleEvent = function(evt) {
    var value;

    switch ( evt.type ) {
        case 'keydown':
            if ( evt.keyCode == 27 ) {
                try {
                    peer.close();
                } catch (e ) {}
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
            websocket.send(JSON.stringify({
                "type": PeerConnection.MESSAGE_TYPE_CHAT,
                "data": value,
                "from": uuid
            }));
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
    var div = this.stub.cloneNode();

    if ( isSelf ) {
        div.classList.add('self');
    }

    div.appendChild(doc.createTextNode(value));
    if ( this.post.firstChild ) {
        this.post.insertBefore(div, this.post.firstChild);
    } else {
        this.post.appendChild(div);
    }
};
