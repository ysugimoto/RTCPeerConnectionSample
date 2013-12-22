RTCPeerConnectionSample(Server side)
=======================

WebRTC peer connection video chat sample ( chrome only ) at server-side

### How to build
Checkout this project

```
git clone https://github.com/ysugimoto/RTCPeerConnectionSample.git
```

Install depend npm modules

```
npm install
```

Execute node process with server.js

```
node server.js
```

Case: forever

```
npm install -g forever
forver start server.js
```

Case: pm2

```
npm install -g pm2
pm2 start server.js
```
