import React, { Component } from 'react';
import { BrowserRouter as BrowserRouter, Link } from 'react-router-dom'

export class Header extends Component {
    render() {
      return (

          <div>
            <div className="pimg1" aria-label="Background image of a city">
              <nav>
                <div className="container">
                  <div className="row">
                    <div className="home col-2">
                      <HomeButton />
                    </div>
                    <div className="log col-10">
                      <SignIn signIn={this.props.signIn} signUp={this.props.signUp} authError={this.props.authError} authMessage={this.props.authMessage}/>
                      <SignUp signIn={this.props.signIn} signUp={this.props.signUp} authError={this.props.authError} authMessage={this.props.authMessage}/>
                    </div>
                  </div>
                </div>
              </nav>
              <PageTitle />
            </div>
          </div>
      )
    }
  }
  
  //This class creates the homebutton
  export class HomeButton extends Component {
    render() {
      return (
        <span>
          <Link to='/'><button type="button" className="btn btn-dark mt-2" aria-label="Home Icon"><i className="fas fa-home mr-1"></i>Home</button></Link>
        </span>
      )
    }
  }
  
  //This class creates the signin button
  export class SignIn extends Component {
    render() {
        return (
          <span>
            <Link to="/signin"><button type="submit" className="btn btn-primary mr-2 mt-2" aria-label="Sign In button">Sign In</button></Link>
          </span>
        )
      }
  }
  
  //This class creates the signup button
  export class SignUp extends Component {
    render() {
      return (
        <span>
          <Link to="/signin"><button type="submit" className="btn btn-secondary mt-2" aria-label="Sign Up button">Sign Up</button></Link>
        </span>
      )
    }
  }
  
  //This class creates the page title
  export class PageTitle extends Component {
    render() {
      return (
        <div>
          <div className="ptext">
            <h1>
              <span className="border-head">
                Gainz
              </span>
            </h1>
          </div>
          <div className="pcaption">
            <span className="border">
              REAL TIME STOCK QUOTE ANYTIME, ANYWHERE.
            </span>
          </div>
        </div>
      )
    }
  }