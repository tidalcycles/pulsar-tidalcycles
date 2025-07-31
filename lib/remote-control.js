'use babel'

import {remote} from 'electron'
// import AudioMotionAnalyzer from "./audioMotion-analyzer";
//import AudioMotionAnalyzer from './audiomotion-analyzer';
const AudioMotionAnalyzer = require('./audioMotion-analyzer').default;
const osc = require('osc-min');
const dgram = require('dgram');
import OscServer from "./osc-server";

const { systemPreferences } = remote

window.systemPreferences = systemPreferences

export default class RemoteControl {


  constructor(consoleView) {
    this.consoleView = consoleView;

    this.container = null
    this.audioAnalyzerDiv = null
    this.udpClient = null
    this.activeButton = null
    this.audioMotion = null
    this.micstream = null
    this.buttons = []
    this.buttonBorderColor = "#00ff89";
    this.songTitleHeadline = null;
  }

  init() {
    this.container = document.createElement('div')
    this.container.classList.add('atom-remote-control')
    this.container.style.overflowY = 'scroll'
    this.audioAnalyzerDiv = document.createElement('div');
    this.udpClient = dgram.createSocket('udp4');
    this.audioMotion = new AudioMotionAnalyzer(
      this.audioAnalyzerDiv,
      {
        height: 350,
        showScaleY: true,
        radial: true,
        radius: 0.5,
        minDecibels: -85,
        maxDecibels: -20,
        showBgColor: false,
        overlay: true
      }
    );

    atom.workspace.open({
      element: this.container,
      getTitle: () => 'Remote Control',
      getURI: () => 'atom://tidalcycles/remote-control',
      getDefaultLocation: () => 'left'
    }, { activatePane: false });

    this.container.appendChild(this.generateHTML());
  }

  oscPulsarButtons() {
    return (args: {}): void => {
        const message = OscServer.asDictionary(args);

        console.log(">>> Pulsar Buttons message received", message, this);

        this.buttons.forEach((item, i) => {
          item.className = `flex-item${message["enabled"] < i + 1 ? ' flex-item-disabled' : ''}`
          item.style.cssText = `border: 5px solid ${message["color"]} !important;`;
        });

        this.buttonBorderColor = message["color"];
    }
  }

  oscPulsarButton() {
    return (args: {}): void => {
        const message = OscServer.asDictionary(args);

        const boxShadowStyle = `box-shadow: 0 0 7px 4px ${this.buttonBorderColor} !important;`;

        if (this.activeButton != null && this.activeButton != this.buttons[message["index"]]) {
          this.activeButton.style.cssText = `border: 5px solid ${this.buttonBorderColor} !important;`;
        }

        this.buttons[message["index"]].style.cssText = `border: 5px solid ${this.buttonBorderColor} !important; ${boxShadowStyle}`;
        this.activeButton = this.buttons[message["index"]];
    }
  }

  oscPulsarHeadlines() {
    return (args: {}): void => {
        const message = OscServer.asDictionary(args);

        this.songTitleHeadline.innerText = message["songTitle"];
    }
  }

  oscPulsarAudio() {
    return (args: {}): void => {
        const message = OscServer.asDictionary(args);

        this.changeAudioDevice(message["device"]);
    }
  }

  oscPulsarGradient() {
    return (args: {}): void => {
        const message = OscServer.asDictionary(args);

        this.audioMotion.gradient = message["gradient"];
    }
  }

  changeAudioDevice(audioName) {

    // Free audio stream
    this.audioMotion.disconnectInput( this.micStream, true );


    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      console.log("DEVICES", devices);
       const inputDevice = devices.find(({ kind, label }) => kind === 'audioinput' && label === audioName);
      console.log("INPUT DEVICE", inputDevice);

       navigator.mediaDevices.getUserMedia({
         audio: { deviceId: inputDevice.deviceId },
         video: false
       }).then(stream => {
           console.log("STREAM", stream);
           // create stream using audioMotion audio context
           this.micStream = this.audioMotion.audioCtx.createMediaStreamSource( stream );
           console.log("MICSTREAM", this.micStream);
           // connect microphone stream to analyzer
           this.audioMotion.connectInput( this.micStream );
           // mute output to prevent feedback loops from the speakers
           this.audioMotion.volume = 0;
         });
       });
  }

  // Function to generate the HTML code
  generateHTML() {
    // Create a div for each headline
    const artistHeadline = document.createElement('div');
    artistHeadline.className = 'tidalcycles-remote-control-headline';
    artistHeadline.innerText = "MR.REASON";

    this.songTitleHeadline = document.createElement('div');
    this.songTitleHeadline.className = 'tidalcycles-remote-control-headline';
    this.songTitleHeadline.innerText = "FOREST SPIRIT";


    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex-container';

    // Create buttons dynamically
    Array.from({ length: 16 }, (_, index) => {
        const buttonText = index + 1;
        const isDisabled = index >= 13;

        const button = document.createElement('button');
        button.id = `tidalcycles-remote-control-button-${index}`;
        button.className = `flex-item${isDisabled ? ' flex-item-disabled' : ''}`;
        button.innerText = buttonText;

        button.addEventListener('click', () => {
          const boxShadowStyle = `box-shadow: 0 0 7px 4px ${this.buttonBorderColor} !important;`;

          if (this.activeButton != null && this.activeButton != button) {
            this.activeButton.style.cssText = `border: 5px solid ${this.buttonBorderColor} !important;`;
          }

          this.sendOSCMessage('/SuperDirtMixer/midiControlButton', [index], 57120, 'localhost');
          this.sendOSCMessage('/pulsar/remote-control/index', [index], 57120, 'localhost');
          this.sendOSCMessage('/pulsar/remote-control/preset', ['factory'], 57120, 'localhost');

          button.style.cssText = `border: 5px solid ${this.buttonBorderColor} !important; ${boxShadowStyle}`;
          this.activeButton = button;
        });

        buttonsContainer.appendChild(button);

        this.buttons.push(button);
    });


    if ( navigator.mediaDevices ) {

      systemPreferences.askForMediaAccess("microphone");

      navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
      .then( stream => {
        // create stream using audioMotion audio context
        this.micStream = this.audioMotion.audioCtx.createMediaStreamSource( stream );
        // connect microphone stream to analyzer
        this.audioMotion.connectInput( this.micStream );
        // mute output to prevent feedback loops from the speakers
        this.audioMotion.volume = 0;
      })
      .catch( err => {
        alert('Microphone access denied by user');
        console.log("ERROR", err);
      });
    }

    const containerDiv = document.createElement('div');
      containerDiv.innerHTML = ''; // Clear any previous content
      containerDiv.append(artistHeadline, this.songTitleHeadline, buttonsContainer, this.audioAnalyzerDiv);

      return containerDiv;
  }


  destroy() {
    this.container.remove();
    this.udpClient = null;
    this.audioMotion = null;
    this.micstream = null
  }

  sendOSCMessage(address, args, port, host) {
     const buffer = osc.toBuffer({
       address: address,
           args: args
     });

     this.udpClient.send(buffer, 0, buffer.length, port, host, (err) => {
       if (err) {
         console.error('Error sending OSC message:', err);
       }
       /* else {
         console.log(`Sent OSC message to ${host}:${port} with buffer length ${buffer.length}`);
       } */
     });
  }
}
