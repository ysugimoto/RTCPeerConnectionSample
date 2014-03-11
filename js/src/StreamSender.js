function StreamSender(connection) {
    this.conn      = connection;
    this.callbacks = {};
    this.MAX_BYTES = 64 * 1024;
}

StreamSender.create = function(connection) {
    var instance = new StreamSender(connection);

    instance.init();
    return instance;
};

StreamSender.prototype.init = function() {
    // do something
};

StreamSender.prototype.on = function(type, callback) {
    if ( ! (type in this.callbacks) ) {
        this.callbacks[type] = [];
    }

    this.callbacks[type].push(callback);
};

StreamSender.prototype._chunkSend = function(chunk) {
    this.conn.send(chunk);
};

StreamSender.prototype._dispatch = function(type, data) {
    if ( type in this.callbacks ) {
        this.callbacks[type].forEach(function(callback) {
            callback(data);
        });
    }
};

StreamSender.prototype.send = function(data) {
    var that  = this,
        index = 0,
        size  = this.getDataSize(data),
        maxBytes = this.MAX_BYTES;

    if ( size > maxBytes ) {
        (function _chunkSend() {
            var chunk = data.slice(index, index + maxBytes);

            index += maxBytes;
            that._chunkSend(chunk);
            if ( size > index ) {
                setTimeout(_chunkSend, 10);
            } else {
                that._chunkSend("\0");
                that._dispatch('sended');
            }
        })();
    } else {
        this._chunkSend(data);
        this._chunkSend("\0");
        this._dispatch('sended');
    }
};

StreamSender.prototype.getDataSize = function(data) {
    return data.byteLength || data.length;
};
