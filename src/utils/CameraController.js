/**
 * This class controls camera movements on the screen
 */
import pc from 'playcanvas';

class OrbitCamera extends pc.Entity {
  /**
   * @type {number} How fast the camera moves around the orbit. Higher is faster
   */
  orbitSensitivity = 0.3;

  /**
   * @type {number} Maximum pitch swing
   */
  MAX_PITCH_ANGLE = 90;

  /**
   * @type {number} Minimum pitch swing
   */
  MIN_PITCH_ANGLE = -90;

  /**
   * @type {number} Maximum pitch swing
   */
  MAX_DISTANCE = 100;

  /**
   * @type {number} Minimum pitch swing
   */
  MIN_DISTANCE = 0.05;

  distance;

  panSpeed = 0.1;

  inertia = 1;

  /**
   * @type {number} How fast the camera moves in and out. Higher is faster
   */
  distanceSensitivity = 0.15;

  fromWorldPoint = new pc.Vec3();

  toWorldPoint = new pc.Vec3();

  worldDiff = new pc.Vec3();

  dumpingFactor = 0.02;

  /**
   *
   * @param {pc.Application} app
   */
  constructor(app) {
    super('MainCameraController');
    this.app = app;

    this.camera = new pc.Entity('mainCam');

    this.camera.addComponent('camera', {
      clearColor: new pc.Color(1, 1, 1),
      nearClip: 0.05,
      farClip: 100,
    });

    const light = new pc.Entity();

    light.addComponent('light', {
      type: 'point',
      color: new pc.Color(1, 1, 1),
      range: 100,
      intensity: 3.2,
    });

    light.translate(0, 0, 6);

    this.addChild(light);

    this.camera.setLocalPosition(0, 0, this.distance);

    this.addChild(this.camera);

    this._initializePosition();

    this.orbitCamera = this.camera.camera;

    this.lastPoint = new pc.Vec2();

    this.app.on('update', this.update);
  }

  // /////////////////////////////// HELPER METHODS /////////////////////////////////////////////////
  // Property to get and set the pitch of the camera around the pivot point (degrees)
  // Clamped between this.pitchAngleMin and this.pitchAngleMax
  // When set at 0, the camera angle is flat, looking along the horizon

  get pitch() {
    return this._targetPitch;
  }

  set pitch(value) {
    this._targetPitch = this._clampPitchAngle(value);
  }

  // Property to get and set the yaw of the camera around the pivot point (degrees)
  get yaw() {
    return this._targetYaw;
  }

  set yaw(value) {
    this._targetYaw = value;

    // Ensure that the yaw takes the shortest route by making sure that
    // the difference between the targetYaw and the actual is 180 degrees
    // in either direction
    const diff = this._targetYaw - this._yaw;
    const reminder = diff % 360;
    if (reminder > 180) {
      this._targetYaw = this._yaw - (360 - reminder);
    } else if (reminder < -180) {
      this._targetYaw = this._yaw + (360 + reminder);
    } else {
      this._targetYaw = this._yaw + reminder;
    }
  }

  // Property to get and set the world position of the pivot point that the camera orbits around
  get pivotPoint() {
    return this._pivotPoint;
  }

  set pivotPoint(value) {
    this._pivotPoint.copy(value);
  }

  _initializePosition = () => {
    this.distance = 6;
    this._pivotPoint = new pc.Vec3();
    // Calculate the camera euler angle rotation around x and y axes
    // This allows us to place the camera at a particular rotation to begin with in the scene
    const cameraQuat = this.getRotation();

    // Preset the camera
    this._yaw = this._calcYaw(cameraQuat);
    this._pitch = this._clampPitchAngle(this._calcPitch(cameraQuat, this._yaw));

    this._targetPitch = this._pitch;
    this._targetYaw = this._yaw;
    this._distance = 0;
  };

  _clampPitchAngle = (pitch) => {
    // Negative due as the pitch is inversed since the camera is orbiting the entity
    return pc.math.clamp(pitch, -this.MAX_PITCH_ANGLE, -this.MIN_PITCH_ANGLE);
  };

  _clampDistance = (distance) => {
    // Negative due as the pitch is inversed since the camera is orbiting the entity
    return Math.min(Math.max(distance, this.MIN_DISTANCE), this.MAX_DISTANCE);
  };

  quatWithoutYaw = new pc.Quat();

  yawOffset = new pc.Quat();

  _calcPitch = (quat, yaw) => {
    const { quatWithoutYaw } = this;
    const { yawOffset } = this;

    yawOffset.setFromEulerAngles(0, -yaw, 0);
    quatWithoutYaw.mul2(yawOffset, quat);

    const transformedForward = new pc.Vec3();

    quatWithoutYaw.transformVector(pc.Vec3.FORWARD, transformedForward);

    return (
      Math.atan2(transformedForward.y, -transformedForward.z) *
      pc.math.RAD_TO_DEG
    );
  };

  _calcYaw = (quat) => {
    const transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);

    return (
      Math.atan2(-transformedForward.x, -transformedForward.z) *
      pc.math.RAD_TO_DEG
    );
  };

  // ///////////////////////////////////////////////// CONTROLLERS /////////////////////////////////////////

  rotateCamera = (event) => {
    this.pitch -= event.dy * this.orbitSensitivity;
    this.yaw -= event.dx * this.orbitSensitivity;
  };

  panCamera = (event) => {
    const { panSpeed } = this;
    this.translateLocal(-event.dx * panSpeed, event.dy * panSpeed, 0);
  };

  zoomCamera = (event) => {
    let dist = this.distance;
    dist -= event.wheel * this.distanceSensitivity * (this.distance * 0.1);
    this.distance = this._clampDistance(dist);
  };

  setCameraDistance = (distance) => {
    this.distance = distance;
  };

  setPanInertia = (inertia, radius, panDrag) => {
    if (panDrag) {
      this.panSpeed = panDrag;
    }

    this.panSpeed *= inertia;
    this.normalScale = radius;
    this.inertiaStep = inertia;
    this._distance = radius;

    if (inertia < 1) {
      this.MAX_DISTANCE *= inertia;
      this.MIN_DISTANCE *= inertia;
    }
  };

  update = (dt) => {
    // Add dumping, if any
    let t = Math.min(dt / this.dumpingFactor, 1);
    if (this.dumpingFactor === 0) {
      t = 1;
    }
    this._distance = pc.math.lerp(this._distance, this.distance, t);
    this._yaw = pc.math.lerp(this._yaw, this._targetYaw, t);
    this._pitch = pc.math.lerp(this._pitch, this._targetPitch, t);

    this.updatePosition();
  };

  updatePosition = () => {
    this.camera.setLocalPosition(0, 0, this._distance);
    this.setEulerAngles(this._pitch, this._yaw, 0);
  };

  resetCamera = () => {
    this.setLocalPosition(0, 0, 0);
    this.setCameraDistance(this.normalScale);
    this.yaw = this._calcYaw(new pc.Quat());
    this.pitch = this._calcPitch(new pc.Quat(), this.yaw);
  };
}

export default OrbitCamera;
