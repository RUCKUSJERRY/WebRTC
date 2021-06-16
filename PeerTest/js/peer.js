var peer = new Peer();

peer.on('open', function(id) {
    console.log('my peer ID is : ' + id);
})

