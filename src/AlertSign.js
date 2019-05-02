import React, { Component } from 'react';
import { Alert } from 'reactstrap';

//This class creats the alter if the search is not found
class AlertSign extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    };
    this.onDismiss = this.onDismiss.bind(this);
  }

  //This defines the expected behavior when the alert sign is dismissed
  onDismiss() {
    this.setState({ visible: false });
    this.props.defaultLoadedState();
  }

  render() {
    return (
      <Alert color="danger" isOpen={this.state.visible} toggle={this.onDismiss}>
        {this.props.message}
      </Alert>
    );
  }
}

export default AlertSign;