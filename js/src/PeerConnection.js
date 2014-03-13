// ====================================================
// Peer Connection class
// ====================================================
function PeerConnection(observer) {
    this.observer    = this.bindObserver(observer);
    this.peer        = new webkitRTCPeerConnection({"iceServers": server});
    this.connected   = false;
    this.personID    = null;

    this.dataChannel   = null;
    this.streamChannel = null;

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
    this.peer.onicecandidate      = this.observer.onIceCandidate;
    this.peer.onaddstream         = this.observer.onAddStream;
    this.peer.onnegotiationneeded = this.observer.onNegotiationNeeded;
    websocket.onmessage           = this.observer.onWebSocketMessage;
};

PeerConnection.prototype.initDataChannel = function(channel) {
    console.log('Initialized data channel');
    this.dataChannel = DataStream.create(channel);
};

PeerConnection.prototype.initFileChannel = function(channel) {
    console.log('Initialized file channel');
    this.streamChannel = DataStream.create(channel);
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
    // crate data channel
    this.initDataChannel(this.peer.createDataChannel('RTCDataConnection'));
    this.initFileChannel(this.peer.createDataChannel('RTCStreamConnection'));
    this.peer.createOffer(function(description) {
        console.log('Offered SDP:' + description);
        this.peer.setLocalDescription(description, function() {
            websocket.send(JSON.stringify({
                "type":     PeerConnection.MESSAGE_TYPE_SDP,
                "sdp" :     description,
                "to"  :     id,
                "from":     uuid,
                "accessName": accessName
            }));
        });
        this.personID = id;
    }.bind(this));
};

PeerConnection.prototype.createAnswer = function(id, sdp) {
    console.log('Answer send: ' + id);
    this.peer.createAnswer(function(description) {
        console.log('Answered SDP:' + description);
        var bit = 0x0;

        this.peer.setLocalDescription(description, function() {
            websocket.send(JSON.stringify({
                "type":     PeerConnection.MESSAGE_TYPE_SDP,
                "sdp" :     description,
                "to"  :     id,
                "from":     uuid
            }));
        });
        this.personID = id;
        this.peer.ondatachannel  = function(evt) {
            console.log('Handled datachannel event');
            console.log(evt);
            switch ( evt.channel.label ) {
                case 'RTCDataConnection':
                    this.initDataChannel(evt.channel);
                    bit |= 0x1;
                    break;

                case 'RTCStreamConnection':
                    this.initFileChannel(evt.channel);
                    bit |= 0x2;
                    break;
            }
            
            if ( (bit ^ 0x3) === 0 ) {
                this.observer.onConnectionCompleted();
            }
        }.bind(this);

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
            websocket.send(JSON.stringify({
                "type":       PeerConnection.MEMBER_ADDED,
                "accessName": accessName,
                "uuid":       uuid
            }));
        },
        this.errorHandler
    );
};


PeerConnection.prototype.errorHandler = function(err) {
    console.log(err.name + ':' + err.message);
};
