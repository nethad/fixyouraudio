// import adapter from "webrtc-adapter"
import SoundMeter from "./SoundMeter"

const errorMessageElement = document.querySelector("#errorMessage")
const audioSourcesElement = document.querySelector("#audioSources")
const setupRecordingButton = document.querySelector("#setupRecording")
const startRecordingButton = document.querySelector("#startRecording")
const instantMeter = document.querySelector("#volumeMeter meter")
const instantValueDisplay = document.querySelector("#volumeMeter .value")
const audioRecordingsElement = document.querySelector("#audioRecordings tbody")

const showErrorMessage = (message) => {
  errorMessageElement.textContent = message
}

const audioSourceElement = (device) => {
  const rootDiv = document.createElement("div")

  const radioButton = document.createElement("input")
  radioButton.name = "audioInput"
  radioButton.type = "radio"
  radioButton.value = device.deviceId
  radioButton.id = device.deviceId

  const label = document.createElement("label")
  label.for = device.deviceId
  label.textContent = device.label

  rootDiv.appendChild(radioButton)
  rootDiv.appendChild(label)
  return rootDiv
}

const addDevice = (device) => {
  if (device.kind === "audioinput") {
    audioSourcesElement.appendChild(audioSourceElement(device))
  } else {
    // console.log("Some other kind of source/device: ", device)
  }
}

const removeInputDevices = () => {
  Array.from(audioSourcesElement.children).forEach((child) => child.remove())
}

const appendRecording = (src) => {
  let newAudio = document.createElement("audio")
  newAudio.controls = true
  newAudio.autoplay = true

  if (src) {
    newAudio.src = src
  }

  const tr = document.createElement("tr")
  const tdAudio = document.createElement("td")
  tdAudio.appendChild(newAudio)
  tr.append(tdAudio)
  audioRecordingsElement.appendChild(tr)
}

const quitStream = (stream) => {
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

const enumerateDevices = (devices) => {
  removeInputDevices()
  window.deviceIds = devices.map((d) => d.deviceId)
  devices.forEach((device) => {
    addDevice(device)
  })
  setupRecordingButton.textContent = "Refresh devices"
}

const activateFirstDevice = () => {
  audioSourcesElement.children[0].querySelector("input").checked = true
}

const onEnumerateDevices = (stream) => {
  navigator.mediaDevices
    .enumerateDevices()
    .then(enumerateDevices)
    .then(activateFirstDevice)
    .then(() => quitStream(stream))
    .catch((err) => {
      showErrorMessage(err.name + ": " + err.message)
    })
}

const startRecording = (stream) => {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    window.audioContext = new AudioContext()
  } catch (e) {
    showErrorMessage("Web Audio API not supported.")
  }

  const soundMeter = (window.soundMeter = new SoundMeter(window.audioContext))
  let intervalToken

  const setMeterValue = (value) => (instantMeter.value = instantValueDisplay.innerText = value)

  instantMeter.style.visibility = "visible"
  soundMeter.connectToSource(stream, function (e) {
    if (e) {
      showErrorMessage(e)
      return
    }
    intervalToken = setInterval(() => {
      setMeterValue((soundMeter.instant * 2.5).toFixed(2))
    }, 200)
  })

  let options = {
    type: "audio",
    // numberOfAudioChannels: isEdge ? 1 : 2,
    numberOfAudioChannels: 2,
    checkForInactiveTracks: true,
    bufferSize: 16384,
  }
  const recorder = RecordRTC(stream, options)

  const stopRecordingCallback = () => {
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    setMeterValue(0)
    clearInterval(intervalToken)
    instantMeter.style.visibility = "hidden"

    appendRecording(URL.createObjectURL(recorder.getBlob()))
  }

  recorder.setRecordingDuration(3000).onRecordingStopped(stopRecordingCallback)
  recorder.startRecording()
}

const onSetupRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(onEnumerateDevices)
}

const onStartRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(startRecording)
}

setupRecordingButton.onclick = onSetupRecording
startRecordingButton.onclick = onStartRecording
