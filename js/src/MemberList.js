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
