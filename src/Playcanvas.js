import * as React from 'react';
import styled from 'styled-components';
import pc from 'playcanvas';
import { wasmSupported, loadWasmModuleAsync, buildAabb } from './utils/utils';
import OriginController from './utils/OriginEntity';
import { loadGltf } from './utils/playcanvas-gltf';

const Frame = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
`;

const Button = styled.button`
  background-color: #2196f3;
  border-radius: 16px;
  width: 300px;
  margin-top: 16px;
  align-self: center;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  position: absolute;
  top: 20px;
  right: calc(50% - 150px);
`;

class PlayCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.app = null;
    this.canvas = null;
  }

  componentDidMount() {
    this.loadLib(this.renderApplication); // application is rendered after wasm modules are loaded
  }

  componentWillUnmount() {
    this.cleanUpListeners(this.app); // application is destroyed each time component is unmounted
  }

  /**
   * @param {pc.Application} app Instance of a PlayCanvas Application
   * @returns {Object}
   */
  setFrameRate(app) {
    app.autoRender = false;
    app.renderNextFrame = true;

    const FPS_RATE = 30;
    const delay = 1000.0 / FPS_RATE;

    // Redraw loop
    return window.setInterval(() => {
      app.scene.layers.getLayerById(pc.LAYERID_SKYBOX).enabled = false;
      app.renderNextFrame = true;
    }, delay);
  }

  loadLib = (done) => {
    if (wasmSupported()) {
      loadWasmModuleAsync(
        'Ammo',
        './lib/ammo/ammo.wasm.js',
        './lib/ammo/ammo.wasm.wasm',
        done
      );
    } else {
      loadWasmModuleAsync('Ammo', './lib/ammo/ammo.js', '', done);
    }
  };

  /**
   * @param {pc.Application} app Instance of a PlayCanvas Application
   */
  cleanUpListeners = (app) => {
    window.removeEventListener('resize', () => this.resizeCanvas(app));
    window.clearInterval(this.mainLoop);

    if (app) {
      const gl2 = app.graphicsDevice.canvas.getContext('webgl2');
      if (gl2) {
        gl2.getExtension('WEBGL_lose_context').loseContext();
      }

      if (this.asset) {
        this.asset.destroy();

        console.log('Asset has been destroyed');
      }

      app.destroy();

      console.log('App has been destroyed');
    }
  };

  /**
   * @param {pc.Application} app
   */
  changeCanvasDimensions = (app) => {
    // set max pixel to device pixel ratio
    app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
    // Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
    const canvasSize = this._getCanvasSize();
    app.setCanvasFillMode(
      pc.FILLMODE_NONE,
      canvasSize.width,
      canvasSize.height
    );
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    window.addEventListener('resize', () => this.resizeCanvas(app));

    app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);
    app.scene.gammaCorrection = pc.GAMMA_SRGB;
    app.scene.toneMapping = pc.TONEMAP_ACES;
  };

  _getCanvasSize = () => {
    return {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    };
  };

  /**
   * @param {pc.Application} app
   */
  resizeCanvas = (app) => {
    const canvasSize = this._getCanvasSize();
    app.resizeCanvas(canvasSize.width, canvasSize.height);
  };

  renderApplication = () => {
    const app = new pc.Application(this.canvas);
    console.log('New app has been created', app);
    app.scene.layers.getLayerById(pc.LAYERID_SKYBOX).enabled = false;
    app.start();
    this.mainLoop = this.setFrameRate(app);
    this.changeCanvasDimensions(app);
    // Set the gravity for our rigid bodies
    app.systems.rigidbody.gravity.set(0, 0, 0);
    this.originController = new OriginController();
    this.app = app;
    app.root.addChild(this.originController);
    this.loadJson(this.props.asset, this.loadAsset);
  };

  loadJson = (url, callback) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
  };

  loadAsset = (e, res) => {
    /* global DracoDecoderModule : true */
    /* eslint no-undef: "error" */
    const decoderModule = DracoDecoderModule({});
    loadGltf(res, this.app.graphicsDevice, this.addAsset, { decoderModule });
  };

  /**
   * @param {string} e is an empty string if there's no error
   * @param {Object} res holds the loaded asset model
   */
  addAsset = (e, res) => {
    if (e) {
      alert(e);
      return;
    }
    // Wrap the model as an asset and add to the asset registry
    const asset = new pc.Asset('gltf', 'model', {
      url: '',
    });
    const { app } = this;
    asset.resource = res.model;
    asset.loaded = true;
    app.assets.add(asset);

    // Add the loaded scene to the hierarchy
    const gltf = new pc.Entity('gltf');
    gltf.addComponent('model', {
      type: 'asset',
      asset,
    });

    gltf.addComponent('rigidbody', {
      type: pc.BODYTYPE_DYNAMIC,
    });

    gltf.addComponent('collision', {
      type: 'mesh',
      asset,
    });

    this.asset = gltf;
    console.log(gltf);
    this.originController.appendToOrigin(gltf);
    this.addVisualEntities();
  };

  addVisualEntities = () => {
    const camera = new pc.Entity('mainCam');

    camera.addComponent('camera', {
      clearColor: new pc.Color(1, 1, 1),
      nearClip: 0.05,
      farClip: 100,
    });

    // move camera to focus on asset position
    const modelBox = buildAabb(this.asset, 0);
    // console.log(modelBox.getMax())
    const halfExtents = modelBox.halfExtents;
    const radius = Math.max(
      halfExtents.x,
      Math.max(halfExtents.y, halfExtents.z)
    );

    const distance =
      (radius * 1.5) / Math.sin(0.5 * camera.camera.fov * pc.math.DEG_TO_RAD);

    camera.setLocalPosition(0, 0, distance);

    this.originController.appendToOrigin(camera);

    const light = new pc.Entity();

    light.addComponent('light', {
      type: 'point',
      color: new pc.Color(1, 1, 1),
      range: 100,
      intensity: 3.2,
    });

    light.translate(0, 0, 6);

    this.originController.appendToOrigin(light);
  };

  render() {
    const { moveToNextBlock } = this.props;
    return (
      <Frame>
        <canvas
          ref={(el) => {
            this.canvas = el;
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        ></canvas>
        <Button onClick={moveToNextBlock}>Next</Button>
      </Frame>
    );
  }
}

export default PlayCanvas;
