function StreamReceiver(connection) {
    this.conn      = connection;
    this.chunk     = null;
    this.callbacks = {};
}

StreamReceiver.create = function(connection) {
    var instance = new StreamReceiver(connection);

    instance.init();
    return instance;
};

StreamReceiver.prototype.on = function(type, callback) {
    if ( ! (type in this.callbacks) ) {
        this.callbacks[type] = [];
    }

    this.callbacks[type].push(callback);
};

StreamReceiver.prototype.init = function() {
    var that = this;

    this.conn.onmessage = function(evt) {
        var chunk = evt.data,
            uint8,
            total;

        if ( chunk === "\0" ) {
            total = this.chunk;
            this.chunk = null;
            this._dispatch('end', total);
            this.chunk = null;
            return;
        }

        if ( chunk instanceof ArrayBuffer ) {
            if ( this.chunk === null ) {
                this.chunk = chunk;
            } else {
                uint8 = new Uint8Array(this.chunk.byteLength + chunk.byteLength);
                uint8.set(new Uint8Array(this.chunk), 0);
                uint8.set(new Uint8Array(chunk), this.chunk.byteLength);

                this.chunk = uint8;
            }
        } else {
            if ( this.chunk === null ) {
                this.chunk = chunk;
            } else {
                this.chunk += chunk;
            }
        }

        this._dispatch('data', chunk);
    }.bind(this);
};

StreamReceiver.prototype._dispatch = function(type, data) {
    if ( type in this.callbacks ) {
        this.callbacks[type].forEach(function(callback) {
            callback(data);
        });
    }
};




