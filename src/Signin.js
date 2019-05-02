import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'
import AlertSign from './AlertSign';

class Signin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "", 
            password:""
        }
    }
    //This function updates the state when the a new query is inputed to the form
    handleChangeEmail = (event) => {
        let value = event.target.value;
        this.setState({ email: value })
    }

    //This function updates the state when the a new query is inputed to the form
    handleChangePassword = (event) => {
        let value = event.target.value;
        this.setState({password: value})
    }

    handleSignIn = (event) => {
      event.preventDefault();
      this.props.signIn(this.state.email, this.state.password);
    }

    handleSignUp = (event) => {
      event.preventDefault();
      this.props.signUp(this.state.email, this.state.password);
    }
    
    render() {
      let url = "/";
      // console.log(this.props.authError);
      //If it authenticates with no problem
      if (this.props.authError === false) {
        //this.props.defaultLoadedState();
        return <Redirect to={url} />
      }
        return (
                <div className="container signin">
                    <div className="row">
                        <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
                            <div className="card card-signin my-5">
                                <div className="card-body">
                                    <h5 className="card-title text-center">Sign In</h5>
                                    {this.props.authError === true && <AlertSign defaultLoadedState={() => (console.log("Authentication failed"))} message={this.props.authMessage} />}
                                    <form className="form-signin">
                                        <div className="form-label-group">
                                            <input type="email" id="inputEmail" onChange={this.handleChangeEmail} value={this.state.email} className="form-control" placeholder="Email address" required autoFocus />
                                            <label htmlFor="inputEmail">Email address</label>
                                        </div>

                                        <div className="form-label-group">
                                            <input type="password" id="inputPassword" onChange={this.handleChangePassword} value={this.state.password} className="form-control" placeholder="Password" required />
                                            <label htmlFor="inputPassword">Password</label>
                                        </div>                                
                                        <button className="btn btn-lg btn-primary btn-block text-uppercase mb-2" type="submit" onClick={this.handleSignIn}>Sign in</button>
                                        <button className="btn btn-lg btn-secondary btn-block text-uppercase" type="submit" onClick={this.handleSignUp}>Sign up</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>  
        );
    }
}

export default Signin;
