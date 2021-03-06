      var bufferRx = null;
      var brx = new Uint8Array(256);
      var availableNetworks = [];
  
      function lockoutSubmit(button) {
          var oldValue = button.value;
  
          button.setAttribute('disabled', true);
          button.value = '...processing...';
  
          setTimeout(function(){
              button.value = oldValue;
              button.removeAttribute('disabled');
          }, 5000)
      }
  
      function selectConfig(configId) {
          paramFreqDelta.value = 1;
          paramFreqStart.value = 40;
          paramFramesPerTx.value = 9;
          paramBytesPerTx.value = 3;
  
          if (configId == 1) {
              paramFreqDelta.value = 1;
              paramFreqStart.value = 40;
              paramFramesPerTx.value = 6;
              paramBytesPerTx.value = 3;
          }
  
          if (configId == 2) {
              paramFreqDelta.value = 1;
              paramFreqStart.value = 40;
              paramFramesPerTx.value = 3;
              paramBytesPerTx.value = 3;
          }
  
          if (configId == 3) {
              paramFreqDelta.value = 1;
              paramFreqStart.value = 320;
              paramFramesPerTx.value = 9;
              paramBytesPerTx.value = 3;
          }
  
          if (configId == 4) {
              paramFreqDelta.value = 4;
              paramFreqStart.value = 40;
              paramFramesPerTx.value = 9;
              paramBytesPerTx.value = 3;
          }
  
          if (configId == 5) {
              paramFreqDelta.value = 2;
              paramFreqStart.value = 40;
              paramFramesPerTx.value = 18;
              paramBytesPerTx.value = 6;
          }
  
          if (configId == 6) {
              paramFreqDelta.value = 2;
              paramFreqStart.value = 40;
              paramFramesPerTx.value = 9;
              paramBytesPerTx.value = 6;
          }
  
          if (configId == 7) {
              paramFreqDelta.value = 4;
              paramFreqStart.value = 320;
              paramFramesPerTx.value = 9;
              paramBytesPerTx.value = 3;
          }
  
          Module.cwrap('setTxMode','',['number'])(0); // Fixed length mode
          Module.cwrap('setParameters','',['number','number','number','number','number','number','number'])(
              paramFreqDelta.value,
              paramFreqStart.value,
              paramFramesPerTx.value,
              paramBytesPerTx.value,
              0,
              paramVolume.value);
      }
  
      function updateScroll(sName) {
          val = document.getElementById('param'+sName).value;
          document.getElementById('param'+sName+'Scroll').innerHTML = val;
  
          Module.cwrap('setParameters','',['number','number','number','number','number','number','number'])(
              paramFreqDelta.value,
              paramFreqStart.value,
              paramFramesPerTx.value,
              paramBytesPerTx.value,
              0,
              paramVolume.value);
      }
  
      function getSampleRate() {
          if (typeof Module === 'undefined') return;
          var sampleRate = Module.cwrap('getSampleRate', 'number', [''])();
      }
  
      var isiOS = /iPad|iPhone|iPod|CriOS/.test(navigator.userAgent) && !window.MSStream;
      var isInitialized = false;
      var isAudioContextUnlocked = !isiOS;
  
      var htmlGreenLED  = "<div class=\"led-green\"></div>";
      var htmlRedLED    = "<div class=\"led-red\"></div>";
      var htmlYellowLED = "<div class=\"led-yellow\"></div>";
  
      function checkStatus() {
          var hasDeviceOutput = Module.cwrap('hasDeviceOutput', 'number', [''])();
          {
              var el = document.getElementById('has-device-output');
              if (hasDeviceOutput != 0 && isAudioContextUnlocked) {
                  if (el.innerHTML != htmlGreenLED) {
                      el.innerHTML = htmlGreenLED;
                  }
              } else {
                  if (el.innerHTML != htmlRedLED) {
                      el.innerHTML = htmlRedLED;
                  }
              }
          }
  
          var hasDeviceCapture = Module.cwrap('hasDeviceCapture', 'number', [''])();
          {
              var el = document.getElementById('has-device-capture');
              if (hasDeviceCapture != 0) {
                  if (el.innerHTML != htmlGreenLED) {
                      el.innerHTML = htmlGreenLED;
                  }
              } else {
                  if (el.innerHTML != htmlRedLED) {
                      el.innerHTML = htmlRedLED;
                  }
              }
          }
  
          var isBrowserSupported = !isiOS;
          {
              var el = document.getElementById('is-browser-supported');
              if (isBrowserSupported) {
                  if (el.innerHTML != htmlGreenLED) {
                      el.innerHTML = htmlGreenLED;
                  }
              } else {
                  if (el.innerHTML != htmlYellowLED) {
                      el.innerHTML = htmlYellowLED;
                  }
              }
          }
  
          var isWebRTCSupported = availableNetworks.length;
          {
              var el = document.getElementById('is-webrtc-supported');
              if (isWebRTCSupported) {
                  if (el.innerHTML != htmlGreenLED) {
                      el.innerHTML = htmlGreenLED;
                  }
              } else {
                  if (el.innerHTML != htmlYellowLED) {
                      el.innerHTML = htmlYellowLED;
                  }
              }
          }
      }
  
      var statusElement = document.getElementById('statusEm');
      var progressElement = document.getElementById('progressEm');
      var spinnerElement = document.getElementById('spinnerEm');
  
      var Module = {
          doNotCaptureKeyboard: true,
          pre: [],
          preRun: [(function() {
              let constraints = {
                  audio: {
                      echoCancellation: false,
                      autoGainControl: false,
                      noiseSuppression: false
                  }
              };
  
              let mediaInput = navigator.mediaDevices.getUserMedia( constraints );
          }) ],
          postRun: [ (function() { document.getElementById("butInit").disabled = false; }) ],
          print: (function() {
              var element = document.getElementById('output');
              if (element) element.alue = ''; // clear browser cache
              return function(text) {
                  if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                  console.log(text);
                  if (element) {
                      element.value += text + "\n";
                      element.scrollTop = element.scrollHeight; // focus on bottom
                  }
              };
          })(),
          printErr: function(text) {
              if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
              console.error(text);
          },
          setStatus: function(text) {
              if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
              if (text === Module.setStatus.text) return;
              var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
              var now = Date.now();
              if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
              if (m) {
                  text = m[1];
                  progressElement.value = parseInt(m[2])*100;
                  progressElement.max = parseInt(m[4])*100;
                  progressElement.hidden = false;
                  spinnerElement.hidden = false;
              } else {
                  progressElement.value = null;
                  progressElement.max = null;
                  progressElement.hidden = true;
                  if (!text) spinnerElement.style.display = 'none';
              }
              statusElement.innerHTML = text;
          },
          totalDependencies: 0,
          monitorRunDependencies: function(left) {
              this.totalDependencies = Math.max(this.totalDependencies, left);
              Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
          }
      };
  
      function doInit() {
          if (isInitialized == false) {
              Module.cwrap('doInit', 'number', [''])();
  
              e = document.getElementById('waveConfig');
              selectConfig(e.options[e.selectedIndex].value);
  
              updateScroll('Volume');
              bufferRx = Module._malloc(256);
              setInterval(updatePeerInfo, 100);
              setInterval(checkRxForPeerData, 1000);
              setInterval(checkStatus, 1000);
              getIPs(function(ip){
                  availableNetworks.push(ip);
                  var sel = document.getElementById('available-networks');
                  var opt = document.createElement("option");
                  opt.value = ip;
                  opt.text = ip;
  
                  sel.appendChild(opt);
              });
              isInitialized = true;
          }
  
          playSound("/media/plucky");
          var x = document.getElementById("main-controls");
          x.hidden = false;
      }
  
      Module.setStatus('Initializing...');
      window.onerror = function(event) {
          Module.setStatus('Exception thrown, see JavaScript console');
          spinnerElement.style.display = 'none';
          Module.setStatus = function(text) {
              if (text) Module.printErr('[post-exception status] ' + text);
          };
      };
  
      window.addEventListener('touchstart', function() {
          if (isAudioContextUnlocked == false && SDL2.audioContext) {
              var buffer = SDL2.audioContext.createBuffer(1, 1, 22050);
              var source = SDL2.audioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(SDL2.audioContext.destination);
              source.start();
  
              setTimeout(function() {
                  if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                      isAudioContextUnlocked = true;
                      Module.setStatus('Wab Audio API unlocked successfully!');
                  } else {
                      Module.setStatus('Failed to unlock Web Audio APIi. This browser seems to not be supported');
                  }
              }, 0);
          }
      }, false);
  
      function playSound(filename){
         document.getElementById("sound").innerHTML='<audio id="soundInner"><source src="' + filename + '.wav" type="audio/mpeg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
         document.getElementById("soundInner").volume = paramVolume.value/100.0;
         document.getElementById("soundInner").play();
      }
  