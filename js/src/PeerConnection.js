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
                "sdp" :     description,
                "to"  :     id,
                "from":     uuid,
                "accessName": accessName
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
        { audio: true, video: true },
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
