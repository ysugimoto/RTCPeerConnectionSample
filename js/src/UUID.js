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
