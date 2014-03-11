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
    console.log('Negotiation event');
    //this.peer.createOffer(this.onLocalDescrion, this.errorHandler);
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
                switch ( sessionDescription.type ) {
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
            chat.createPost(message.data, false);
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
    chat.start(this.dataChannel, this.streamChannel);
    remote.volume = 1;
    local.classList.add('connected');
};
Observer.onClosed = function() {
    remote.stop();
    chat.end();
    local.classList.remove('connected');
};
Observer.onDataChannelOpened = function() {
    console.log('DataChannel opened.');
    console.log(this.dataChannel);
};
Observer.onDataChannelMessage = function(evt) {
    console.log('DataChannel message received.');
    try {
        var json = JSON.parse(evt.data);

        switch ( json.type ) {
            case "__TEXT__":
                chat.createPost(json.data, false);
                break;

            case "__FILE_REQUESTED__":
                chat.confirmFileReceive(json.data);
                break;

            case "__FILE_ACCEPTED__":
                chat.sendStackedFile(json.data);
                chat.createPost(json.data + 'を送信しました。', true);
                break;

            case "__FILE_REJECTED__":
                chat.rejectStackFile(json.data);
                chat.createPost(json.data + 'の送信は拒否されました。', true);
                break;
        }
    } catch ( e ) {
        console.log(e);
        console.log('file blog received');
        console.log(evt);
        if ( evt.data instanceof ArrayBuffer && chat.fileReceiveAccepted !== false ) {
            chat.createPost(evt.data, false);
        }
    }
};
