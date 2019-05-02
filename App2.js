import React, { Component } from 'react';
import './style.css';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom'
import _ from 'lodash';
import { Signin } from './Signin';
import { ComparisonTable } from './Components/Table';
import { Header } from './Components/Header';
import { SearchBar } from './Components/SearchBar'
import { Portfolio } from './Components/Portfolio'
import { Footer } from './Components/Footer'
import { SearchHead } from './Components/SearchHead'
import { StockTable } from './Components/StockTable'
import { StockStats } from './Components/StockStats'
import { StockNews } from './Components/StockNews'
import { Indices } from './Components/Indices'
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { HashLink } from 'react-router-hash-link';
import AlertSign from './AlertSign';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: "",
      quote: "",
      news: "",
      logo: "",
      loaded: null,
      chart: "",
      addQueue: [],
      currentUser: null,
      authError: null,
      authMessage: null,
      table: [],
      // searchbar
      // whatIsTyped: ''
    }
  }

  // // SearchBar
  // // //This function updates the state when the a new query is inputed to the form
  // handleChange = (event) => {
  //    let value = event.target.value;
  //    this.setState({ whatIsTyped: value })
  // }

  // // //This function overrides the default behavior when the form is submitted (enter key is pressed)
  //  handleSubmit = (event) => {
  //    event.preventDefault();
  //    console.log(this.state.whatIsTyped)
  //    this.changeState(this.state.whatIsTyped);
  //    console.log("hanglesubmit2")
  //  }


  componentDidMount() {
    this.authUnregFunc = firebase.auth().onAuthStateChanged((firebaseUser) => {
      console.log(firebaseUser);
      if (firebaseUser) { //firebaseUser defined: is logged in
        console.log("I'm logged in");
        this.userCompany = firebase.database().ref('user/' + firebaseUser.uid + '/companies');
        let newAddQueue = [];
        this.userCompany.on('value', (snapshot) => {
          let companyDatabase = snapshot.val();
          if (companyDatabase == null) {
            newAddQueue = [];
          } else {
            let companyName = Object.keys(companyDatabase);
            console.log(companyName);
            newAddQueue = companyName.map((company) => {
              return companyDatabase[company];
            });
            console.log(newAddQueue);
          }
          console.log("hereherehere")
          this.setState({ currentUser: firebaseUser, addQueue: newAddQueue, authError: false });
        });
      }
      else { //firebaseUser undefined: is not logged in
        this.setState({ currentUser: null, addQueue: [], authError: null, authMessage: null });
      }
    });
  }

  componentWillUnmount() {
    this.authUnregFunc();
    this.userCompany.off();
  }

  signUp = (email, password) => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        let allUser = firebase.database().ref();
        this.setState({ currentUser: firebase.auth().currentUser, authError: false });
      }).catch((error) => {
        console.log(error.message);
        this.setState({ authError: true, authMessage: error.message });
      })
  }

  signIn = (email, password) => {
    let authError = null;
    let authMessage = null;
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch((error) => {
        console.log(error.message);
        this.setState({ authError: true, authMessage: error.message });
      })
  }

  signOut = () => {
    firebase.auth().signOut()
      .catch(err => {
        this.setState({ authError: true, authMessage: err.message });
        console.log(err);
      }); //log any errors for debugging
  }


  //This function will be passed on to and called by Stock stats component to 
  //add the current company to Portfolio. addQueue contains all the company
  //that will be rendered on the portfolio components. This function doesn't allow duplicates
  addToQueue = () => {
    let newCompany = { stats: this.state.stats, quotes: this.state.quote }
    let containsComp = _.find(this.state.addQueue, (company) => {
      return company.stats.companyName === this.state.stats.companyName;
    });
    if (this.state.currentUser === null && !containsComp) {
      this.setState(() => {
        let temp = this.state.addQueue;
        temp.push(newCompany);
        return { addQueue: temp, table: temp }
      });
    }
    else if (this.state.currentUser !== null && !containsComp) {
      this.userCompany = firebase.database().ref('user/' + this.state.currentUser.uid + '/companies');
      this.userCompany.push(newCompany);
      this.userCompany.on('value', (snapshot) => {
        let companyDatabase = snapshot.val();
        if (companyDatabase == null) {
          this.setState({ addQueue: [] });
        } else {
          let companyName = Object.keys(companyDatabase);
          console.log("companyName " + companyName);
          let newAddQueue = companyName.map((company) => {
            return companyDatabase[company];
          });
          this.setState({ addQueue: newAddQueue, table: newAddQueue });
        }
      });
    }
  }

  //This function will be passed on to and called by PortfolioRow component to
  //remove a particular company from the portfolio.
  removeFromQueue = (name) => {
    let curCompany = _.find(this.state.addQueue, (company) => {
      return company.stats.companyName === name;
    });

    if (this.state.currentUser === null) {
      let curCompany = _.find(this.state.addQueue, (company) => {
        return company.stats.companyName === name;
      });
      this.setState(() => {
        let temp = this.state.addQueue;
        _.remove(temp, curCompany);
        return { addQueue: temp }
      });
    } else {
      let companies = firebase.database().ref('user/' + this.state.currentUser.uid + '/companies');
      companies.once('value')
        .then((snapshot) => {
          let companyDatabase = snapshot.val();
          let companyName = Object.keys(companyDatabase);
          for (let i = 0; i < companyName.length; i++) {
            if (companyDatabase[companyName[i]].stats.companyName == name) {
              firebase.database().ref('user/' + this.state.currentUser.uid + '/companies/' + companyName[i]).remove()
                .then(() => {
                  console.log("removed completed");
                });
            }
          }
        });
    }
  }

  //This function is called when the user inputed a ticker in the search form. The function will load the stock data and 
  //update the state of the app using this data. 
  changeState = (newStock) => {
    console.log("Click changestate");
    let url = `https://api.iextrading.com/1.0/stock/${newStock}/batch?types=quote,news,stats,logo,chart&range=1m&last=3`;
    fetch(url).then((response) => {
      return response.json()
    })
      .then((dataN) => {
        this.setState({ stats: dataN.stats })
        this.setState({ quote: dataN.quote })
        this.setState({ news: dataN.news })
        this.setState({ logo: dataN.logo })
        this.setState({ chart: dataN.chart })
        this.setState({ loaded: true })

      })
      .catch((err) => {
        this.setState({ loaded: false });
      })
  }

  //this function will set the loaded state back to null, this function will be called when an alert sign is dismissed.
  //this function is to prevent a bug where alert sign doesn't appear after dismissing it once.
  defaultLoadedState = () => {
    this.setState({ loaded: null });
  }

  render() {
    console.log('here', this.state)
    return (
        <Switch>
          <Route
            path='/search'
            render={(props) => <Search currentUser={this.state.currentUser} stats={this.state.stats} quote={this.state.quote} removeRow={this.removeFromQueue} addToQueue={this.addToQueue} companyList={this.state.addQueue}
              logo={this.state.logo} news={this.state.news} loaded={this.state.loaded} defaultLoadedState={this.defaultLoadedState} chart={this.state.chart} signOut={this.signOut} items={this.state.addQueue} />}
          />
          <Route
            path='/'
            render={(props) => <Home stats={this.state.stats} currentUser={this.state.currentUser} signOut={this.signOut} quote={this.state.quote} removeRow={this.removeFromQueue} companyList={this.state.addQueue}
              changeState={this.changeState} loaded={this.state.loaded} defaultLoadedState={this.defaultLoadedState} items={this.state.addQueue} />} exact
          />
          <Route
            exact path='/signin' render={(routerProps) => (<Signin signIn={this.signIn} signUp={this.signUp} authError={this.state.authError} authMessage={this.state.authMessage} />)}
          />
          <Route
            path='/signup' signIn={this.signIn} signOut={this.signOut} signUp={this.signUp} render={(routerProps) => (<Signin signIn={this.signIn} signUp={this.signUp} authError={this.state.authError} authMessage={this.state.authMessage} />)}
          />
        </Switch>
    )
  }
}

//This class creates the homepage
class Home extends Component {
  render() {
    if (this.props.items.length === 0) {
      return (
        <div>
          <Header />
          <SearchBar changeState={this.props.changeState} loaded={this.props.loaded} defaultLoadedState={this.props.defaultLoadedState} />
          <Indices />
          <Portfolio stats={this.props.stats} quote={this.props.quote} companyList={this.props.companyList} removeRow={this.props.removeRow} />
          <Footer />
        </div>
      )
    } else {
      return (
        <div>
          <Header />
          <SearchBar changeState={this.props.changeState} loaded={this.props.loaded} defaultLoadedState={this.props.defaultLoadedState} />
          <Indices />
          <Portfolio stats={this.props.stats} quote={this.props.quote} companyList={this.props.companyList} removeRow={this.props.removeRow} />
          <ComparisonTable items={this.props.items} />
          <Footer />
        </div>
      )
    }
  }
}

//This class creates the search page if the data is found
class Search extends Component {
  render() {
    return (
      <div>
        <SearchHead stats={this.props.stats} />
        <StockTable chart={this.props.chart} />
        <StockStats stats={this.props.stats} quote={this.props.quote} addToQueue={this.props.addToQueue} />
        <StockNews stats={this.props.stats} logo={this.props.logo} news={this.props.news} />
        <Portfolio stats={this.props.stats} quote={this.props.quote} removeRow={this.props.removeRow} companyList={this.props.companyList} />
        <ComparisonTable items={this.props.items} />
        <Footer />
      </div>
    )
  }
}

export default App;
