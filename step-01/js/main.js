'use strict';

// On this codelab, you will be streaming only video (video: true).
// 이 코드에서는 단순히 비디오 스트리밍만 할 것이고, 그 설정은 video: true로 하면 된다. false로 바꾸면 안나온다. 
const mediaStreamConstraints = {
  video: true,
};

// Video element where stream will be placed.
// 비디오를 스트리밍할 곳을 지정해준다.
const localVideo = document.querySelector('video');

// Local stream that will be reproduced on the video.
// 비디오에 재생될 로컬 스트림이다.
let localStream;

// Handles success by adding the MediaStream to the video element.
// 미디어 스트림을 비디오의 요소로 추가해 처리한다??
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
// 연결에 에러가 발생시 해당 메세지를 콘솔로그로 출력한다. then cathc 프로미스를 통해 출력.
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

// Initializes media stream.
// 미디어 스트림을 초기화한다.
navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
  .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
