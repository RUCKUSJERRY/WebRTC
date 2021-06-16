'use strict';

// Set up media stream constant and parameters.

// In this codelab, you will be streaming video only: "video: true".
// Audio will not be streamed because it is set to "audio: false" by default.
// 비디오만 출력, 오디오는 설정 안했음, 기본적으로 audio:false로 되어있다는 의미. 근데 난 true로 해본다.
const mediaStreamConstraints = {
  video: true,
  audio: true
};

// Set up to exchange only video.
// Only 비디오만 교환하도록 설정
const offerOptions = {
  offerToReceiveVideo: 1,
};

// Define initial start time of the call (defined as connection between peers).
// 연결의 초기 시작시간을 정의한다? (peers 간의 연결로 정의됨)
let startTime = null;

// Define peer connections, streams and video elements.
// 어느 서로 간의 비디오 요소를 정의
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;


// Define MediaStreams callbacks.
// 미디어스트림의 콜백을 정의한다.

// Sets the MediaStream as the video element src.

function gotLocalMediaStream(mediaStream) {
  localVideo.srcObject = mediaStream;
  localStream = mediaStream;
  trace('gotLocalMediaStream / Received local stream.');
  callButton.disabled = false; 
  // Enable call button.
  // 내 웹캠이 실행되기 전에는 연결하기 버튼을 비활성화 한다.
}

// Handles error by logging a message to the console.
// 오류처리
function handleLocalMediaStreamError(error) {
  trace(`handleLocalMediaStreamError / navigator.getUserMedia error: ${error.toString()}.`);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
// 또 다른 내 웹캡의 미디어 스트림을 전송할 함수
function gotRemoteMediaStream(event) {
  const mediaStream = event.stream;
  remoteVideo.srcObject = mediaStream;
  remoteStream = mediaStream;
  trace('gotRemoteMediaStream / Remote peer connection received remote stream.');
}


// Add behavior for video streams.
// 비디오 스트림에 대한 동작?

// Logs a message with the id and size of a video element.
// 콘솔창에 해당 비디오의 크기와 높이 등을 출력시켜줌
function logVideoLoaded(event) {
  const video = event.target;
  trace(`logVideoLoaded / ${video.id} videoWidth: ${video.videoWidth}px, ` +
        `videoHeight: ${video.videoHeight}px.`);
}

// Logs a message with the id and size of a video element.
// This event is fired when video begins streaming.
// 비디오 스트리밍이 시작될때 발생하는 이벤트
function logResizedVideo(event) {
  logVideoLoaded(event);

  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    startTime = null;
    trace(`logResizedVideo / Setup time: ${elapsedTime.toFixed(3)}ms.`);
  }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);


// Define RTC peer connection behavior.

// Connects with new peer candidate.
// peer 후보와 연결
function handleConnection(event) {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => {
        handleConnectionSuccess(peerConnection);
      }).catch((error) => {
        handleConnectionFailure(peerConnection, error);
      });

    trace(`handleConnection / ${getPeerName(peerConnection)} ICE candidate:\n` +
          `${event.candidate.candidate}.`);
  }
}

// Logs that the connection succeeded.
// 연결 성공시 콘솔 출력
function handleConnectionSuccess(peerConnection) {
  trace(`handleConnectionSuccess / ${getPeerName(peerConnection)} addIceCandidate success.`);
};

// Logs that the connection failed.
// 연결 실패시 콘솔 출력
function handleConnectionFailure(peerConnection, error) {
  trace(`handleConnectionFailure / ${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
        `${error.toString()}.`);
}

// Logs changes to the connection state.
// 연결 상태에 대한 변경사항을 기록
function handleConnectionChange(event) {
  const peerConnection = event.target;
  console.log('ICE state change event: ', event);
  trace(`${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}

// Logs error when setting session description fails.
// 세션 설정이 실패할 때의 출력
function setSessionDescriptionError(error) {
  trace(`setSessionDescriptionError / Failed to create session description: ${error.toString()}.`);
}

// Logs success when setting session description.
// 세션 설정이 성공시 출력
function setDescriptionSuccess(peerConnection, functionName) {
  const peerName = getPeerName(peerConnection);
  trace(`setDescriptionSuccess / ${peerName} ${functionName} complete.`);
}

// Logs success when localDescription is set.
// 메인 웹캠이 설정이 성공하면 출력
function setLocalDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, 'setLocalDescription');
}

// Logs success when remoteDescription is set.
// 연결할 웹캠이 설정이 성공하면 출력
function setRemoteDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

// Logs offer creation and sets peer connection session descriptions.
// 요청 생성과 피어 연결 세션 설명에 대한 설정을 기록
function createdOffer(description) {
  trace(`Offer from localPeerConnection:\n${description.sdp}`);

  trace('localPeerConnection setLocalDescription start.');
  localPeerConnection.setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(localPeerConnection);
    }).catch(setSessionDescriptionError);

  trace('remotePeerConnection setRemoteDescription start.');
  remotePeerConnection.setRemoteDescription(description)
    .then(() => {
      setRemoteDescriptionSuccess(remotePeerConnection);
    }).catch(setSessionDescriptionError);

  trace('remotePeerConnection createAnswer start.');
  remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch(setSessionDescriptionError);
}

// Logs answer to offer creation and sets peer connection session descriptions.
// 요청에 대한 응답과 피어 연결 세션 설명에 대한 설정을 기록
function createdAnswer(description) {
  trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

  trace('remotePeerConnection setLocalDescription start.');
  remotePeerConnection.setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(remotePeerConnection);
    }).catch(setSessionDescriptionError);

  trace('localPeerConnection setRemoteDescription start.');
  localPeerConnection.setRemoteDescription(description)
    .then(() => {
      setRemoteDescriptionSuccess(localPeerConnection);
    }).catch(setSessionDescriptionError);
}


// Define and add behavior to buttons.
// 시작, 연결, 종료 버튼에 대한 동작 정의

// Define action buttons.
// 버튼의 id값을 통해 변수 선언
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
// 초기에는 연결과 종료를 사용하지 못하게 설정. (내 웹캠이 먼저 연결되어야함)
callButton.disabled = true;
hangupButton.disabled = true;


// Handles start button action: creates local MediaStream.
// 내 웹캠을 띄우는 함수
function startAction() {
  startButton.disabled = true;
  // 시작하기 버튼을 비활성화
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
  trace('startAction / Requesting local stream.');
}

// Handles call button action: creates peer connection.
// 연결할 웹캠을 호출하는 함수
function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  // 연결하기 버튼 비활성화
  // 종료하기 버튼 활성화

  trace('callAction / Starting call.');
  startTime = window.performance.now();

  // Get local media stream tracks.
  // 미디어 스트림을 가져온다.
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    trace(`Using video device: ${videoTracks[0].label}.`);
  }
  if (audioTracks.length > 0) {
    trace(`Using audio device: ${audioTracks[0].label}.`);
  }
  // 어떤 장치를 사용하고 있는지 콘솔에 표시

  const servers = null;  // Allows for RTC server configuration. RTC서버 구성 허용???

  // Create peer connections and add behavior.
  // 피어 연결을 만든다. 그리고 동작의 추가한다.
  localPeerConnection = new RTCPeerConnection(servers);
  // 내 웹캠 피어
  trace('Created local peer connection object localPeerConnection.');

  localPeerConnection.addEventListener('icecandidate', handleConnection);
  localPeerConnection.addEventListener(
    'iceconnectionstatechange', handleConnectionChange);

  remotePeerConnection = new RTCPeerConnection(servers);
  // 연결할 웹캠 피어
  trace('Created remote peer connection object remotePeerConnection.');

  remotePeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener(
    'iceconnectionstatechange', handleConnectionChange);
  remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

  // Add local stream to connection and create offer to connect.
  // 로컬스트림에 연결을 추가? 그리고 연결하는 요청을 생성??
  localPeerConnection.addStream(localStream);
  trace('Added local stream to localPeerConnection.');

  trace('localPeerConnection createOffer start.');
  localPeerConnection.createOffer(offerOptions)
    .then(createdOffer).catch(setSessionDescriptionError);
}

// Handles hangup action: ends up call, closes connections and resets peers.
// 연결 종료 함수 각각의 피어커넥션 객체를 종료하고 초기화 한다.
function hangupAction() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  trace('Ending call.');
}

// Add click event handlers for buttons.
// 버튼 클릭시 이밴트 발생
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);


// Define helper functions.

// Gets the "other" peer connection.
// 다른 피어 연결을 가져오는 함수
function getOtherPeer(peerConnection) {
  return (peerConnection === localPeerConnection) ?
      remotePeerConnection : localPeerConnection;
}

// Gets the name of a certain peer connection.
// 피어 연결의 이름을 가져오는 함수
function getPeerName(peerConnection) {
  return (peerConnection === localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
}

// Logs an action (text) and the time when it happened on the console.
// 콘솔에 출력하는 trace
function trace(text) {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}
