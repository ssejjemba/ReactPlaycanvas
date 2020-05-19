import React from 'react';
import styled from 'styled-components';
import Blocks from './Blocks';

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.fullParams = this.setParams();
    this.state = {
      index: 0,
    };
    this.blocks = new Blocks();
  }

  setParams = () => {
    return [
      {
        id: 'first-block',
        type: 'model',
        asset: './demos/canV2-embedded.gltf',
      },
      {
        id: 'first-select',
        type: 'select',
      },
      {
        id: 'second-block',
        type: 'model',
        asset: './demos/cscanv3.gltf',
      },
      {
        id: 'second-select',
        type: 'select',
      },
      {
        id: 'third-block',
        type: 'model',
        asset: './demos/cscanv4.gltf',
      },
      {
        id: 'forth-block',
        type: 'model',
        asset: './demos/cscanv5.gltf',
      },
    ];
  };

  currentBlock = () => {
    const { index } = this.state;
    return this.fullParams[index];
  };

  moveToNextBlock = () => {
    const { index } = this.state;
    if (index === this.fullParams.length - 1) {
      // reset to first block
      this.setState({ index: 0 });
      return;
    }

    console.log('moving to next block');

    this.setState({ index: index + 1 });
  };

  render() {
    const { currentBlock, moveToNextBlock } = this;
    console.log('has re-rendered');
    const props = currentBlock();
    props.moveToNextBlock = moveToNextBlock;
    // force each render to create new instance of playcanvas component
    return <Layout>{this.blocks.type[props.type](props)}</Layout>;
  }
}

export default App;
