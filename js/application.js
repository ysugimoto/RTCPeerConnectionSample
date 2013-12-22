document.addEventListener('DOMContentLoaded', function() {
    var socketURL  = 'ws://rtc.wnotes.net:8124';
    var doc        = document;
    var remote     = doc.getElementById('remoteVideo');
    var local      = doc.getElementById('localVideo');
    var members    = doc.getElementById('members');
    var server     = [{"url": "stun:stun.l.google.com:19302"}];
    var peer       = null;
    var memberList = null;
    var chat       = null;
    var websokcet  = null;
    var accessName = "";
    var uuid       = "";

// Observer Interface
var Observer   = {};
Observer.onAddStream = function(evt) {
    console.log('Stream attached');
    remote.src = window.webkitURL.createObjectURL(evt.stream);
};

Observer.onRemoveStream = function(evt) {
    remote.src = '';
};
Observer.onNegotiationNeeded = function(evt) {
    this.peer.createOffer(this.onLocalDescrion, this.errorHandler);
};
Observer.onIceCandidate = function(evt) {
    if ( ! evt.candidate ) {
        return;
    }
    websocket.send(JSON.stringify({
        "candidate": evt.candidate,
        "type":      PeerConnection.MESSAGE_TYPE_CANDIDATE
    }));
};
Observer.onWebSocketMessage = function(evt) {
    var message = JSON.parse(evt.data),
        sessionDescription,
        candidate;

    switch ( message.type ) {
        case PeerConnection.MESSAGE_TYPE_SDP:
            sessionDescription = new RTCSessionDescription(message.sdp);
            if ( message.to && message.to === uuid ) {
                switch ( message.sdp_type ) {
                    case PeerConnection.DESCRIPTION_TYPE_OFFER:
                        console.log('Remote description set');
                        console.dir(sessionDescription);
                        this.peer.setRemoteDescription(sessionDescription, function() {
                            this.createAnswer(message.from, message.sdp);
                        }.bind(this));
                        break;

                    case PeerConnection.DESCRIPTION_TYPE_ANSWER:
                        console.log('Local description set');
                        console.dir(sessionDescription);
                        this.peer.setRemoteDescription(sessionDescription);
                        this.observer.onConnectionCompleted();
                        break;
                }
            }
            break;

        case PeerConnection.MESSAGE_TYPE_CANDIDATE:
            if ( message.candidate ) {
                candidate = new RTCIceCandidate(message.candidate);
                this.addIceCandidate(candidate);
            }
            break;

        case PeerConnection.MESSAGE_TYPE_CHAT:
            chat.createPost(message.data, message.from === uuid);
            break;

        case PeerConnection.MEMBER_ADDED:
            memberList.add(message.uuid, message.accessName);
            break;

        case PeerConnection.MEMBER_REMOVED:
            memberList.remove(message.uuid);
            break;
    }
};
Observer.onConnectionCompleted = function() {
    console.log('Peer connection succeed!');
    chat.start();
    local.classList.add('connected');
    document.querySelector('#uuid button').style.display = 'block';
};
Observer.onClosed = function() {
    document.querySelector('#uuid button').style.display = 'none';
    //remote.stop();
    local.classList.remove('connected');
};

// ====================================================
// Peer Connection class
// ====================================================
function PeerConnection(observer) {
    this.observer = this.bindObserver(observer);
    this.peer     = new webkitRTCPeerConnection({"iceServers": server});

    this.init();
    this.getUserMedia();
}

PeerConnection.DESCRIPTION_TYPE_OFFER  = "offer";
PeerConnection.DESCRIPTION_TYPE_ANSWER = "answer";
PeerConnection.MESSAGE_TYPE_SDP        = "sdp";
PeerConnection.MESSAGE_TYPE_CONNECTION = "connection";
PeerConnection.MESSAGE_TYPE_CANDIDATE  = "candidate";
PeerConnection.MESSAGE_TYPE_CHAT       = "chat";
PeerConnection.MEMBER_ADDED            = "member-added";
PeerConnection.MEMBER_REMOVED          = "member-removed";

PeerConnection.prototype.init = function() {
    this.peer.onicecandidate = this.observer.onIceCandidate;
    this.peer.onaddstream    = this.observer.onAddStream;
    websocket.onmessage      = this.observer.onWebSocketMessage;
};

PeerConnection.prototype.close = function() {
    this.peer.close();
    this.obserber.onClosed();
};

PeerConnection.prototype.bindObserver = function(observer) {
    var that = this;

    Object.keys(observer).forEach(function(key) {
        observer[key] = observer[key].bind(that);
    });

    return observer;
};

PeerConnection.prototype.addIceCandidate = function(candidate) {
    this.peer.addIceCandidate(candidate);
};

PeerConnection.prototype.createOffer = function(id) {
    console.log('Offer send: ' + id);
    this.peer.createOffer(function(description) {
        this.peer.setLocalDescription(description, function() {
            websocket.send(JSON.stringify({
                "type":     PeerConnection.MESSAGE_TYPE_SDP,
                "sdp_type": PeerConnection.DESCRIPTION_TYPE_OFFER,
                "sdp" :     description,
                "to"  :     id,
                "from":     uuid
            }));
        });
    }.bind(this));
};

PeerConnection.prototype.createAnswer = function(id, sdp) {
    console.log('Answer send: ' + id);
    this.peer.createAnswer(function(description) {
        this.peer.setLocalDescription(description, function() {
            websocket.send(JSON.stringify({
                "type":     PeerConnection.MESSAGE_TYPE_SDP,
                "sdp_type": PeerConnection.DESCRIPTION_TYPE_ANSWER,
                "sdp" :     description,
                "to"  :     id,
                "from":     uuid
            }));
        });
        this.observer.onConnectionCompleted();
    }.bind(this));
};

PeerConnection.prototype.getUserMedia = function() {
    var peer = this.peer;

    navigator.webkitGetUserMedia(
        { audio: false, video: true },
        function(stream) {
            console.log('Media loaded');
            local.src = window.webkitURL.createObjectURL(stream);
            peer.addStream(stream);
        },
        this.errorHandler
    );
};

PeerConnection.prototype.errorHandler = function(err) {
    console.log(err.name + ':' + err.message);
};

// ====================================================
// Connected member list class
// ====================================================
function MemberList(node) {
    this.node = node;
    this.stub = document.createElement('li');

    this.init();
}

MemberList.prototype.init = function() {
    this.node.addEventListener('click', function(evt) {
        var target,
            id;

        if ( evt.target.tagName === "LI" ) {
            id = evt.target.getAttribute('data-uuid').slice(4);
            peer.createOffer(id);
        }
    }, false);
};

MemberList.prototype.add = function(id, name) {
    if ( id === uuid ) {
        return;
    }

    var li = this.stub.cloneNode();

    li.setAttribute('data-uuid', 'uuid' + id);
    li.appendChild(document.createTextNode('member: ' + name));
    this.node.appendChild(li);
    li.classList.add('active');
};

MemberList.prototype.remove = function(id) {
    var li   = this.node.querySelector('[data-uuid="uuid' + id + '"]'),
        node = this.node;

    if ( li ) {
        li.classList.remove('active');
        setTimeout(function() {
            node.removeChild(li);
        }, 1000);
    }
};

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

// ====================================================
// UUID class
// ====================================================
function UUID() {
    // @see http://codedehitokoto.blogspot.jp/2012/01/javascriptuuid.html
    this.uuid = [
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1),
        (((1+Math.random())*0x10000)|0).toString(16).substring(1)
    ].join("");

    this.init();
}

UUID.prototype.init = function() {
    var sign = doc.createElement('p'),
        node = doc.getElementById('uuid');

    sign.appendChild(doc.createTextNode('Your Peer connection id:  ' + this.uuid));
    node.appendChild(sign);
    node.classList.add('show');
};

UUID.prototype.toString = function() {
    return this.uuid;
};


    // Check connection name
    do {
        accessName = prompt('Enter your access name');
    } while ( accessName === "" );

    if ( accessName === "" ) {
        alert('Connected Canceled.');
        location.reload();
    }

    // Class Instantiate
    websocket  = new WebSocket(socketURL);
    peer       = new PeerConnection(Observer);
    memberList = new MemberList(members);
    chat       = new MemberChat(document.getElementById('chatSection'));
    uuid       = (new UUID())+""; // get string

    websocket.onopen = function() {
        websocket.send(JSON.stringify({
            "type":       PeerConnection.MEMBER_ADDED,
            "accessName": accessName,
            "uuid":       uuid
        }));
    };

    window.addEventListener('unload', function() {
        websocket.send(JSON.stringify({
            "type": PeerConnection.MEMBER_REMOVED,
            "uuid": uuid
        }));
        try {
            peer.close();
        } catch ( e ) {} 
    });
}, false);

