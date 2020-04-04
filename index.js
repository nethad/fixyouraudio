// (async function() {

// const main = async () => {
//   let stream = await navigator.mediaDevices.getUserMedia({
//     audio: true,
//   })
//   let recorder = new RecordRTCPromisesHandler(stream, {
//     type: "video",
//   })
//   recorder.startRecording()

//   const sleep = m => new Promise(r => setTimeout(r, m))
//   await sleep(3000)

//   await recorder.stopRecording()
//   let blob = await recorder.getBlob()
//   // invokeSaveAsDialog(blob)
// }

// main()

/////////////////////////////////////////////////////////////////////////////////

const rtcCompatCheck = () => {
  if (typeof navigator.mediaDevices === "undefined" || !navigator.mediaDevices.getUserMedia) {
    alert("This browser does not supports WebRTC getUserMedia API.")

    if (navigator.getUserMedia) {
      alert("This browser seems supporting deprecated getUserMedia API.")
    }
  }
}

var audio = document.querySelector("audio")

function captureMicrophone(callback) {
  btnReleaseMicrophone.disabled = false

  if (microphone) {
    callback(microphone)
    return
  }

  rtcCompatCheck()

  navigator.mediaDevices
    .getUserMedia({
      audio: {
        echoCancellation: false,
      },
    })
    .then(callback)
    .catch(function(error) {
      alert("Unable to capture your microphone. Please check console logs.")
      console.error(error)
    })
}

function replaceAudio(src) {
  var newAudio = document.createElement("audio")
  newAudio.controls = true
  newAudio.autoplay = true

  if (src) {
    newAudio.src = src
  }

  var parentNode = audio.parentNode
  parentNode.innerHTML = ""
  parentNode.appendChild(newAudio)

  audio = newAudio
}

function stopRecordingCallback() {
  replaceAudio(URL.createObjectURL(recorder.getBlob()))

  btnStartRecording.disabled = false

  setTimeout(function() {
    if (!audio.paused) return

    setTimeout(function() {
      if (!audio.paused) return
      audio.play()
    }, 1000)

    audio.play()
  }, 300)

  audio.play()

  // if (isSafari) {
  //   click(btnReleaseMicrophone)
  // }
}

var isEdge =
  navigator.userAgent.indexOf("Edge") !== -1 &&
  (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

var recorder // globally accessible
var microphone

var btnStartRecording = document.getElementById("btn-start-recording")
var btnStopRecording = document.getElementById("btn-stop-recording")
var btnReleaseMicrophone = document.querySelector("#btn-release-microphone")

btnStartRecording.onclick = function() {
  this.disabled = true
  // this.style.border = ""
  // this.style.fontSize = ""

  if (!microphone) {
    captureMicrophone(function(mic) {
      microphone = mic

      // if (isSafari) {
      //   replaceAudio()

      //   audio.muted = true
      //   audio.srcObject = microphone

      //   btnStartRecording.disabled = false
      //   btnStartRecording.style.border = "1px solid red"
      //   btnStartRecording.style.fontSize = "150%"

      //   alert(
      //     "Please click startRecording button again. First time we tried to access your microphone. Now we will record it.",
      //   )
      //   return
      // }

      click(btnStartRecording)
    })
    return
  }

  replaceAudio()

  audio.muted = true
  audio.srcObject = microphone

  var options = {
    type: "audio",
    numberOfAudioChannels: isEdge ? 1 : 2,
    checkForInactiveTracks: true,
    bufferSize: 16384,
  }

  if (isSafari || isEdge) {
    options.recorderType = StereoAudioRecorder
  }

  if (
    navigator.platform &&
    navigator.platform
      .toString()
      .toLowerCase()
      .indexOf("win") === -1
  ) {
    options.sampleRate = 48000 // or 44100 or remove this line for default
  }

  if (isSafari) {
    options.sampleRate = 44100
    options.bufferSize = 4096
    options.numberOfAudioChannels = 2
  }

  if (recorder) {
    recorder.destroy()
    recorder = null
  }

  recorder = RecordRTC(microphone, options)

  recorder.startRecording()

  //   const sleep = m => new Promise(r => setTimeout(r, m))
  //   await sleep(3000)

  btnStopRecording.disabled = false
}

btnStopRecording.onclick = function() {
  this.disabled = true
  recorder.stopRecording(stopRecordingCallback)
}

btnReleaseMicrophone.onclick = function() {
  this.disabled = true
  btnStartRecording.disabled = false

  if (microphone) {
    microphone.stop()
    microphone = null
  }

  if (recorder) {
    // click(btnStopRecording);
  }
}

function click(el) {
  el.disabled = false // make sure that element is not disabled
  var evt = document.createEvent("Event")
  evt.initEvent("click", true, true)
  el.dispatchEvent(evt)
}
