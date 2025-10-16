const {parentPort} = require('worker_threads');
const mic = require('mic');
const fs = require('fs');
const path = require('path');

let micInstance = null;
let micInputStream = null;
let fileOutputStream = null;
let currentTimeout = null;

const startRecording = (outputDirectory) => {
  stopRecording(); // Ensure to stop any ongoing recording first

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filePath = path.join(outputDirectory, `recording_${timestamp}.wav`);

  micInstance = mic({
    rate : '16000',
    channels : '1',
    debug : false,
    exitOnSilence : 6,
  });

  micInputStream = micInstance.getAudioStream();
  fileOutputStream = fs.createWriteStream(filePath);

  // Handle EPIPE errors to prevent crashes
  micInputStream.on('error', (error) => {
    if (error.code === 'EPIPE') {
      console.log('Audio stream closed unexpectedly, this is normal');
    } else {
      console.error('Audio input stream error:', error);
    }
  });

  fileOutputStream.on('error', (error) => {
    if (error.code === 'EPIPE') {
      console.log('Audio output stream closed unexpectedly, this is normal');
    } else {
      console.error('Audio output stream error:', error);
    }
  });

  micInputStream.pipe(fileOutputStream);

  micInstance.start();
};

const stopRecording = () => {
  if (micInputStream) {
    micInputStream.unpipe();
    micInputStream.destroy();
    micInputStream = null;
  }

  if (fileOutputStream) {
    fileOutputStream.end();
    fileOutputStream = null;
  }

  if (micInstance) {
    micInstance.stop();
    micInstance = null;
  }

  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
};

parentPort.on('message', (message) => {
  if (message.command === 'start') {
    startRecording(message.outputDirectory);
  } else if (message.command === 'stop') {
    stopRecording();
  }
});
