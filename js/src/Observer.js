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
                        if ( confirm('接続名：' + message.accessName + 'からCallが届いています。応答しますか？') ) {
                            this.peer.setRemoteDescription(sessionDescription, function() {
                                this.createAnswer(message.from, message.sdp);
                            }.bind(this));
                        }
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
    remote.volume = 1;
    local.classList.add('connected');
};
Observer.onClosed = function() {
    remote.stop();
    local.classList.remove('connected');
};
