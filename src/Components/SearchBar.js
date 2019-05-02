import React, { Component } from 'react';
import { BrowserRouter as Redirect } from 'react-router-dom'
import { Alert } from 'reactstrap';


export class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      whatIsTyped: ''
    }
  }
  // SearchBar
  // //This function updates the state when the a new query is inputed to the form
  handleChange = (event) => {
    let value = event.target.value;
    console.log("handleChange", value);
    this.setState({ whatIsTyped: value })
  }

  // //This function overrides the default behavior when the form is submitted (enter key is pressed)
  handleSubmit = (event) => {
    console.log("handlesubmigt");
    event.preventDefault();
    console.log(this.state.whatIsTyped)
    this.props.changeState(this.state.whatIsTyped);
    console.log("hanglesubmit2")
  }

  render() {
    let url = '/search';
    if (this.props.loaded === true) {
      this.props.defaultLoadedState();
      return <Redirect to={url} />
    }
    return (
      <div>
        <section className="section section-dark section-search">
          <div className="container">
            <h2>Stock Search</h2>
          </div>
          <div className="search-bar">
            <div className="container">
              <div className="bar row justify-content-center">
                <form className="search" aria-label="search forum" autoComplete="off" onSubmit={this.handleSubmit}>
                  <input onChange={this.handleChange} value={this.state.whatIsTyped} type="text" placeholder="Enter Stock Ticker" name="search" aria-label="search forum" />
                  <button onClick={this.handleSubmit} type="button" className="search-btn" aria-label="search button"><i className="fa fa-search"></i></button>
                </form>
              </div>
              <div className="pt-3">
                {this.props.loaded === false && <AlertSign defaultLoadedState={this.props.defaultLoadedState} />}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
}

//This class creats the alter if the search is not found
export class AlertSign extends Component {
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
        Please Enter A Correct Ticker
      </Alert>
    );
  }
}