var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/audioMotion-analyzer.js
var audioMotion_analyzer_exports = {};
__export(audioMotion_analyzer_exports, {
  default: () => AudioMotionAnalyzer
});
module.exports = __toCommonJS(audioMotion_analyzer_exports);
var VERSION = "4.4.0";
var PI = Math.PI;
var TAU = 2 * PI;
var HALF_PI = PI / 2;
var C_1 = 8.17579892;
var CHANNEL_COMBINED = "dual-combined";
var CHANNEL_HORIZONTAL = "dual-horizontal";
var CHANNEL_SINGLE = "single";
var CHANNEL_VERTICAL = "dual-vertical";
var COLOR_BAR_INDEX = "bar-index";
var COLOR_BAR_LEVEL = "bar-level";
var COLOR_GRADIENT = "gradient";
var DEBOUNCE_TIMEOUT = 60;
var EVENT_CLICK = "click";
var EVENT_FULLSCREENCHANGE = "fullscreenchange";
var EVENT_RESIZE = "resize";
var GRADIENT_DEFAULT_BGCOLOR = "#111";
var FILTER_NONE = "";
var FILTER_A = "A";
var FILTER_B = "B";
var FILTER_C = "C";
var FILTER_D = "D";
var FILTER_468 = "468";
var FONT_FAMILY = "sans-serif";
var FPS_COLOR = "#0f0";
var LEDS_UNLIT_COLOR = "#7f7f7f22";
var MODE_GRAPH = 10;
var REASON_CREATE = "create";
var REASON_FSCHANGE = "fschange";
var REASON_LORES = "lores";
var REASON_RESIZE = EVENT_RESIZE;
var REASON_USER = "user";
var SCALEX_BACKGROUND_COLOR = "#000c";
var SCALEX_LABEL_COLOR = "#fff";
var SCALEX_HIGHLIGHT_COLOR = "#4f4";
var SCALEY_LABEL_COLOR = "#888";
var SCALEY_MIDLINE_COLOR = "#555";
var SCALE_BARK = "bark";
var SCALE_LINEAR = "linear";
var SCALE_LOG = "log";
var SCALE_MEL = "mel";
var PRISM = ["#a35", "#c66", "#e94", "#ed0", "#9d5", "#4d8", "#2cb", "#0bc", "#09c", "#36b"];
var GRADIENTS = [
  ["classic", {
    colorStops: [
      "red",
      { color: "yellow", level: 0.85, pos: 0.6 },
      { color: "lime", level: 0.475 }
    ]
  }],
  ["prism", {
    colorStops: PRISM
  }],
  ["rainbow", {
    dir: "h",
    colorStops: ["#817", ...PRISM, "#639"]
  }],
  ["orangered", {
    bgColor: "#3e2f29",
    colorStops: ["OrangeRed"]
  }],
  ["steelblue", {
    bgColor: "#222c35",
    colorStops: ["SteelBlue"]
  }]
];
var DEFAULT_SETTINGS = {
  alphaBars: false,
  ansiBands: false,
  barSpace: 0.1,
  bgAlpha: 0.7,
  channelLayout: CHANNEL_SINGLE,
  colorMode: COLOR_GRADIENT,
  fftSize: 8192,
  fillAlpha: 1,
  frequencyScale: SCALE_LOG,
  gradient: GRADIENTS[0][0],
  height: void 0,
  ledBars: false,
  linearAmplitude: false,
  linearBoost: 1,
  lineWidth: 0,
  loRes: false,
  lumiBars: false,
  maxDecibels: -25,
  maxFPS: 0,
  maxFreq: 22e3,
  minDecibels: -85,
  minFreq: 20,
  mirror: 0,
  mode: 0,
  noteLabels: false,
  outlineBars: false,
  overlay: false,
  peakLine: false,
  radial: false,
  radialInvert: false,
  radius: 0.3,
  reflexAlpha: 0.15,
  reflexBright: 1,
  reflexFit: true,
  reflexRatio: 0,
  roundBars: false,
  showBgColor: true,
  showFPS: false,
  showPeaks: true,
  showScaleX: true,
  showScaleY: false,
  smoothing: 0.5,
  spinSpeed: 0,
  splitGradient: false,
  start: true,
  trueLeds: false,
  useCanvas: true,
  volume: 1,
  weightingFilter: FILTER_NONE,
  width: void 0
};
var ERR_AUDIO_CONTEXT_FAIL = ["ERR_AUDIO_CONTEXT_FAIL", "Could not create audio context. Web Audio API not supported?"];
var ERR_INVALID_AUDIO_CONTEXT = ["ERR_INVALID_AUDIO_CONTEXT", "Provided audio context is not valid"];
var ERR_UNKNOWN_GRADIENT = ["ERR_UNKNOWN_GRADIENT", "Unknown gradient"];
var ERR_FREQUENCY_TOO_LOW = ["ERR_FREQUENCY_TOO_LOW", "Frequency values must be >= 1"];
var ERR_INVALID_MODE = ["ERR_INVALID_MODE", "Invalid mode"];
var ERR_REFLEX_OUT_OF_RANGE = ["ERR_REFLEX_OUT_OF_RANGE", "Reflex ratio must be >= 0 and < 1"];
var ERR_INVALID_AUDIO_SOURCE = ["ERR_INVALID_AUDIO_SOURCE", "Audio source must be an instance of HTMLMediaElement or AudioNode"];
var ERR_GRADIENT_INVALID_NAME = ["ERR_GRADIENT_INVALID_NAME", "Gradient name must be a non-empty string"];
var ERR_GRADIENT_NOT_AN_OBJECT = ["ERR_GRADIENT_NOT_AN_OBJECT", "Gradient options must be an object"];
var ERR_GRADIENT_MISSING_COLOR = ["ERR_GRADIENT_MISSING_COLOR", "Gradient colorStops must be a non-empty array"];
var AudioMotionError = class extends Error {
  constructor(error, value) {
    const [code, message] = error;
    super(message + (value !== void 0 ? `: ${value}` : ""));
    this.name = "AudioMotionError";
    this.code = code;
  }
};
var deprecate = (name, alternative) => console.warn(`${name} is deprecated. Use ${alternative} instead.`);
var isEmpty = (obj) => {
  for (const p in obj)
    return false;
  return true;
};
var validateFromList = (value, list, modifier = "toLowerCase") => list[Math.max(0, list.indexOf(("" + value)[modifier]()))];
var findY = (x1, y1, x2, y2, x) => y1 + (y2 - y1) * (x - x1) / (x2 - x1);
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(callback) {
    let index = this.length;
    while (index-- > 0) {
      if (callback(this[index]))
        return index;
    }
    return -1;
  };
}
var AudioMotionAnalyzer = class {
  /**
   * CONSTRUCTOR
   *
   * @param {object} [container] DOM element where to insert the analyzer; if undefined, uses the document body
   * @param {object} [options]
   * @returns {object} AudioMotionAnalyzer object
   */
  constructor(container, options = {}) {
    this._ready = false;
    this._aux = {};
    this._canvasGradients = [];
    this._destroyed = false;
    this._energy = { val: 0, peak: 0, hold: 0 };
    this._flg = {};
    this._fps = 0;
    this._gradients = {};
    this._last = 0;
    this._outNodes = [];
    this._ownContext = false;
    this._selectedGrads = [];
    this._sources = [];
    if (!(container instanceof Element)) {
      if (isEmpty(options) && !isEmpty(container))
        options = container;
      container = null;
    }
    this._ownCanvas = !(options.canvas instanceof HTMLCanvasElement);
    const canvas = this._ownCanvas ? document.createElement("canvas") : options.canvas;
    canvas.style = "max-width: 100%;";
    this._ctx = canvas.getContext("2d");
    for (const [name, options2] of GRADIENTS)
      this.registerGradient(name, options2);
    this._container = container || !this._ownCanvas && canvas.parentElement || document.body;
    this._defaultWidth = this._container.clientWidth || 640;
    this._defaultHeight = this._container.clientHeight || 270;
    let audioCtx;
    if (options.source && (audioCtx = options.source.context)) {
    } else if (audioCtx = options.audioCtx) {
    } else {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._ownContext = true;
      } catch (err) {
        throw new AudioMotionError(ERR_AUDIO_CONTEXT_FAIL);
      }
    }
    if (!audioCtx.createGain)
      throw new AudioMotionError(ERR_INVALID_AUDIO_CONTEXT);
    const analyzer = this._analyzer = [audioCtx.createAnalyser(), audioCtx.createAnalyser()];
    const splitter = this._splitter = audioCtx.createChannelSplitter(2);
    const merger = this._merger = audioCtx.createChannelMerger(2);
    this._input = audioCtx.createGain();
    this._output = audioCtx.createGain();
    if (options.source)
      this.connectInput(options.source);
    for (const i of [0, 1])
      splitter.connect(analyzer[i], i);
    merger.connect(this._output);
    if (options.connectSpeakers !== false)
      this.connectOutput();
    for (const ctx of ["_scaleX", "_scaleR"])
      this[ctx] = document.createElement("canvas").getContext("2d");
    this._fsEl = options.fsElement || canvas;
    const onResize = () => {
      if (!this._fsTimeout) {
        this._fsTimeout = window.setTimeout(() => {
          if (!this._fsChanging) {
            this._setCanvas(REASON_RESIZE);
            this._fsTimeout = 0;
          }
        }, DEBOUNCE_TIMEOUT);
      }
    };
    if (window.ResizeObserver) {
      this._observer = new ResizeObserver(onResize);
      this._observer.observe(this._container);
    }
    this._controller = new AbortController();
    const signal = this._controller.signal;
    window.addEventListener(EVENT_RESIZE, onResize, { signal });
    canvas.addEventListener(EVENT_FULLSCREENCHANGE, () => {
      this._fsChanging = true;
      if (this._fsTimeout)
        window.clearTimeout(this._fsTimeout);
      this._setCanvas(REASON_FSCHANGE);
      this._fsTimeout = window.setTimeout(() => {
        this._fsChanging = false;
        this._fsTimeout = 0;
      }, DEBOUNCE_TIMEOUT);
    }, { signal });
    const unlockContext = () => {
      if (audioCtx.state == "suspended")
        audioCtx.resume();
      window.removeEventListener(EVENT_CLICK, unlockContext);
    };
    window.addEventListener(EVENT_CLICK, unlockContext);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState != "hidden") {
        this._frames = 0;
        this._time = performance.now();
      }
    }, { signal });
    this._setProps(options, true);
    if (this.useCanvas && this._ownCanvas)
      this._container.appendChild(canvas);
    this._ready = true;
    this._setCanvas(REASON_CREATE);
  }
  /**
   * ==========================================================================
   *
   * PUBLIC PROPERTIES GETTERS AND SETTERS
   *
   * ==========================================================================
   */
  get alphaBars() {
    return this._alphaBars;
  }
  set alphaBars(value) {
    this._alphaBars = !!value;
    this._calcBars();
  }
  get ansiBands() {
    return this._ansiBands;
  }
  set ansiBands(value) {
    this._ansiBands = !!value;
    this._calcBars();
  }
  get barSpace() {
    return this._barSpace;
  }
  set barSpace(value) {
    this._barSpace = +value || 0;
    this._calcBars();
  }
  get channelLayout() {
    return this._chLayout;
  }
  set channelLayout(value) {
    this._chLayout = validateFromList(value, [CHANNEL_SINGLE, CHANNEL_HORIZONTAL, CHANNEL_VERTICAL, CHANNEL_COMBINED]);
    this._input.disconnect();
    this._input.connect(this._chLayout != CHANNEL_SINGLE ? this._splitter : this._analyzer[0]);
    this._analyzer[0].disconnect();
    if (this._outNodes.length)
      this._analyzer[0].connect(this._chLayout != CHANNEL_SINGLE ? this._merger : this._output);
    this._calcBars();
    this._makeGrad();
  }
  get colorMode() {
    return this._colorMode;
  }
  set colorMode(value) {
    this._colorMode = validateFromList(value, [COLOR_GRADIENT, COLOR_BAR_INDEX, COLOR_BAR_LEVEL]);
  }
  get fftSize() {
    return this._analyzer[0].fftSize;
  }
  set fftSize(value) {
    for (const i of [0, 1])
      this._analyzer[i].fftSize = value;
    const binCount = this._analyzer[0].frequencyBinCount;
    this._fftData = [new Float32Array(binCount), new Float32Array(binCount)];
    this._calcBars();
  }
  get frequencyScale() {
    return this._frequencyScale;
  }
  set frequencyScale(value) {
    this._frequencyScale = validateFromList(value, [SCALE_LOG, SCALE_BARK, SCALE_MEL, SCALE_LINEAR]);
    this._calcBars();
  }
  get gradient() {
    return this._selectedGrads[0];
  }
  set gradient(value) {
    this._setGradient(value);
  }
  get gradientLeft() {
    return this._selectedGrads[0];
  }
  set gradientLeft(value) {
    this._setGradient(value, 0);
  }
  get gradientRight() {
    return this._selectedGrads[1];
  }
  set gradientRight(value) {
    this._setGradient(value, 1);
  }
  get height() {
    return this._height;
  }
  set height(h) {
    this._height = h;
    this._setCanvas(REASON_USER);
  }
  get ledBars() {
    return this._showLeds;
  }
  set ledBars(value) {
    this._showLeds = !!value;
    this._calcBars();
  }
  get linearAmplitude() {
    return this._linearAmplitude;
  }
  set linearAmplitude(value) {
    this._linearAmplitude = !!value;
  }
  get linearBoost() {
    return this._linearBoost;
  }
  set linearBoost(value) {
    this._linearBoost = value >= 1 ? +value : 1;
  }
  get lineWidth() {
    return this._lineWidth;
  }
  set lineWidth(value) {
    this._lineWidth = +value || 0;
  }
  get loRes() {
    return this._loRes;
  }
  set loRes(value) {
    this._loRes = !!value;
    this._setCanvas(REASON_LORES);
  }
  get lumiBars() {
    return this._lumiBars;
  }
  set lumiBars(value) {
    this._lumiBars = !!value;
    this._calcBars();
    this._makeGrad();
  }
  get maxDecibels() {
    return this._analyzer[0].maxDecibels;
  }
  set maxDecibels(value) {
    for (const i of [0, 1])
      this._analyzer[i].maxDecibels = value;
  }
  get maxFPS() {
    return this._maxFPS;
  }
  set maxFPS(value) {
    this._maxFPS = value < 0 ? 0 : +value || 0;
  }
  get maxFreq() {
    return this._maxFreq;
  }
  set maxFreq(value) {
    if (value < 1)
      throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
    else {
      this._maxFreq = Math.min(value, this.audioCtx.sampleRate / 2);
      this._calcBars();
    }
  }
  get minDecibels() {
    return this._analyzer[0].minDecibels;
  }
  set minDecibels(value) {
    for (const i of [0, 1])
      this._analyzer[i].minDecibels = value;
  }
  get minFreq() {
    return this._minFreq;
  }
  set minFreq(value) {
    if (value < 1)
      throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
    else {
      this._minFreq = +value;
      this._calcBars();
    }
  }
  get mirror() {
    return this._mirror;
  }
  set mirror(value) {
    this._mirror = Math.sign(value) | 0;
    this._calcBars();
    this._makeGrad();
  }
  get mode() {
    return this._mode;
  }
  set mode(value) {
    const mode = value | 0;
    if (mode >= 0 && mode <= 10 && mode != 9) {
      this._mode = mode;
      this._calcBars();
      this._makeGrad();
    } else
      throw new AudioMotionError(ERR_INVALID_MODE, value);
  }
  get noteLabels() {
    return this._noteLabels;
  }
  set noteLabels(value) {
    this._noteLabels = !!value;
    this._createScales();
  }
  get outlineBars() {
    return this._outlineBars;
  }
  set outlineBars(value) {
    this._outlineBars = !!value;
    this._calcBars();
  }
  get peakLine() {
    return this._peakLine;
  }
  set peakLine(value) {
    this._peakLine = !!value;
  }
  get radial() {
    return this._radial;
  }
  set radial(value) {
    this._radial = !!value;
    this._calcBars();
    this._makeGrad();
  }
  get radialInvert() {
    return this._radialInvert;
  }
  set radialInvert(value) {
    this._radialInvert = !!value;
    this._calcBars();
    this._makeGrad();
  }
  get radius() {
    return this._radius;
  }
  set radius(value) {
    this._radius = +value || 0;
    this._calcBars();
    this._makeGrad();
  }
  get reflexRatio() {
    return this._reflexRatio;
  }
  set reflexRatio(value) {
    value = +value || 0;
    if (value < 0 || value >= 1)
      throw new AudioMotionError(ERR_REFLEX_OUT_OF_RANGE);
    else {
      this._reflexRatio = value;
      this._calcBars();
      this._makeGrad();
    }
  }
  get roundBars() {
    return this._roundBars;
  }
  set roundBars(value) {
    this._roundBars = !!value;
    this._calcBars();
  }
  get smoothing() {
    return this._analyzer[0].smoothingTimeConstant;
  }
  set smoothing(value) {
    for (const i of [0, 1])
      this._analyzer[i].smoothingTimeConstant = value;
  }
  get spinSpeed() {
    return this._spinSpeed;
  }
  set spinSpeed(value) {
    value = +value || 0;
    if (this._spinSpeed === void 0 || value == 0)
      this._spinAngle = -HALF_PI;
    this._spinSpeed = value;
  }
  get splitGradient() {
    return this._splitGradient;
  }
  set splitGradient(value) {
    this._splitGradient = !!value;
    this._makeGrad();
  }
  get stereo() {
    deprecate("stereo", "channelLayout");
    return this._chLayout != CHANNEL_SINGLE;
  }
  set stereo(value) {
    deprecate("stereo", "channelLayout");
    this.channelLayout = value ? CHANNEL_VERTICAL : CHANNEL_SINGLE;
  }
  get trueLeds() {
    return this._trueLeds;
  }
  set trueLeds(value) {
    this._trueLeds = !!value;
  }
  get volume() {
    return this._output.gain.value;
  }
  set volume(value) {
    this._output.gain.value = value;
  }
  get weightingFilter() {
    return this._weightingFilter;
  }
  set weightingFilter(value) {
    this._weightingFilter = validateFromList(value, [FILTER_NONE, FILTER_A, FILTER_B, FILTER_C, FILTER_D, FILTER_468], "toUpperCase");
  }
  get width() {
    return this._width;
  }
  set width(w) {
    this._width = w;
    this._setCanvas(REASON_USER);
  }
  // Read only properties
  get audioCtx() {
    return this._input.context;
  }
  get canvas() {
    return this._ctx.canvas;
  }
  get canvasCtx() {
    return this._ctx;
  }
  get connectedSources() {
    return this._sources;
  }
  get connectedTo() {
    return this._outNodes;
  }
  get fps() {
    return this._fps;
  }
  get fsHeight() {
    return this._fsHeight;
  }
  get fsWidth() {
    return this._fsWidth;
  }
  get isAlphaBars() {
    return this._flg.isAlpha;
  }
  get isBandsMode() {
    return this._flg.isBands;
  }
  get isDestroyed() {
    return this._destroyed;
  }
  get isFullscreen() {
    return this._fsEl && (document.fullscreenElement || document.webkitFullscreenElement) === this._fsEl;
  }
  get isLedBars() {
    return this._flg.isLeds;
  }
  get isLumiBars() {
    return this._flg.isLumi;
  }
  get isOctaveBands() {
    return this._flg.isOctaves;
  }
  get isOn() {
    return !!this._runId;
  }
  get isOutlineBars() {
    return this._flg.isOutline;
  }
  get pixelRatio() {
    return this._pixelRatio;
  }
  get isRoundBars() {
    return this._flg.isRound;
  }
  static get version() {
    return VERSION;
  }
  /**
   * ==========================================================================
      *
   * PUBLIC METHODS
   *
   * ==========================================================================
   */
  /**
   * Connects an HTML media element or audio node to the analyzer
   *
   * @param {object} an instance of HTMLMediaElement or AudioNode
   * @returns {object} a MediaElementAudioSourceNode object if created from HTML element, or the same input object otherwise
   */
  connectInput(source) {
    const isHTML = source instanceof HTMLMediaElement;
    if (!(isHTML || source.connect))
      throw new AudioMotionError(ERR_INVALID_AUDIO_SOURCE);
    const node = isHTML ? this.audioCtx.createMediaElementSource(source) : source;
    if (!this._sources.includes(node)) {
      node.connect(this._input);
      this._sources.push(node);
    }
    return node;
  }
  /**
   * Connects the analyzer output to another audio node
   *
   * @param [{object}] an AudioNode; if undefined, the output is connected to the audio context destination (speakers)
   */
  connectOutput(node = this.audioCtx.destination) {
    if (this._outNodes.includes(node))
      return;
    this._output.connect(node);
    this._outNodes.push(node);
    if (this._outNodes.length == 1) {
      for (const i of [0, 1])
        this._analyzer[i].connect(this._chLayout == CHANNEL_SINGLE && !i ? this._output : this._merger, 0, i);
    }
  }
  /**
   * Destroys instance
   */
  destroy() {
    if (!this._ready)
      return;
    const { audioCtx, canvas, _controller, _input, _merger, _observer, _ownCanvas, _ownContext, _splitter } = this;
    this._destroyed = true;
    this._ready = false;
    this.stop();
    _controller.abort();
    if (_observer)
      _observer.disconnect();
    this.onCanvasResize = null;
    this.onCanvasDraw = null;
    this._fsEl = null;
    this.disconnectInput();
    this.disconnectOutput();
    _input.disconnect();
    _splitter.disconnect();
    _merger.disconnect();
    if (_ownContext)
      audioCtx.close();
    if (_ownCanvas)
      canvas.remove();
    this._calcBars();
  }
  /**
   * Disconnects audio sources from the analyzer
   *
   * @param [{object|array}] a connected AudioNode object or an array of such objects; if falsy, all connected nodes are disconnected
   * @param [{boolean}] if true, stops/releases audio tracks from disconnected media streams (e.g. microphone)
   */
  disconnectInput(sources, stopTracks) {
    if (!sources)
      sources = Array.from(this._sources);
    else if (!Array.isArray(sources))
      sources = [sources];
    for (const node of sources) {
      const idx = this._sources.indexOf(node);
      if (stopTracks && node.mediaStream) {
        for (const track of node.mediaStream.getAudioTracks()) {
          track.stop();
        }
      }
      if (idx >= 0) {
        node.disconnect(this._input);
        this._sources.splice(idx, 1);
      }
    }
  }
  /**
   * Disconnects the analyzer output from other audio nodes
   *
   * @param [{object}] a connected AudioNode object; if undefined, all connected nodes are disconnected
   */
  disconnectOutput(node) {
    if (node && !this._outNodes.includes(node))
      return;
    this._output.disconnect(node);
    this._outNodes = node ? this._outNodes.filter((e) => e !== node) : [];
    if (this._outNodes.length == 0) {
      for (const i of [0, 1])
        this._analyzer[i].disconnect();
    }
  }
  /**
   * Returns analyzer bars data
      *
   * @returns {array}
   */
  getBars() {
    return Array.from(this._bars, ({ posX, freq, freqLo, freqHi, hold, peak, value }) => ({ posX, freq, freqLo, freqHi, hold, peak, value }));
  }
  /**
   * Returns the energy of a frequency, or average energy of a range of frequencies
   *
   * @param [{number|string}] single or initial frequency (Hz), or preset name; if undefined, returns the overall energy
   * @param [{number}] ending frequency (Hz)
   * @returns {number|null} energy value (0 to 1) or null, if the specified preset is unknown
   */
  getEnergy(startFreq, endFreq) {
    if (startFreq === void 0)
      return this._energy.val;
    if (startFreq != +startFreq) {
      if (startFreq == "peak")
        return this._energy.peak;
      const presets = {
        bass: [20, 250],
        lowMid: [250, 500],
        mid: [500, 2e3],
        highMid: [2e3, 4e3],
        treble: [4e3, 16e3]
      };
      if (!presets[startFreq])
        return null;
      [startFreq, endFreq] = presets[startFreq];
    }
    const startBin = this._freqToBin(startFreq), endBin = endFreq ? this._freqToBin(endFreq) : startBin, chnCount = this._chLayout == CHANNEL_SINGLE ? 1 : 2;
    let energy = 0;
    for (let channel = 0; channel < chnCount; channel++) {
      for (let i = startBin; i <= endBin; i++)
        energy += this._normalizedB(this._fftData[channel][i]);
    }
    return energy / (endBin - startBin + 1) / chnCount;
  }
  /**
   * Returns current analyzer settings in object format
   *
   * @param [{string|array}] a property name or an array of property names to not include in the returned object
   * @returns {object} Options object
   */
  getOptions(ignore) {
    if (!Array.isArray(ignore))
      ignore = [ignore];
    let options = {};
    for (const prop of Object.keys(DEFAULT_SETTINGS)) {
      if (!ignore.includes(prop)) {
        if (prop == "gradient" && this.gradientLeft != this.gradientRight) {
          options.gradientLeft = this.gradientLeft;
          options.gradientRight = this.gradientRight;
        } else if (prop != "start")
          options[prop] = this[prop];
      }
    }
    return options;
  }
  /**
   * Registers a custom gradient
   *
   * @param {string} name
   * @param {object} options
   */
  registerGradient(name, options) {
    if (typeof name != "string" || name.trim().length == 0)
      throw new AudioMotionError(ERR_GRADIENT_INVALID_NAME);
    if (typeof options != "object")
      throw new AudioMotionError(ERR_GRADIENT_NOT_AN_OBJECT);
    const { colorStops } = options;
    if (!Array.isArray(colorStops) || !colorStops.length)
      throw new AudioMotionError(ERR_GRADIENT_MISSING_COLOR);
    const count = colorStops.length, isInvalid = (val) => +val != val || val < 0 || val > 1;
    colorStops.forEach((colorStop, index) => {
      const pos = index / Math.max(1, count - 1);
      if (typeof colorStop != "object")
        colorStops[index] = { pos, color: colorStop };
      else if (isInvalid(colorStop.pos))
        colorStop.pos = pos;
      if (isInvalid(colorStop.level))
        colorStops[index].level = 1 - index / count;
    });
    colorStops.sort((a, b) => a.level < b.level ? 1 : a.level > b.level ? -1 : 0);
    colorStops[0].level = 1;
    this._gradients[name] = {
      bgColor: options.bgColor || GRADIENT_DEFAULT_BGCOLOR,
      dir: options.dir,
      colorStops
    };
    if (this._selectedGrads.includes(name))
      this._makeGrad();
  }
  /**
   * Set dimensions of analyzer's canvas
   *
   * @param {number} w width in pixels
   * @param {number} h height in pixels
   */
  setCanvasSize(w, h) {
    this._width = w;
    this._height = h;
    this._setCanvas(REASON_USER);
  }
  /**
   * Set desired frequency range
   *
   * @param {number} min lowest frequency represented in the x-axis
   * @param {number} max highest frequency represented in the x-axis
   */
  setFreqRange(min, max) {
    if (min < 1 || max < 1)
      throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
    else {
      this._minFreq = Math.min(min, max);
      this.maxFreq = Math.max(min, max);
    }
  }
  /**
   * Set custom parameters for LED effect
   * If called with no arguments or if any property is invalid, clears any previous custom parameters
   *
   * @param {object} [params]
   */
  setLedParams(params) {
    let maxLeds, spaceV, spaceH;
    if (params) {
      maxLeds = params.maxLeds | 0, // ensure integer
      spaceV = +params.spaceV, spaceH = +params.spaceH;
    }
    this._ledParams = maxLeds > 0 && spaceV > 0 && spaceH >= 0 ? [maxLeds, spaceV, spaceH] : void 0;
    this._calcBars();
  }
  /**
   * Shorthand function for setting several options at once
   *
   * @param {object} options
   */
  setOptions(options) {
    this._setProps(options);
  }
  /**
   * Adjust the analyzer's sensitivity
   *
   * @param {number} min minimum decibels value
   * @param {number} max maximum decibels value
   */
  setSensitivity(min, max) {
    for (const i of [0, 1]) {
      this._analyzer[i].minDecibels = Math.min(min, max);
      this._analyzer[i].maxDecibels = Math.max(min, max);
    }
  }
  /**
   * Start the analyzer
   */
  start() {
    this.toggleAnalyzer(true);
  }
  /**
   * Stop the analyzer
   */
  stop() {
    this.toggleAnalyzer(false);
  }
  /**
   * Start / stop canvas animation
   *
   * @param {boolean} [force] if undefined, inverts the current state
   * @returns {boolean} resulting state after the change
   */
  toggleAnalyzer(force) {
    const hasStarted = this.isOn;
    if (force === void 0)
      force = !hasStarted;
    if (hasStarted && !force) {
      cancelAnimationFrame(this._runId);
      this._runId = 0;
    } else if (!hasStarted && force && !this._destroyed) {
      this._frames = 0;
      this._time = performance.now();
      this._runId = requestAnimationFrame((timestamp) => this._draw(timestamp));
    }
    return this.isOn;
  }
  /**
   * Toggles canvas full-screen mode
   */
  toggleFullscreen() {
    if (this.isFullscreen) {
      if (document.exitFullscreen)
        document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        document.webkitExitFullscreen();
    } else {
      const fsEl = this._fsEl;
      if (!fsEl)
        return;
      if (fsEl.requestFullscreen)
        fsEl.requestFullscreen();
      else if (fsEl.webkitRequestFullscreen)
        fsEl.webkitRequestFullscreen();
    }
  }
  /**
   * ==========================================================================
   *
   * PRIVATE METHODS
   *
   * ==========================================================================
   */
  /**
   * Return the frequency (in Hz) for a given FFT bin
   */
  _binToFreq(bin) {
    return bin * this.audioCtx.sampleRate / this.fftSize || 1;
  }
  /**
   * Compute all internal data required for the analyzer, based on its current settings
   */
  _calcBars() {
    const bars = this._bars = [];
    if (!this._ready) {
      this._flg = { isAlpha: false, isBands: false, isLeds: false, isLumi: false, isOctaves: false, isOutline: false, isRound: false, noLedGap: false };
      return;
    }
    const { _ansiBands, _barSpace, canvas, _chLayout, _maxFreq, _minFreq, _mirror, _mode, _radial, _radialInvert, _reflexRatio } = this, centerX = canvas.width >> 1, centerY = canvas.height >> 1, isDualVertical = _chLayout == CHANNEL_VERTICAL && !_radial, isDualHorizontal = _chLayout == CHANNEL_HORIZONTAL, isBands = _mode % 10 != 0, isOctaves = isBands && this._frequencyScale == SCALE_LOG, isLeds = this._showLeds && isBands && !_radial, isLumi = this._lumiBars && isBands && !_radial, isAlpha = this._alphaBars && !isLumi && _mode != MODE_GRAPH, isOutline = this._outlineBars && isBands && !isLumi && !isLeds, isRound = this._roundBars && isBands && !isLumi && !isLeds, noLedGap = _chLayout != CHANNEL_VERTICAL || _reflexRatio > 0 && !isLumi, channelHeight = canvas.height - (isDualVertical && !isLeds ? 0.5 : 0) >> isDualVertical, analyzerHeight = channelHeight * (isLumi || _radial ? 1 : 1 - _reflexRatio) | 0, analyzerWidth = canvas.width - centerX * (isDualHorizontal || _mirror != 0), channelGap = isDualVertical ? canvas.height - channelHeight * 2 : 0, initialX = centerX * (_mirror == -1 && !isDualHorizontal && !_radial);
    let innerRadius = Math.min(canvas.width, canvas.height) * 0.375 * (_chLayout == CHANNEL_VERTICAL ? 1 : this._radius) | 0, outerRadius = Math.min(centerX, centerY);
    if (_radialInvert && _chLayout != CHANNEL_VERTICAL)
      [innerRadius, outerRadius] = [outerRadius, innerRadius];
    const barsPush = (args) => bars.push({ ...args, peak: [0, 0], hold: [0], value: [0] });
    const calcRatio = (freq) => {
      const bin = this._freqToBin(freq, "floor"), lower = this._binToFreq(bin), upper = this._binToFreq(bin + 1), ratio = Math.log2(freq / lower) / Math.log2(upper / lower);
      return [bin, ratio];
    };
    let barWidth, scaleMin, unitWidth;
    if (isOctaves) {
      const roundSD = (value, digits, atLeast) => +value.toPrecision(atLeast ? Math.max(digits, 1 + Math.log10(value) | 0) : digits);
      const nearestPreferred = (value) => {
        const preferred = [1, 1.12, 1.25, 1.4, 1.6, 1.8, 2, 2.24, 2.5, 2.8, 3.15, 3.55, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10], power = Math.log10(value) | 0, normalized = value / 10 ** power;
        let i = 1;
        while (i < preferred.length && normalized > preferred[i])
          i++;
        if (normalized - preferred[i - 1] < preferred[i] - normalized)
          i--;
        return (preferred[i] * 10 ** (power + 5) | 0) / 1e5;
      };
      const bands = [0, 24, 12, 8, 6, 4, 3, 2, 1][_mode], bandWidth = _ansiBands ? 10 ** (3 / (bands * 10)) : 2 ** (1 / bands), halfBand = bandWidth ** 0.5;
      let analyzerBars = [], currFreq = _ansiBands ? 7.94328235 / (bands % 2 ? 1 : halfBand) : C_1;
      do {
        let freq = currFreq;
        const freqLo = roundSD(freq / halfBand, 4, true), freqHi = roundSD(freq * halfBand, 4, true), [binLo, ratioLo] = calcRatio(freqLo), [binHi, ratioHi] = calcRatio(freqHi);
        if (_ansiBands)
          freq = bands < 4 ? nearestPreferred(freq) : roundSD(freq, freq.toString()[0] < 5 ? 3 : 2);
        else
          freq = roundSD(freq, 4, true);
        if (freq >= _minFreq)
          barsPush({ posX: 0, freq, freqLo, freqHi, binLo, binHi, ratioLo, ratioHi });
        currFreq *= bandWidth;
      } while (currFreq <= _maxFreq);
      barWidth = analyzerWidth / bars.length;
      bars.forEach((bar, index) => bar.posX = initialX + index * barWidth);
      const firstBar = bars[0], lastBar = bars[bars.length - 1];
      scaleMin = this._freqScaling(firstBar.freqLo);
      unitWidth = analyzerWidth / (this._freqScaling(lastBar.freqHi) - scaleMin);
      if (firstBar.freqLo < _minFreq) {
        firstBar.freqLo = _minFreq;
        [firstBar.binLo, firstBar.ratioLo] = calcRatio(_minFreq);
      }
      if (lastBar.freqHi > _maxFreq) {
        lastBar.freqHi = _maxFreq;
        [lastBar.binHi, lastBar.ratioHi] = calcRatio(_maxFreq);
      }
    } else if (isBands) {
      const bands = [0, 24, 12, 8, 6, 4, 3, 2, 1][_mode] * 10;
      const invFreqScaling = (x) => {
        switch (this._frequencyScale) {
          case SCALE_BARK:
            return 1960 / (26.81 / (x + 0.53) - 1);
          case SCALE_MEL:
            return 700 * (2 ** x - 1);
          case SCALE_LINEAR:
            return x;
        }
      };
      barWidth = analyzerWidth / bands;
      scaleMin = this._freqScaling(_minFreq);
      unitWidth = analyzerWidth / (this._freqScaling(_maxFreq) - scaleMin);
      for (let i = 0, posX = 0; i < bands; i++, posX += barWidth) {
        const freqLo = invFreqScaling(scaleMin + posX / unitWidth), freq = invFreqScaling(scaleMin + (posX + barWidth / 2) / unitWidth), freqHi = invFreqScaling(scaleMin + (posX + barWidth) / unitWidth), [binLo, ratioLo] = calcRatio(freqLo), [binHi, ratioHi] = calcRatio(freqHi);
        barsPush({ posX: initialX + posX, freq, freqLo, freqHi, binLo, binHi, ratioLo, ratioHi });
      }
    } else {
      barWidth = 1;
      scaleMin = this._freqScaling(_minFreq);
      unitWidth = analyzerWidth / (this._freqScaling(_maxFreq) - scaleMin);
      const minIndex = this._freqToBin(_minFreq, "floor"), maxIndex = this._freqToBin(_maxFreq);
      let lastPos = -999;
      for (let i = minIndex; i <= maxIndex; i++) {
        const freq = this._binToFreq(i), posX = initialX + Math.round(unitWidth * (this._freqScaling(freq) - scaleMin));
        if (posX > lastPos) {
          barsPush({ posX, freq, freqLo: freq, freqHi: freq, binLo: i, binHi: i, ratioLo: 0, ratioHi: 0 });
          lastPos = posX;
        } else if (bars.length) {
          const lastBar = bars[bars.length - 1];
          lastBar.binHi = i;
          lastBar.freqHi = freq;
          lastBar.freq = (lastBar.freqLo * freq) ** 0.5;
        }
      }
    }
    let spaceH = 0, spaceV = 0;
    if (isLeds) {
      const dPR = this._pixelRatio / (window.devicePixelRatio > 1 && window.screen.height <= 540 ? 2 : 1);
      const params = [
        [],
        [128, 3, 0.45],
        // mode 1
        [128, 4, 0.225],
        // mode 2
        [96, 6, 0.225],
        // mode 3
        [80, 6, 0.225],
        // mode 4
        [80, 6, 0.125],
        // mode 5
        [64, 6, 0.125],
        // mode 6
        [48, 8, 0.125],
        // mode 7
        [24, 16, 0.125]
        // mode 8
      ];
      const customParams = this._ledParams, [maxLeds, spaceVRatio, spaceHRatio] = customParams || params[_mode];
      let ledCount, maxHeight = analyzerHeight;
      if (customParams) {
        const minHeight = 2 * dPR;
        let blockHeight;
        ledCount = maxLeds + 1;
        do {
          ledCount--;
          blockHeight = maxHeight / ledCount / (1 + spaceVRatio);
          spaceV = blockHeight * spaceVRatio;
        } while ((blockHeight < minHeight || spaceV < minHeight) && ledCount > 1);
      } else {
        const refRatio = 540 / spaceVRatio;
        spaceV = Math.min(spaceVRatio * dPR, Math.max(2, maxHeight / refRatio + 0.1 | 0));
      }
      if (noLedGap)
        maxHeight += spaceV;
      if (!customParams)
        ledCount = Math.min(maxLeds, maxHeight / (spaceV * 2) | 0);
      spaceH = spaceHRatio >= 1 ? spaceHRatio : barWidth * spaceHRatio;
      this._leds = [
        ledCount,
        spaceH,
        spaceV,
        maxHeight / ledCount - spaceV
        // ledHeight
      ];
    }
    const barSpacePx = Math.min(barWidth - 1, _barSpace * (_barSpace > 0 && _barSpace < 1 ? barWidth : 1));
    if (isBands)
      barWidth -= Math.max(isLeds ? spaceH : 0, barSpacePx);
    bars.forEach((bar, index) => {
      let posX = bar.posX, width = barWidth;
      if (isBands) {
        if (_barSpace == 0 && !isLeds) {
          posX |= 0;
          width |= 0;
          if (index > 0 && posX > bars[index - 1].posX + bars[index - 1].width) {
            posX--;
            width++;
          }
        } else
          posX += Math.max(isLeds ? spaceH : 0, barSpacePx) / 2;
        bar.posX = posX;
      }
      bar.barCenter = posX + (barWidth == 1 ? 0 : width / 2);
      bar.width = width;
    });
    const channelCoords = [];
    for (const channel of [0, 1]) {
      const channelTop = _chLayout == CHANNEL_VERTICAL ? (channelHeight + channelGap) * channel : 0, channelBottom = channelTop + channelHeight, analyzerBottom = channelTop + analyzerHeight - (!isLeds || noLedGap ? 0 : spaceV);
      channelCoords.push({ channelTop, channelBottom, analyzerBottom });
    }
    this._aux = { analyzerHeight, analyzerWidth, centerX, centerY, channelCoords, channelHeight, channelGap, initialX, innerRadius, outerRadius, scaleMin, unitWidth };
    this._flg = { isAlpha, isBands, isLeds, isLumi, isOctaves, isOutline, isRound, noLedGap };
    this._createScales();
  }
  /**
   * Generate the X-axis and radial scales in auxiliary canvases
   */
  _createScales() {
    if (!this._ready)
      return;
    const { analyzerWidth, initialX, innerRadius, scaleMin, unitWidth } = this._aux, { canvas, _frequencyScale, _mirror, _noteLabels, _radial, _scaleX, _scaleR } = this, canvasX = _scaleX.canvas, canvasR = _scaleR.canvas, freqLabels = [], isDualHorizontal = this._chLayout == CHANNEL_HORIZONTAL, isDualVertical = this._chLayout == CHANNEL_VERTICAL, minDimension = Math.min(canvas.width, canvas.height), scale = ["C", , "D", , "E", "F", , "G", , "A", , "B"], scaleHeight = minDimension / 34 | 0, fontSizeX = canvasX.height >> 1, fontSizeR = scaleHeight >> 1, labelWidthX = fontSizeX * (_noteLabels ? 0.7 : 1.5), labelWidthR = fontSizeR * (_noteLabels ? 1 : 2), root12 = 2 ** (1 / 12);
    if (!_noteLabels && (this._ansiBands || _frequencyScale != SCALE_LOG)) {
      freqLabels.push(16, 31.5, 63, 125, 250, 500, 1e3, 2e3, 4e3);
      if (_frequencyScale == SCALE_LINEAR)
        freqLabels.push(6e3, 8e3, 1e4, 12e3, 14e3, 16e3, 18e3, 2e4, 22e3);
      else
        freqLabels.push(8e3, 16e3);
    } else {
      let freq = C_1;
      for (let octave = -1; octave < 11; octave++) {
        for (let note = 0; note < 12; note++) {
          if (freq >= this._minFreq && freq <= this._maxFreq) {
            const pitch = scale[note], isC = pitch == "C";
            if (pitch && _noteLabels && !_mirror && !isDualHorizontal || isC)
              freqLabels.push(_noteLabels ? [freq, pitch + (isC ? octave : "")] : freq);
          }
          freq *= root12;
        }
      }
    }
    canvasR.width = canvasR.height = Math.max(minDimension * 0.15, (innerRadius << 1) + isDualVertical * scaleHeight);
    const centerR = canvasR.width >> 1, radialY = centerR - scaleHeight * 0.7;
    const radialLabel = (x, label) => {
      const angle = TAU * (x / canvas.width), adjAng = angle - HALF_PI, posX = radialY * Math.cos(adjAng), posY = radialY * Math.sin(adjAng);
      _scaleR.save();
      _scaleR.translate(centerR + posX, centerR + posY);
      _scaleR.rotate(angle);
      _scaleR.fillText(label, 0, 0);
      _scaleR.restore();
    };
    canvasX.width |= 0;
    _scaleX.fillStyle = _scaleR.strokeStyle = SCALEX_BACKGROUND_COLOR;
    _scaleX.fillRect(0, 0, canvasX.width, canvasX.height);
    _scaleR.arc(centerR, centerR, centerR - scaleHeight / 2, 0, TAU);
    _scaleR.lineWidth = scaleHeight;
    _scaleR.stroke();
    _scaleX.fillStyle = _scaleR.fillStyle = SCALEX_LABEL_COLOR;
    _scaleX.font = `${fontSizeX}px ${FONT_FAMILY}`;
    _scaleR.font = `${fontSizeR}px ${FONT_FAMILY}`;
    _scaleX.textAlign = _scaleR.textAlign = "center";
    let prevX = -labelWidthX / 4, prevR = -labelWidthR;
    for (const item of freqLabels) {
      const [freq, label] = Array.isArray(item) ? item : [item, item < 1e3 ? item | 0 : `${(item / 100 | 0) / 10}k`], x = unitWidth * (this._freqScaling(freq) - scaleMin), y = canvasX.height * 0.75, isC = label[0] == "C", maxW = fontSizeX * (_noteLabels && !_mirror && !isDualHorizontal ? isC ? 1.2 : 0.6 : 3);
      _scaleX.fillStyle = _scaleR.fillStyle = isC && !_mirror && !isDualHorizontal ? SCALEX_HIGHLIGHT_COLOR : SCALEX_LABEL_COLOR;
      if (_noteLabels) {
        const isLog = _frequencyScale == SCALE_LOG, isLinear = _frequencyScale == SCALE_LINEAR;
        let allowedLabels = ["C"];
        if (isLog || freq > 2e3 || !isLinear && freq > 250 || (!_radial || isDualVertical) && (!isLinear && freq > 125 || freq > 1e3))
          allowedLabels.push("G");
        if (isLog || freq > 4e3 || !isLinear && freq > 500 || (!_radial || isDualVertical) && (!isLinear && freq > 250 || freq > 2e3))
          allowedLabels.push("E");
        if (isLinear && freq > 4e3 || (!_radial || isDualVertical) && (isLog || freq > 2e3 || !isLinear && freq > 500))
          allowedLabels.push("D", "F", "A", "B");
        if (!allowedLabels.includes(label[0]))
          continue;
      }
      if (x >= prevX + labelWidthX / 2 && x <= analyzerWidth) {
        _scaleX.fillText(label, isDualHorizontal && _mirror == -1 ? analyzerWidth - x : initialX + x, y, maxW);
        if (isDualHorizontal || _mirror && (x > labelWidthX || _mirror == 1))
          _scaleX.fillText(label, isDualHorizontal && _mirror != 1 ? analyzerWidth + x : (initialX || canvas.width) - x, y, maxW);
        prevX = x + Math.min(maxW, _scaleX.measureText(label).width) / 2;
      }
      if (x >= prevR + labelWidthR && x < analyzerWidth - labelWidthR) {
        radialLabel(isDualHorizontal && _mirror == 1 ? analyzerWidth - x : x, label);
        if (isDualHorizontal || _mirror && (x > labelWidthR || _mirror == 1))
          radialLabel(isDualHorizontal && _mirror != -1 ? analyzerWidth + x : -x, label);
        prevR = x;
      }
    }
  }
  /**
   * Redraw the canvas
   * this is called 60 times per second by requestAnimationFrame()
   */
  _draw(timestamp) {
    this._runId = requestAnimationFrame((timestamp2) => this._draw(timestamp2));
    const elapsed = timestamp - this._time, frameTime = timestamp - this._last, targetInterval = this._maxFPS ? 975 / this._maxFPS : 0;
    if (frameTime < targetInterval)
      return;
    this._last = timestamp - (targetInterval ? frameTime % targetInterval : 0);
    this._frames++;
    if (elapsed >= 1e3) {
      this._fps = this._frames / elapsed * 1e3;
      this._frames = 0;
      this._time = timestamp;
    }
    const {
      isAlpha,
      isBands,
      isLeds,
      isLumi,
      isOctaves,
      isOutline,
      isRound,
      noLedGap
    } = this._flg, {
      analyzerHeight,
      centerX,
      centerY,
      channelCoords,
      channelHeight,
      channelGap,
      initialX,
      innerRadius,
      outerRadius
    } = this._aux, {
      _bars,
      canvas,
      _canvasGradients,
      _chLayout,
      _colorMode,
      _ctx,
      _energy,
      fillAlpha,
      _fps,
      _linearAmplitude,
      _lineWidth,
      maxDecibels,
      minDecibels,
      _mirror,
      _mode,
      overlay,
      _radial,
      showBgColor,
      showPeaks,
      useCanvas,
      _weightingFilter
    } = this, canvasX = this._scaleX.canvas, canvasR = this._scaleR.canvas, holdFrames = _fps >> 1, isDualCombined = _chLayout == CHANNEL_COMBINED, isDualHorizontal = _chLayout == CHANNEL_HORIZONTAL, isDualVertical = _chLayout == CHANNEL_VERTICAL, isSingle = _chLayout == CHANNEL_SINGLE, isTrueLeds = isLeds && this._trueLeds && _colorMode == COLOR_GRADIENT, analyzerWidth = _radial ? canvas.width : this._aux.analyzerWidth, finalX = initialX + analyzerWidth, showPeakLine = showPeaks && this._peakLine && _mode == MODE_GRAPH, maxBarHeight = _radial ? outerRadius - innerRadius : analyzerHeight, dbRange = maxDecibels - minDecibels, [ledCount, ledSpaceH, ledSpaceV, ledHeight] = this._leds || [];
    if (_energy.val > 0 && _fps > 0)
      this._spinAngle += this._spinSpeed * TAU / 60 / _fps;
    const doReflex = (channel) => {
      if (this._reflexRatio > 0 && !isLumi && !_radial) {
        let posY, height;
        if (this.reflexFit || isDualVertical) {
          posY = isDualVertical && channel == 0 ? channelHeight + channelGap : 0;
          height = channelHeight - analyzerHeight;
        } else {
          posY = canvas.height - analyzerHeight * 2;
          height = analyzerHeight;
        }
        _ctx.save();
        _ctx.globalAlpha = this.reflexAlpha;
        if (this.reflexBright != 1)
          _ctx.filter = `brightness(${this.reflexBright})`;
        _ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
        _ctx.drawImage(canvas, 0, channelCoords[channel].channelTop, canvas.width, analyzerHeight, 0, posY, canvas.width, height);
        _ctx.restore();
      }
    };
    const drawScaleX = () => {
      if (this.showScaleX) {
        if (_radial) {
          _ctx.save();
          _ctx.translate(centerX, centerY);
          if (this._spinSpeed)
            _ctx.rotate(this._spinAngle + HALF_PI);
          _ctx.drawImage(canvasR, -canvasR.width >> 1, -canvasR.width >> 1);
          _ctx.restore();
        } else
          _ctx.drawImage(canvasX, 0, canvas.height - canvasX.height);
      }
    };
    const weightingdB = (freq) => {
      const f2 = freq ** 2, SQ20_6 = 424.36, SQ107_7 = 11599.29, SQ158_5 = 25122.25, SQ737_9 = 544496.41, SQ12194 = 148693636, linearTodB = (value) => 20 * Math.log10(value);
      switch (_weightingFilter) {
        case FILTER_A:
          const rA = SQ12194 * f2 ** 2 / ((f2 + SQ20_6) * Math.sqrt((f2 + SQ107_7) * (f2 + SQ737_9)) * (f2 + SQ12194));
          return 2 + linearTodB(rA);
        case FILTER_B:
          const rB = SQ12194 * f2 * freq / ((f2 + SQ20_6) * Math.sqrt(f2 + SQ158_5) * (f2 + SQ12194));
          return 0.17 + linearTodB(rB);
        case FILTER_C:
          const rC = SQ12194 * f2 / ((f2 + SQ20_6) * (f2 + SQ12194));
          return 0.06 + linearTodB(rC);
        case FILTER_D:
          const h = ((103791848e-2 - f2) ** 2 + 108076816e-2 * f2) / ((9837328 - f2) ** 2 + 11723776 * f2), rD = freq / 68966888496476e-18 * Math.sqrt(h / ((f2 + 79919.29) * (f2 + 1345600)));
          return linearTodB(rD);
        case FILTER_468:
          const h1 = -4737338981378384e-39 * freq ** 6 + 2043828333606125e-30 * freq ** 4 - 1363894795463638e-22 * f2 + 1, h2 = 1306612257412824e-34 * freq ** 5 - 2118150887518656e-26 * freq ** 3 + 5559488023498642e-19 * freq, rI = 1246332637532143e-19 * freq / Math.hypot(h1, h2);
          return 18.2 + linearTodB(rI);
      }
      return 0;
    };
    const strokeBar = (x, y1, y2) => {
      _ctx.beginPath();
      _ctx.moveTo(x, y1);
      _ctx.lineTo(x, y2);
      _ctx.stroke();
    };
    const strokeIf = (flag) => {
      if (flag && _lineWidth) {
        const alpha = _ctx.globalAlpha;
        _ctx.globalAlpha = 1;
        _ctx.stroke();
        _ctx.globalAlpha = alpha;
      }
    };
    const ledPosY = (value) => Math.max(0, (value * ledCount | 0) * (ledHeight + ledSpaceV) - ledSpaceV);
    const updateEnergy = (newVal) => {
      _energy.val = newVal;
      if (_energy.peak > 0) {
        _energy.hold--;
        if (_energy.hold < 0)
          _energy.peak += _energy.hold / (holdFrames * holdFrames / 2);
      }
      if (newVal >= _energy.peak) {
        _energy.peak = newVal;
        _energy.hold = holdFrames;
      }
    };
    if (overlay)
      _ctx.clearRect(0, 0, canvas.width, canvas.height);
    let currentEnergy = 0;
    const nBars = _bars.length, nChannels = isSingle ? 1 : 2;
    for (let channel = 0; channel < nChannels; channel++) {
      const { channelTop, channelBottom, analyzerBottom } = channelCoords[channel], channelGradient = this._gradients[this._selectedGrads[channel]], colorStops = channelGradient.colorStops, colorCount = colorStops.length, bgColor = !showBgColor || isLeds && !overlay ? "#000" : channelGradient.bgColor, radialDirection = isDualVertical && _radial && channel ? -1 : 1, invertedChannel = !channel && _mirror == -1 || channel && _mirror == 1, radialOffsetX = !isDualHorizontal || channel && _mirror != 1 ? 0 : analyzerWidth >> (channel || !invertedChannel), angularDirection = isDualHorizontal && invertedChannel ? -1 : 1;
      const drawScaleY = () => {
        const scaleWidth = canvasX.height, fontSize = scaleWidth >> 1, max = _linearAmplitude ? 100 : maxDecibels, min = _linearAmplitude ? 0 : minDecibels, incr = _linearAmplitude ? 20 : 5, interval = analyzerHeight / (max - min), atStart = _mirror != -1 && (!isDualHorizontal || channel == 0 || _mirror == 1), atEnd = _mirror != 1 && (!isDualHorizontal || channel != _mirror);
        _ctx.save();
        _ctx.fillStyle = SCALEY_LABEL_COLOR;
        _ctx.font = `${fontSize}px ${FONT_FAMILY}`;
        _ctx.textAlign = "right";
        _ctx.lineWidth = 1;
        for (let val = max; val > min; val -= incr) {
          const posY = channelTop + (max - val) * interval, even = val % 2 == 0 | 0;
          if (even) {
            const labelY = posY + fontSize * (posY == channelTop ? 0.8 : 0.35);
            if (atStart)
              _ctx.fillText(val, scaleWidth * 0.85, labelY);
            if (atEnd)
              _ctx.fillText(val, (isDualHorizontal ? analyzerWidth : canvas.width) - scaleWidth * 0.1, labelY);
            _ctx.strokeStyle = SCALEY_LABEL_COLOR;
            _ctx.setLineDash([2, 4]);
            _ctx.lineDashOffset = 0;
          } else {
            _ctx.strokeStyle = SCALEY_MIDLINE_COLOR;
            _ctx.setLineDash([2, 8]);
            _ctx.lineDashOffset = 1;
          }
          _ctx.beginPath();
          _ctx.moveTo(initialX + scaleWidth * even * atStart, ~~posY + 0.5);
          _ctx.lineTo(finalX - scaleWidth * even * atEnd, ~~posY + 0.5);
          _ctx.stroke();
        }
        _ctx.restore();
      };
      const interpolate = (bin, ratio) => {
        const value = fftData[bin] + (bin < fftData.length - 1 ? (fftData[bin + 1] - fftData[bin]) * ratio : 0);
        return isNaN(value) ? -Infinity : value;
      };
      const getAngle = (x, dir = angularDirection) => dir * TAU * ((x + radialOffsetX) / canvas.width) + this._spinAngle;
      const radialXY = (x, y, dir) => {
        const height = innerRadius + y * radialDirection, angle = getAngle(x, dir);
        return [centerX + height * Math.cos(angle), centerY + height * Math.sin(angle)];
      };
      const radialPoly = (x, y, w, h, stroke) => {
        _ctx.beginPath();
        for (const dir of _mirror && !isDualHorizontal ? [1, -1] : [angularDirection]) {
          const [startAngle, endAngle] = isRound ? [getAngle(x, dir), getAngle(x + w, dir)] : [];
          _ctx.moveTo(...radialXY(x, y, dir));
          _ctx.lineTo(...radialXY(x, y + h, dir));
          if (isRound)
            _ctx.arc(centerX, centerY, innerRadius + (y + h) * radialDirection, startAngle, endAngle, dir != 1);
          else
            _ctx.lineTo(...radialXY(x + w, y + h, dir));
          _ctx.lineTo(...radialXY(x + w, y, dir));
          if (isRound && !stroke)
            _ctx.arc(centerX, centerY, innerRadius + y * radialDirection, endAngle, startAngle, dir == 1);
        }
        strokeIf(stroke);
        _ctx.fill();
      };
      const setBarColor = (value = 0, barIndex = 0) => {
        let color;
        if (_colorMode == COLOR_GRADIENT && !isTrueLeds || _mode == MODE_GRAPH)
          color = _canvasGradients[channel];
        else {
          const selectedIndex = _colorMode == COLOR_BAR_INDEX ? barIndex % colorCount : colorStops.findLastIndex((item) => isLeds ? ledPosY(value) <= ledPosY(item.level) : value <= item.level);
          color = colorStops[selectedIndex].color;
        }
        _ctx.fillStyle = _ctx.strokeStyle = color;
      };
      if (useCanvas) {
        if (isDualHorizontal && !_radial) {
          const translateX = analyzerWidth * (channel + invertedChannel), flipX = invertedChannel ? -1 : 1;
          _ctx.setTransform(flipX, 0, 0, 1, translateX, 0);
        }
        if (!overlay || showBgColor) {
          if (overlay)
            _ctx.globalAlpha = this.bgAlpha;
          _ctx.fillStyle = bgColor;
          if (channel == 0 || !_radial && !isDualCombined)
            _ctx.fillRect(initialX, channelTop - channelGap, analyzerWidth, (overlay && this.reflexAlpha == 1 ? analyzerHeight : channelHeight) + channelGap);
          _ctx.globalAlpha = 1;
        }
        if (this.showScaleY && !isLumi && !_radial && (channel == 0 || !isDualCombined))
          drawScaleY();
        if (isLeds) {
          _ctx.setLineDash([ledHeight, ledSpaceV]);
          _ctx.lineWidth = _bars[0].width;
        } else
          _ctx.lineWidth = isOutline ? Math.min(_lineWidth, _bars[0].width / 2) : _lineWidth;
        _ctx.save();
        if (!_radial) {
          const region = new Path2D();
          region.rect(0, channelTop, canvas.width, analyzerHeight);
          _ctx.clip(region);
        }
      }
      let fftData = this._fftData[channel];
      this._analyzer[channel].getFloatFrequencyData(fftData);
      if (_weightingFilter)
        fftData = fftData.map((val, idx) => val + weightingdB(this._binToFreq(idx)));
      _ctx.beginPath();
      let points = [];
      for (let barIndex = 0; barIndex < nBars; barIndex++) {
        const bar = _bars[barIndex], { posX, barCenter, width, freq, binLo, binHi, ratioLo, ratioHi } = bar;
        let barValue = Math.max(interpolate(binLo, ratioLo), interpolate(binHi, ratioHi));
        for (let j = binLo + 1; j < binHi; j++) {
          if (fftData[j] > barValue)
            barValue = fftData[j];
        }
        barValue = this._normalizedB(barValue);
        bar.value[channel] = barValue;
        currentEnergy += barValue;
        if (bar.peak[channel] > 0) {
          bar.hold[channel]--;
          if (bar.hold[channel] < 0)
            bar.peak[channel] += bar.hold[channel] / (holdFrames * holdFrames / 2);
        }
        if (barValue >= bar.peak[channel]) {
          bar.peak[channel] = barValue;
          bar.hold[channel] = holdFrames;
        }
        if (!useCanvas)
          continue;
        if (isLumi || isAlpha)
          _ctx.globalAlpha = barValue;
        else if (isOutline)
          _ctx.globalAlpha = fillAlpha;
        setBarColor(barValue, barIndex);
        const barHeight = isLumi ? maxBarHeight : isLeds ? ledPosY(barValue) : barValue * maxBarHeight | 0;
        if (_mode == MODE_GRAPH) {
          const nextBarAvg = barIndex ? 0 : (this._normalizedB(fftData[_bars[1].binLo]) * maxBarHeight + barHeight) / 2;
          if (_radial) {
            if (barIndex == 0) {
              if (isDualHorizontal)
                _ctx.moveTo(...radialXY(0, 0));
              _ctx.lineTo(...radialXY(0, posX < 0 ? nextBarAvg : barHeight));
            }
            if (posX >= 0) {
              const point = [posX, barHeight];
              _ctx.lineTo(...radialXY(...point));
              points.push(point);
            }
          } else {
            if (barIndex == 0) {
              if (_mirror == -1 && !isDualHorizontal)
                _ctx.moveTo(initialX, analyzerBottom - (posX < initialX ? nextBarAvg : barHeight));
              else {
                const prevFFTData = binLo ? this._normalizedB(fftData[binLo - 1]) * maxBarHeight : barHeight;
                _ctx.moveTo(initialX - _lineWidth, analyzerBottom - prevFFTData);
              }
            }
            if (isDualHorizontal || _mirror != -1 || posX >= initialX)
              _ctx.lineTo(posX, analyzerBottom - barHeight);
          }
        } else {
          if (isLeds) {
            if (showBgColor && !overlay && (channel == 0 || !isDualCombined)) {
              const alpha = _ctx.globalAlpha;
              _ctx.strokeStyle = LEDS_UNLIT_COLOR;
              _ctx.globalAlpha = 1;
              strokeBar(barCenter, channelTop, analyzerBottom);
              _ctx.strokeStyle = _ctx.fillStyle;
              _ctx.globalAlpha = alpha;
            }
            if (isTrueLeds) {
              const colorIndex = isLumi ? 0 : colorStops.findLastIndex((item) => ledPosY(barValue) <= ledPosY(item.level));
              let last = analyzerBottom;
              for (let i = colorCount - 1; i >= colorIndex; i--) {
                _ctx.strokeStyle = colorStops[i].color;
                let y = analyzerBottom - (i == colorIndex ? barHeight : ledPosY(colorStops[i].level));
                strokeBar(barCenter, last, y);
                last = y - ledSpaceV;
              }
            } else
              strokeBar(barCenter, analyzerBottom, analyzerBottom - barHeight);
          } else if (posX >= initialX) {
            if (_radial)
              radialPoly(posX, 0, width, barHeight, isOutline);
            else if (isRound) {
              const halfWidth = width / 2, y = analyzerBottom + halfWidth;
              _ctx.beginPath();
              _ctx.moveTo(posX, y);
              _ctx.lineTo(posX, y - barHeight);
              _ctx.arc(barCenter, y - barHeight, halfWidth, PI, TAU);
              _ctx.lineTo(posX + width, y);
              strokeIf(isOutline);
              _ctx.fill();
            } else {
              const offset = isOutline ? _ctx.lineWidth : 0;
              _ctx.beginPath();
              _ctx.rect(posX, analyzerBottom + offset, width, -barHeight - offset);
              strokeIf(isOutline);
              _ctx.fill();
            }
          }
        }
        const peak = bar.peak[channel];
        if (peak > 0 && showPeaks && !showPeakLine && !isLumi && posX >= initialX && posX < finalX) {
          if (isOutline && _lineWidth > 0)
            _ctx.globalAlpha = 1;
          else if (isAlpha)
            _ctx.globalAlpha = peak;
          if (_colorMode == COLOR_BAR_LEVEL || isTrueLeds)
            setBarColor(peak);
          if (isLeds) {
            const ledPeak = ledPosY(peak);
            if (ledPeak >= ledSpaceV)
              _ctx.fillRect(posX, analyzerBottom - ledPeak, width, ledHeight);
          } else if (!_radial)
            _ctx.fillRect(posX, analyzerBottom - peak * maxBarHeight, width, 2);
          else if (_mode != MODE_GRAPH) {
            const y = peak * maxBarHeight;
            radialPoly(posX, y, width, !this._radialInvert || isDualVertical || y + innerRadius >= 2 ? -2 : 2);
          }
        }
      }
      if (!useCanvas)
        continue;
      _ctx.globalAlpha = 1;
      if (_mode == MODE_GRAPH) {
        setBarColor();
        if (_radial && !isDualHorizontal) {
          if (_mirror) {
            let p;
            while (p = points.pop())
              _ctx.lineTo(...radialXY(...p, -1));
          }
          _ctx.closePath();
        }
        if (_lineWidth > 0)
          _ctx.stroke();
        if (fillAlpha > 0) {
          if (_radial) {
            const start = isDualHorizontal ? getAngle(analyzerWidth >> 1) : 0, end = isDualHorizontal ? getAngle(analyzerWidth) : TAU;
            _ctx.moveTo(...radialXY(isDualHorizontal ? analyzerWidth >> 1 : 0, 0));
            _ctx.arc(centerX, centerY, innerRadius, start, end, isDualHorizontal ? !invertedChannel : true);
          } else {
            _ctx.lineTo(finalX, analyzerBottom);
            _ctx.lineTo(initialX, analyzerBottom);
          }
          _ctx.globalAlpha = fillAlpha;
          _ctx.fill();
          _ctx.globalAlpha = 1;
        }
        if (showPeakLine || _radial && showPeaks) {
          points = [];
          _ctx.beginPath();
          _bars.forEach((b, i) => {
            let x = b.posX, h = b.peak[channel], m = i ? "lineTo" : "moveTo";
            if (_radial && x < 0) {
              const nextBar = _bars[i + 1];
              h = findY(x, h, nextBar.posX, nextBar.peak[channel], 0);
              x = 0;
            }
            h *= maxBarHeight;
            if (showPeakLine) {
              _ctx[m](..._radial ? radialXY(x, h) : [x, analyzerBottom - h]);
              if (_radial && _mirror && !isDualHorizontal)
                points.push([x, h]);
            } else if (h > 0)
              radialPoly(x, h, 1, -2);
          });
          if (showPeakLine) {
            let p;
            while (p = points.pop())
              _ctx.lineTo(...radialXY(...p, -1));
            _ctx.lineWidth = 1;
            _ctx.stroke();
          }
        }
      }
      _ctx.restore();
      if (isDualHorizontal && !_radial)
        _ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!isDualHorizontal && !isDualCombined || channel)
        doReflex(channel);
    }
    updateEnergy(currentEnergy / (nBars << nChannels - 1));
    if (useCanvas) {
      if (_mirror && !_radial && !isDualHorizontal) {
        _ctx.setTransform(-1, 0, 0, 1, canvas.width - initialX, 0);
        _ctx.drawImage(canvas, initialX, 0, centerX, canvas.height, 0, 0, centerX, canvas.height);
        _ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      _ctx.setLineDash([]);
      drawScaleX();
    }
    if (this.showFPS) {
      const size = canvasX.height;
      _ctx.font = `bold ${size}px ${FONT_FAMILY}`;
      _ctx.fillStyle = FPS_COLOR;
      _ctx.textAlign = "right";
      _ctx.fillText(Math.round(_fps), canvas.width - size, size * 2);
    }
    if (this.onCanvasDraw) {
      _ctx.save();
      _ctx.fillStyle = _ctx.strokeStyle = _canvasGradients[0];
      this.onCanvasDraw(this, { timestamp, canvasGradients: _canvasGradients });
      _ctx.restore();
    }
  }
  /**
   * Return scaled frequency according to the selected scale
   */
  _freqScaling(freq) {
    switch (this._frequencyScale) {
      case SCALE_LOG:
        return Math.log2(freq);
      case SCALE_BARK:
        return 26.81 * freq / (1960 + freq) - 0.53;
      case SCALE_MEL:
        return Math.log2(1 + freq / 700);
      case SCALE_LINEAR:
        return freq;
    }
  }
  /**
   * Return the FFT data bin (array index) which represents a given frequency
   */
  _freqToBin(freq, method = "round") {
    const max = this._analyzer[0].frequencyBinCount - 1, bin = Math[method](freq * this.fftSize / this.audioCtx.sampleRate);
    return bin < max ? bin : max;
  }
  /**
   * Generate currently selected gradient
   */
  _makeGrad() {
    if (!this._ready)
      return;
    const { canvas, _ctx, _radial, _reflexRatio } = this, { analyzerWidth, centerX, centerY, initialX, innerRadius, outerRadius } = this._aux, { isLumi } = this._flg, isDualVertical = this._chLayout == CHANNEL_VERTICAL, analyzerRatio = 1 - _reflexRatio, gradientHeight = isLumi ? canvas.height : canvas.height * (1 - _reflexRatio * !isDualVertical) | 0;
    for (const channel of [0, 1]) {
      const currGradient = this._gradients[this._selectedGrads[channel]], colorStops = currGradient.colorStops, isHorizontal = currGradient.dir == "h";
      let grad;
      if (_radial)
        grad = _ctx.createRadialGradient(centerX, centerY, outerRadius, centerX, centerY, innerRadius - (outerRadius - innerRadius) * isDualVertical);
      else
        grad = _ctx.createLinearGradient(...isHorizontal ? [initialX, 0, initialX + analyzerWidth, 0] : [0, 0, 0, gradientHeight]);
      if (colorStops) {
        const dual = isDualVertical && !this._splitGradient && (!isHorizontal || _radial);
        for (let channelArea = 0; channelArea < 1 + dual; channelArea++) {
          const maxIndex = colorStops.length - 1;
          colorStops.forEach((colorStop, index) => {
            let offset = colorStop.pos;
            if (dual)
              offset /= 2;
            if (isDualVertical && !isLumi && !_radial && !isHorizontal) {
              offset *= analyzerRatio;
              if (!dual && offset > 0.5 * analyzerRatio)
                offset += 0.5 * _reflexRatio;
            }
            if (channelArea == 1) {
              if (_radial || isLumi) {
                const revIndex = maxIndex - index;
                colorStop = colorStops[revIndex];
                offset = 1 - colorStop.pos / 2;
              } else {
                if (index == 0 && offset > 0)
                  grad.addColorStop(0.5, colorStop.color);
                offset += 0.5;
              }
            }
            grad.addColorStop(offset, colorStop.color);
            if (isDualVertical && index == maxIndex && offset < 0.5)
              grad.addColorStop(0.5, colorStop.color);
          });
        }
      }
      this._canvasGradients[channel] = grad;
    }
  }
  /**
   * Normalize a dB value in the [0;1] range
   */
  _normalizedB(value) {
    const isLinear = this._linearAmplitude, boost = isLinear ? 1 / this._linearBoost : 1, clamp = (val, min, max) => val <= min ? min : val >= max ? max : val, dBToLinear = (val) => 10 ** (val / 20);
    let maxValue = this.maxDecibels, minValue = this.minDecibels;
    if (isLinear) {
      maxValue = dBToLinear(maxValue);
      minValue = dBToLinear(minValue);
      value = dBToLinear(value) ** boost;
    }
    return clamp((value - minValue) / (maxValue - minValue) ** boost, 0, 1);
  }
  /**
   * Internal function to change canvas dimensions on demand
   */
  _setCanvas(reason) {
    if (!this._ready)
      return;
    const { canvas, _ctx } = this, canvasX = this._scaleX.canvas, pixelRatio = window.devicePixelRatio / (this._loRes + 1);
    let screenWidth = window.screen.width * pixelRatio, screenHeight = window.screen.height * pixelRatio;
    if (Math.abs(window.orientation) == 90 && screenWidth < screenHeight)
      [screenWidth, screenHeight] = [screenHeight, screenWidth];
    const isFullscreen = this.isFullscreen, isCanvasFs = isFullscreen && this._fsEl == canvas, newWidth = isCanvasFs ? screenWidth : (this._width || this._container.clientWidth || this._defaultWidth) * pixelRatio | 0, newHeight = isCanvasFs ? screenHeight : (this._height || this._container.clientHeight || this._defaultHeight) * pixelRatio | 0;
    this._pixelRatio = pixelRatio;
    this._fsWidth = screenWidth;
    this._fsHeight = screenHeight;
    if (reason != REASON_CREATE && canvas.width == newWidth && canvas.height == newHeight)
      return;
    canvas.width = newWidth;
    canvas.height = newHeight;
    if (!this.overlay) {
      _ctx.fillStyle = "#000";
      _ctx.fillRect(0, 0, newWidth, newHeight);
    }
    _ctx.lineJoin = "bevel";
    canvasX.width = newWidth;
    canvasX.height = Math.max(20 * pixelRatio, Math.min(newWidth, newHeight) / 32 | 0);
    this._calcBars();
    this._makeGrad();
    if (this._fsStatus !== void 0 && this._fsStatus !== isFullscreen)
      reason = REASON_FSCHANGE;
    this._fsStatus = isFullscreen;
    if (this.onCanvasResize)
      this.onCanvasResize(reason, this);
  }
  /**
   * Select a gradient for one or both channels
   *
   * @param {string} name gradient name
   * @param [{number}] desired channel (0 or 1) - if empty or invalid, sets both channels
   */
  _setGradient(name, channel) {
    if (!this._gradients.hasOwnProperty(name))
      throw new AudioMotionError(ERR_UNKNOWN_GRADIENT, name);
    if (![0, 1].includes(channel)) {
      this._selectedGrads[1] = name;
      channel = 0;
    }
    this._selectedGrads[channel] = name;
    this._makeGrad();
  }
  /**
   * Set object properties
   */
  _setProps(options, useDefaults) {
    const callbacks = ["onCanvasDraw", "onCanvasResize"];
    const extraProps = ["gradientLeft", "gradientRight", "stereo"];
    const validProps = Object.keys(DEFAULT_SETTINGS).filter((e) => e != "start").concat(callbacks, extraProps);
    if (useDefaults || options === void 0)
      options = { ...DEFAULT_SETTINGS, ...options };
    for (const prop of Object.keys(options)) {
      if (callbacks.includes(prop) && typeof options[prop] !== "function")
        this[prop] = void 0;
      else if (validProps.includes(prop))
        this[prop] = options[prop];
    }
    if (options.start !== void 0)
      this.toggleAnalyzer(options.start);
  }
};
/*! Bundled license information:

audiomotion-analyzer/src/audioMotion-analyzer.js:
  (**!
   * audioMotion-analyzer
   * High-resolution real-time graphic audio spectrum analyzer JS module
   *
   * @version 4.4.0
   * @author  Henrique Avila Vianna <hvianna@gmail.com> <https://henriquevianna.com>
   * @license AGPL-3.0-or-later
   *)
*/
