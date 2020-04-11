// import adapter from "webrtc-adapter"
import SoundMeter from "./SoundMeter"

import RecordRTC from "./node_modules/recordrtc/RecordRTC"

const errorMessageElement = document.querySelector("#errorMessage")
const audioSourcesElement = document.querySelector("#audioSources")
const setupRecordingButton = document.querySelector("#setupRecording")
const startRecordingButton = document.querySelector("#startRecording")
const debugButton = document.querySelector("#debug")
const instantMeter = document.querySelector("#volumeMeter meter")
const audioRecordingsElement = document.querySelector("#audioRecordings")

const showErrorMessage = (message) => {
  errorMessageElement.textContent = message
}

const currentAudioDeviceIds = () => {
  return Array.from(document.querySelectorAll("input[name=audioInput]")).map((input) => input.id)
}

const selectedDevice = () => {
  const selectedDevice = document.querySelector("input[name=audioInput]:checked")
  return {
    id: selectedDevice.dataset.deviceId,
    label: selectedDevice.dataset.deviceLabel,
  }
}

const audioSourceElement = (device) => {
  const rootDiv = document.createElement("div")

  const radioButton = document.createElement("input")
  radioButton.name = "audioInput"
  radioButton.type = "radio"
  radioButton.value = device.deviceId
  radioButton.id = device.deviceId
  radioButton.dataset.deviceLabel = device.label
  radioButton.dataset.deviceId = device.deviceId

  const label = document.createElement("label")
  label.setAttribute("for", device.deviceId)
  label.textContent = device.label

  rootDiv.appendChild(radioButton)
  rootDiv.appendChild(label)
  return rootDiv
}

const addDevice = (device) => {
  const deviceId = device.deviceId
  if (device.kind === "audioinput") {
    if (!currentAudioDeviceIds().includes(deviceId)) {
      audioSourcesElement.appendChild(audioSourceElement(device))
    }
  }
}

const removeDevices = () => {
  Array.from(audioSourcesElement.children).forEach((child) => child.remove())
}

const appendRecording = (src) => {
  let newAudio = document.createElement("audio")
  newAudio.controls = true
  newAudio.autoplay = true

  if (src) {
    newAudio.src = src
  }

  const rootDiv = document.createElement("div")
  rootDiv.setAttribute("class", "card")
  const labelSection = document.createElement("div")
  labelSection.setAttribute("class", "section")
  labelSection.textContent = selectedDevice().label
  const audioSection = document.createElement("div")
  audioSection.setAttribute("class", "section")
  audioSection.appendChild(newAudio)
  rootDiv.append(labelSection)
  rootDiv.append(audioSection)
  audioRecordingsElement.appendChild(rootDiv)
}

const quitStream = (stream) => {
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

const enumerateDevices = (devices) => {
  removeDevices()
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

const setMeterValue = (value) => (instantMeter.value = value)

const showVolumeMeter = (stream) => {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    window.audioContext = new AudioContext()
  } catch (e) {
    showErrorMessage("Web Audio API not supported.")
  }

  const soundMeter = (window.soundMeter = new SoundMeter(window.audioContext))
  let intervalToken

  instantMeter.style.visibility = "visible"
  soundMeter.connectToSource(stream, (e) => {
    if (e) {
      showErrorMessage(e)
      return
    }
    intervalToken = setInterval(() => {
      setMeterValue((soundMeter.instant * 2.5).toFixed(2))
    }, 200)
  })
  return intervalToken
}

const resetVolumeMeter = (intervalToken) => {
  setMeterValue(0)
  clearInterval(intervalToken)
  instantMeter.style.visibility = "hidden"
}

const finishRecording = (stream, recorder, intervalToken) => {
  stream.getTracks().forEach((track) => {
    track.stop()
  })

  startRecordingButton.disabled = false
  resetVolumeMeter(intervalToken)
  appendRecording(URL.createObjectURL(recorder.getBlob()))
  startRecordingButton.textContent = "Record"
}

const startRecording = (stream) => {
  const intervalToken = showVolumeMeter(stream)

  let options = {
    type: "audio",
    // numberOfAudioChannels: isEdge ? 1 : 2,
    numberOfAudioChannels: 2,
    checkForInactiveTracks: true,
    bufferSize: 16384,
  }
  const recorder = RecordRTC(stream, options)

  recorder
    .setRecordingDuration(2000)
    .onRecordingStopped(() => finishRecording(stream, recorder, intervalToken))
  recorder.startRecording()
  startRecordingButton.disabled = true
  startRecordingButton.textContent = "Recording..."
}

const onSetupRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(onEnumerateDevices)
}

const onStartRecording = () => {
  navigator.mediaDevices
    .getUserMedia({ audio: { deviceId: selectedDevice().id } })
    .then(startRecording)
}

setupRecordingButton.onclick = onSetupRecording
startRecordingButton.onclick = onStartRecording
debugButton.onclick = () => {
  console.log(selectedDevice())
}
