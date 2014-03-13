function DataStream(connection) {
    this.conn      = connection;
    this.callbacks = {};
    this.chunk     = null;
    this.MAX_BYTES = 64 * 1024;
}

DataStream.create = function(connection) {
    var instance =  new DataStream(connection);

    instance.init();
    return instance;
};

DataStream.prototype.init = function() {
    var that = this;

    this.conn.onmessage = function(evt) {
        var chunk = evt.data,
            uint8;

        if ( chunk === "\0" ) {
            this._dispatch('end', this.chunk);
            this.chunk = null;
            return;
        }

        if ( chunk instanceof ArrayBuffer ) {
            if ( this.chunk === null ) {
                uint8 = new Uint8Array(chunk);
            } else {
                uint8 = new Uint8Array(this.chunk.byteLength + chunk.byteLength);
                uint8.set(new Uint8Array(this.chunk), 0);
                uint8.set(new Uint8Array(chunk), this.chunk.byteLength);
            }
            this.chunk = uint8;
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

DataStream.prototype.on = function(type, callback) {
    if ( ! (type in this.callbacks) ) {
        this.callbacks[type] = [];
    }

    this.callbacks[type].push(callback);
};

DataStream.prototype._sendChunk = function(chunk) {
    this.conn.send(chunk);
};

DataStream.prototype._dispatch = function(type, data) {
    if ( type in this.callbacks ) {
        this.callbacks[type].forEach(function(callback) {
            callback(data);
        });
    }
};

DataStream.prototype.send = function(data) {
    var that     = this,
        index    = 0,
        size     = this.getDataSize(data),
        maxBytes = this.MAX_BYTES,
        chunk;

    if ( size > maxBytes ) {
        do {
            if ( index + maxBytes > size ) {
                chunk = data.slice(index, size);
            } else {
                chunk = data.slice(index, index + maxBytes);
            }

            console.log(chunk);
            this._sendChunk(chunk);
            index += maxBytes;
        } while ( size > index );
        this._sendChunk("\0");
        this._dispatch('sended');
        //(function _sendChunk() {
        //    var chunk = data.slice(index, index + maxBytes);

        //    index += maxBytes;
        //    that._sendChunk(chunk);
        //    if ( size > index ) {
        //        _sendChunk();
        //    } else {
        //        that._sendChunk("\0");
        //        that._dispatch('sended');
        //    }
        //})();
    } else {
        this._sendChunk(data);
        this._sendChunk("\0");
        this._dispatch('sended');
    }
};

DataStream.prototype.getDataSize = function(data) {
    return data.byteLength || data.length;
};
