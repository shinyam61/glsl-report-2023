
/** ===========================================================================
 * フラグメントシェーダだけで絵作りを行うシェーダアートの世界では、思いもよらな
 * いアイデアを駆使して絵作りが行われることがあります。
 * 初めて目にしたときは驚きますが、よくよく考えてみると実は単純な算数・数学でそ
 * れが実現されている場合がほとんどです。ここではフラグメントシェーダだけを用い
 * て線（ライン）を描画するというテーマで、いろいろなシェーダの書き方を考えてみ
 * ましょう。
 * また、今回のサンプルでは JavaScript から GLSL に汎用パラメータを同時に４つ送
 * れるようにしています。これは、そのほうが単純にいろいろ遊んだりしやすいためで、
 * それ以上の深い意味や背景があるわけではありません。
 * 普通は、一般的なプログラミングと同様に変数名の命名規則はわかりやすく扱いやす
 * さを重視すべきですが、ここでは改造しやすさを重視してこうしています。
 * ========================================================================= */

import { WebGLUtility, ShaderProgram } from '/lib/webgl.js';
import { controller } from '/last/controller.js';

window.addEventListener('DOMContentLoaded', async () => {
  controller();

  const app = new WebGLApp();
  window.addEventListener('resize', app.resize, false);
  app.init('webgl-canvas');
  await app.load();
  app.setup();
  app.render();

}, false);

class WebGLApp {
  /**
   * @constructor
   */
  constructor() {
    // 汎用的なプロパティ
    this.canvas = null;
    this.gl = null;
    this.running = false;

    this.rafId = null;

    // this を固定するためメソッドをバインドする
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    // 各種パラメータや uniform 変数用
    this.previousTime = 0; // 直前のフレームのタイムスタンプ
    this.timeScale = 1.0;  // 時間の進み方に対するスケール
    this.uTime = 0.0;      // uniform 変数 time 用
    this.uColumn = [0, 0];

    this.isTest = controller.isTest;
    this.fs = `precision highp float;

    uniform vec2 resolution;
    uniform float time;

    ${localStorage.getItem('shader')}
    
    void main() {
      float wave = noise(time, resolution);
      vec3 rgb = vec3(wave);
      gl_FragColor = vec4(rgb , 1.0);
    }  `
  }
  /**
   * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
   * @return {Promise}
   */
  async load() {
    const vs = await WebGLUtility.loadFile('/last/main.vert');
    const fs = this.isTest ? await WebGLUtility.loadFile('/last/main.frag') : this.fs;
    console.log
    this.shaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attribute: [
        'position',
      ],
      stride: [
        3,
      ],
      uniform: [
        'resolution',
        'time',
        ...(
          this.isTest 
            ? [
              'column',
              'f',
              'line'
            ]
            :[]
        )
      ],
      type: [
        'uniform2fv',
        'uniform1f',
        ...(
          this.isTest 
            ? [
              'uniform2fv',
              'uniform1fv',
              'uniform1i'
            ]
            :[]
        )
      ],
    });
  }
  /**
   * WebGL のレンダリングを開始する前のセットアップを行う。
   */
  setup() {
    const gl = this.gl;

    this.setupGeometry();
    this.resize();
    this.running = true;
    this.previousTime = Date.now();

    gl.clearColor(0.1, 0.1, 0.1, 1.0);

    this.shaderProgram.use();
    this.shaderProgram.setAttribute(this.vbo);


    const xCol = document.getElementById('vcol');
    const yCol = document.getElementById('hcol');

    if (!xCol) {
      return;
    }

    this.uColumn = [xCol.value, yCol.value];

    [xCol, yCol].forEach((col, idx) => {
      col.addEventListener('change', () => {
        this.uColumn[idx] = col.value;
      })
    })

    this.table = document.getElementById('table');
    this.line = document.getElementById('line');

  }
  /**
   * ジオメトリ（頂点情報）を構築するセットアップを行う。
   */
  setupGeometry() {
    this.position = [
      -1.0,  1.0,  0.0,
       1.0,  1.0,  0.0,
      -1.0, -1.0,  0.0,
       1.0, -1.0,  0.0,
    ];
    this.vbo = [
      WebGLUtility.createVbo(this.gl, this.position),
    ];
  }
  /**
   * WebGL を利用して描画を行う。
   */
  render() {
    const gl = this.gl;

    if (this.running === true) {
      this.rafId = requestAnimationFrame(this.render);
    }

    // 直前のフレームからの経過時間を取得
    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
    this.uTime += time * this.timeScale;
    this.previousTime = now;

    // ビューポートのクリア処理
    gl.clear(gl.COLOR_BUFFER_BIT);

    // uniform 変数を設定し描画する
    this.shaderProgram.setUniform([
      [this.canvas.width, this.canvas.height],
      this.uTime,
      ...(
        this.isTest 
          ? [
            this.uColumn,
            this.table.getVals(),
            this.line.checked ? 1 : 0
          ]
          : []
      )
    ]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.position.length / 3);
  }
  /**
   * リサイズ処理を行う。
   */
  resize() {
    this.canvas.width = window.innerWidth / (this.isTest ? 2 : 1);
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  /**
   * WebGL を実行するための初期化処理を行う。
   * @param {HTMLCanvasElement|string} canvas - canvas への参照か canvas の id 属性名のいずれか
   * @param {object} [option={}] - WebGL コンテキストの初期化オプション
   */
  init(canvas, option = {}) {
    if (canvas instanceof HTMLCanvasElement === true) {
      this.canvas = canvas;
    } else if (Object.prototype.toString.call(canvas) === '[object String]') {
      const c = document.querySelector(`#${canvas}`);
      if (c instanceof HTMLCanvasElement === true) {
        this.canvas = c;
      }
    }
    if (this.canvas == null) {
      throw new Error('invalid argument');
    }
    this.gl = this.canvas.getContext('webgl', option);
    if (this.gl == null) {
      throw new Error('webgl not supported');
    }
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
  }
}

