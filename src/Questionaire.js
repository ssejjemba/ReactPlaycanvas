import * as React from 'react';
import styled from 'styled-components';
import './qn.css';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Card = styled.div`
  width: 50%;
  height: 40%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  padding: 2rem;
`;

const Heading = styled.h1``;

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
`;

const Question = (props) => {
  return (
    <Container>
      <Card>
        <Heading>This is another component</Heading>
        <label className='container'>
          choice 1
          <input type='radio' checked='checked' name='radio' readOnly />
          <span className='checkmark'></span>
        </label>
        <label className='container'>
          choice 2
          <input type='radio' name='radio' readOnly />
          <span className='checkmark'></span>
        </label>
        <Button onClick={props.moveToNextBlock}>Next</Button>
      </Card>
    </Container>
  );
};

export default Question;
