import { observable, action, computed } from 'mobx';

class ControlStore {
  /**
   * @type {boolean} allows block to move to next model
   */
  @observable move_next = false;

  /**
   * @type {number} pointer to current block
   */
  @observable currentIndex = 0;

  constructor() {
    this.fullParams = this.setParams();
  }

  setParams = () => {
    return [
      {
        id: 'first-block',
        asset: './demos/canV2-embedded.gltf',
      },
      {
        id: 'second-block',
        asset: './demos/cscanv3.gltf',
      },
      {
        id: 'third-block',
        asset: './demos/cscanv4.gltf',
      },
      {
        id: 'forth-block',
        asset: './demos/cscanv5.gltf',
      },
    ];
  };

  @computed
  currentBlock = () => {
    const index = this.currentIndex;
    return this.fullParams[index];
  };

  @action
  allow_move_next = () => {
    this.move_next = true;
  };

  @action
  stop_move_next = () => {
    this.move_next = false;
  };

  moveToNextBlock = () => {
    if (this.currentIndex === this.fullParams.length - 1) {
      // reset to first block
      this.currentIndex = 0;
      return;
    }

    this.currentIndex += 1;
  };
}

export default ControlStore;
