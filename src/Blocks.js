import React from 'react';
import PlayCanvas from './Playcanvas';
import Question from './Questionaire';
/**
 * @typedef {Object<string, any>} Blocks
 * @type {Blocks}
 */
class Blocks {
  /**
   * @type {Object.<string, Function>}
   */
  type;

  constructor() {
    this.buildMapping();
  }

  buildMapping() {
    this.type = {
      // loading: this.loading,
      model: this.model,
      select: this.select,
    };
  }

  /* loading = (active_block) => {
        return <Loading />
    } */

  /**
   * @typedef {{id: string, sub_type: string, move_next: boolean}} ActiveBlock
   * @param {ActiveBlock} active_block
   */
  model = (active_block) => {
    return <PlayCanvas {...active_block} />;
  };

  /**
   * @typedef {{id: string, sub_type: string, move_next: boolean}} ActiveBlock
   * @param {ActiveBlock} active_block
   */
  select = (active_block) => {
    return <Question {...active_block} />;
  };
}

export default Blocks;
