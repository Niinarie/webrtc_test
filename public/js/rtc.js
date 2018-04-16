'use strict';


const constraints = { audio: true, video: true };
const servers = { 'iceServers': [
  { 'urls': 'stun:stun.services.mozilla.com' },
  { 'urls': 'stun:stun.l.google.com:19302' },
  { 'urls': 'turn:numb.viagenie.ca',
  'credential': 'koulustun',
  'username': 'niinarie@metropolia.fi',}] };
const config = {
  servers
}
const socket = io.connect('https://localhost:3000');

const caller = new RTCPeerConnection();
caller.setConfiguration(config);

navigator.mediaDevices.getUserMedia(constraints).then(mediaStream => {
  const video = document.querySelector('#localVideo');
  video.srcObject = mediaStream;
  mediaStream.getTracks().forEach(track => caller.addTrack(track, mediaStream));
}).catch(err => {
  console.log(err.name + ': ' + err.message);
});

caller.onaddstream = evt => {
  console.log('onaddstream called');
  const remoteVideo = document.querySelector('#remoteVideo');
  remoteVideo.srcObject = evt.stream;
};

caller.onicecandidate = (evt) => {
  if (!evt.candidate) return;
  console.log('onicecandidate called');
  console.log(evt);
  onIceCandidate(evt);
};

const onIceCandidate = (evt) => {
  socket.emit('candidate', JSON.stringify(evt.candidate));
};

socket.on('call', (msg) => {
  document.querySelector('#btnActions').style.display = 'block';
  document.querySelector('#btnAccept').addEventListener('click', (evt) => {
    caller.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg).call));
    caller.createAnswer().then((call) => {
      caller.setLocalDescription(new RTCSessionDescription(call));
      socket.emit('answer', JSON.stringify(call));
      document.querySelector('#btnActions').style.display = 'none';
    })
  })
  document.querySelector('#btnDeny').addEventListener('click', (evt) => {
    socket.emit('deny', 'Deny call');
    document.querySelector('#btnActions').style.display = 'none';
  })
});

socket.on('deny', (msg) => {
  document.querySelector('#error').innerHTML= 'Recipient denied the call';
})

socket.on('call answered', (msg) => {
  console.log(msg);
  caller.setRemoteDescription(
    new RTCSessionDescription(JSON.parse(msg))
  );
})

socket.on('candidate', (msg) => {
  console.log(JSON.parse(msg));
  caller.addIceCandidate(new RTCIceCandidate(JSON.parse(msg)));
})

document.getElementById('btnMakeCall').addEventListener('click', (evt) => {
  console.log('clicked!');
  caller.createOffer().then((offer) => {
    return caller.setLocalDescription(offer);
  })
    .then((offer) => {
      socket.emit('call', JSON.stringify({ 'call': caller.localDescription }))
    })
    .catch((reason) => {
      // An error occurred, so handle the failure to connect
    });
  //socket.emit('call', 'hello everyone!');
})

