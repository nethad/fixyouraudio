// import adapter from "webrtc-adapter"
import SoundMeter from "./SoundMeter"

const audioSourcesElement = document.querySelector("#audioSources")
const setupRecordingButton = document.querySelector("#setupRecording")
// const instantMeter = document.querySelector("#instant meter")
// const instantValueDisplay = document.querySelector("#instant .value")

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

const quitStream = (stream) => {
  stream.getTracks().forEach((track) => track.stop())
  return stream
}

const enumerateDevices = (stream) => {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      removeInputDevices()
      window.deviceIds = devices.map((d) => d.deviceId)
      devices.forEach((device) => {
        console.log(device.kind + ": " + device.label + " id = " + device.deviceId)
        console.log(device.toJSON())
        addDevice(device)
      })
    })
    .then(() => quitStream(stream))
    .catch((err) => {
      console.log(err.name + ": " + err.message)
    })
}

const setupRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(enumerateDevices)
}

setupRecordingButton.onclick = setupRecording
