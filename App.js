import React, { Component } from 'react';
import './style.css';
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from 'react-router-dom'
import { Line } from "react-chartjs-2";
import _ from 'lodash';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { HashLink } from 'react-router-hash-link';
import Signin from './Signin';
import AlertSign from './AlertSign';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import {
  MDBNavbar, MDBNavbarBrand, MDBNavbarNav, MDBNavItem, MDBCollapse, MDBContainer,
  MDBHamburgerToggler
} from 'mdbreact';

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
      table: []
    }
  }

  //This function defines the callback if there is an authentication event. After logging in, user's data  is retrieve from
  //the database. If logging out, the data is cleared. 
  componentDidMount() {
    this.authUnregFunc = firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) { //firebaseUser defined: is logged in
        this.userCompany = firebase.database().ref('user/' + firebaseUser.uid + '/companies');
        let newAddQueue = [];
        this.userCompany.on('value', (snapshot) => {
          let companyDatabase = snapshot.val();
          if (companyDatabase == null) {
            newAddQueue = [];
          } else {
            let companyName = Object.keys(companyDatabase);
            newAddQueue = companyName.map((company) => {
              return companyDatabase[company];
            });
          }
          this.setState({ currentUser: firebaseUser, addQueue: newAddQueue, authError: false });
        });
      }
      else { //firebaseUser undefined: User just logged out
        this.setState({ currentUser: null, addQueue: [], authError: null, authMessage: null });
      }
    });
  }

  //Destroy the authentication event callback when the components is unmounted. The callback on the database
  //is also detached.
  componentWillUnmount() {
    this.authUnregFunc();
    this.userCompany.off();
  }

  //This function defines the signing up functionality. If there is an authentication error, show an alert
  //detailing the error message. 
  signUp = (email, password) => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.setState({ currentUser: firebase.auth().currentUser, authError: false });
      }).catch((error) => {
        console.log(error.message);
        this.setState({ authError: true, authMessage: error.message });
      })
  }

  //This function defines the signing in functionality. If there is an authentication error, show an alert 
  //detailing the error message.
  signIn = (email, password) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch((error) => {
        console.log(error.message);
        this.setState({ authError: true, authMessage: error.message });
      })
  }

  //This function defines the signing out functionality. If there is an error logging out, show an alert detailing
  //the error message.
  signOut = () => {
    firebase.auth().signOut()
      .catch(err => {
        this.setState({ authError: true, authMessage: err.message });
        console.log(err);
      }); //log any errors for debugging
    //this.setState({currentUser: {uid: "temp"}, authError: null});
  }


  //This function will be passed on to and called by Stock stats component to 
  //add the current company to Portfolio. addQueue contains all the company
  //that will be rendered on the portfolio components. This function doesn't allow duplicates
  addToQueue = () => {
    let newCompany = { stats: this.state.stats, quotes: this.state.quote }
    let containsComp = _.find(this.state.addQueue, (company) => {
      return company.stats.companyName === this.state.stats.companyName;
    });
    //If the user is not logged in and it doesn't contain the current company in its portfolio. 
    if (this.state.currentUser === null && !containsComp) {
      this.setState(() => {
        let temp = this.state.addQueue;
        temp.push(newCompany);
        return { addQueue: temp, table: temp }
      });
    }
    //If the user is logged in, we also modify the database for data retention. 
    else if (this.state.currentUser !== null && !containsComp) {
      this.userCompany = firebase.database().ref('user/' + this.state.currentUser.uid + '/companies');
      this.userCompany.push(newCompany);
      this.userCompany.on('value', (snapshot) => {
        let companyDatabase = snapshot.val();
        if (companyDatabase == null) {
          this.setState({ addQueue: [] });
        } else {
          let companyName = Object.keys(companyDatabase);
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
    //If the user is not logged in, just remove the company from the local portfolio list.
    if (this.state.currentUser === null) {
      let curCompany = _.find(this.state.addQueue, (company) => {
        return company.stats.companyName === name;
      });
      this.setState(() => {
        let temp = this.state.addQueue;
        _.remove(temp, curCompany);
        return { addQueue: temp }
      });
    }//If the user is logged in, modify both the database and the local portfolio list. 
    else {
      let companies = firebase.database().ref('user/' + this.state.currentUser.uid + '/companies');
      companies.once('value')
        .then((snapshot) => {
          let companyDatabase = snapshot.val();
          let companyName = Object.keys(companyDatabase);
          for (let i = 0; i < companyName.length; i++) {
            if (companyDatabase[companyName[i]].stats.companyName === name) {
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
    let url = `https://api.iextrading.com/1.0/stock/${newStock}/batch?types=quote,news,stats,logo,chart&range=1m&last=3`;
    fetch(url).then((response) => {
      return response.json()
    })
      .then((dataN) => {
        this.setState({ stats: dataN.stats, quote: dataN.quote, news: dataN.news, logo: dataN.logo, chart: dataN.chart, loaded: true })
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

  //This function will render the correct components when the route "search" is called by the users. If there is no data, automatically redirect the user back to home page.
  //If there is data, show the data in the search page.
  renderSearch = (props) => {
    if (this.state.news === "") {
      return <Redirect to="/" />
    }
    return <Search currentUser={this.state.currentUser} stats={this.state.stats} quote={this.state.quote} removeRow={this.removeFromQueue} addToQueue={this.addToQueue} companyList={this.state.addQueue}
      logo={this.state.logo} news={this.state.news} loaded={this.state.loaded} defaultLoadedState={this.defaultLoadedState} chart={this.state.chart} signOut={this.signOut} items={this.state.addQueue} />
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route
            path='/search'
            render={(props) => this.renderSearch(props)}
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
      </Router>
    )
  }
}

//This class creates the homepage
class Home extends Component {
  render() {
    if (this.props.items.length === 0) {
      return (
        <div>
          <NavBar currentUser={this.props.currentUser} signOut={this.props.signOut} addQueue={this.props.items} />
          {/* <Header currentUser={this.props.currentUser} signOut={this.props.signOut} /> */}
          <div className="pimg1" id="head" aria-label="Background image of a city">
            <PageTitle />
          </div>
          <SearchBar changeState={this.props.changeState} loaded={this.props.loaded} defaultLoadedState={this.props.defaultLoadedState} />
          <Indices />
          <Portfolio stats={this.props.stats} quote={this.props.quote} companyList={this.props.companyList} removeRow={this.props.removeRow} />
          <Footer />
        </div>
      )
    } else {
      return (
        <div>
          <NavBar currentUser={this.props.currentUser} signOut={this.props.signOut} addQueue={this.props.items} />
          {/* <Header currentUser={this.props.currentUser} signOut={this.props.signOut} /> */}
          <div className="pimg1" id="head" aria-label="Background image of a city">
            <PageTitle />
          </div>
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

// This class creates the sticky navbar.

class NavBar extends Component {
  state = {
    collapse1: false,
    collapseID: ''
  }

  toggleCollapse = collapseID => () => {
    this.setState(prevState => ({ collapseID: (prevState.collapseID !== collapseID ? collapseID : '') }));
  }

  toggleSingleCollapse = collapseId => {
    this.setState({
      ...this.state,
      [collapseId]: !this.state[collapseId]
    });
  }

  render() {
    let addQueue = this.props.addQueue;
    if (addQueue.length === 0) {
      return (
        <MDBNavbar className="topnav">
          <MDBContainer>
            <MDBNavbarBrand>
              <HashLink smooth to='/#head' className="navItem1"><i className="fas fa-home mr-1"></i>Home</HashLink>
            </MDBNavbarBrand>

            <nav className="normal">
              {(this.props.currentUser == null) && <Link to="/signin" className="navItem">Sign Up </Link>}
              {(this.props.currentUser == null) && (<Link to="/signin" className="navItem">Sign In </Link>)}
              {(this.props.currentUser !== null) && (<p className="navItem">Hello {this.props.currentUser.email}</p>)}
              {(this.props.currentUser !== null) && <Link to="/" className="navItem" onClick={this.props.signOut}>Sign Out</Link>}
              <HashLink smooth to="#portfolio" className="navItem">Portfolio</HashLink>
              <HashLink smooth to="/#index" className="navItem">Index</HashLink>
            </nav>

            <MDBHamburgerToggler color="#ddd" id="hamburger1" className="hamburger1" onClick={() => this.toggleSingleCollapse('collapse1')} />
            <MDBCollapse isOpen={this.state.collapse1} navbar className="hamburger1">
              <MDBNavbarNav left>

                <MDBNavItem active className="hamburger1">
                  {(this.props.currentUser == null) && <Link to="/signin" className="navItem">Sign Up</Link>}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser == null) && (<Link to="/signin" className="navItem">Sign In</Link>)}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser !== null) && <Link to="/" className="navItem" onClick={this.props.signOut}>Sign Out</Link>}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser !== null) && (<p className="navItem">Hello {this.props.currentUser.email}</p>)}
                </MDBNavItem>
                <MDBNavItem className="hamburger1" >
                  <HashLink smooth to="#portfolio" className="navItem">Portfolio</HashLink>
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="/#index" className="navItem">Index</HashLink>
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="/#search" className="navItem">Search</HashLink>
                </MDBNavItem>
              </MDBNavbarNav>
            </MDBCollapse>
          </MDBContainer>
        </MDBNavbar>
      )
    } else {
      return (
        <MDBNavbar className="topnav">
          <MDBContainer>
            <MDBNavbarBrand>
              <HashLink smooth to='/#head' className="navItem1"><i className="fas fa-home mr-1"></i>Home</HashLink>
            </MDBNavbarBrand>
            <nav className="normal">
              {(this.props.currentUser == null) && <Link to="/signin" className="navItem">Sign Up </Link>}
              {(this.props.currentUser == null) && (<Link to="/signin" className="navItem">Sign In </Link>)}
              {(this.props.currentUser !== null) && (<p className="navItem">Hello {this.props.currentUser.email}</p>)}
              {(this.props.currentUser !== null) && <Link to="/" className="navItem" onClick={this.props.signOut}>Sign Out</Link>}
              <HashLink smooth to="/#report" className="navItem">Report</HashLink>
              <HashLink smooth to="#portfolio" className="navItem">Portfolio</HashLink>
              <HashLink smooth to="/#index" className="navItem">Index</HashLink>
            </nav>
            <MDBHamburgerToggler color="#ddd" id="hamburger1" className="hamburger1" onClick={() => this.toggleSingleCollapse('collapse1')} />
            <MDBCollapse isOpen={this.state.collapse1} navbar className="hamburger1">
              <MDBNavbarNav left>
                <MDBNavItem active className="hamburger1">
                  {(this.props.currentUser == null) && <Link to="/signin" className="navItem">Sign Up</Link>}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser == null) && (<Link to="/signin" className="navItem">Sign In</Link>)}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser !== null) && <Link to="/" className="navItem" onClick={this.props.signOut}>Sign Out</Link>}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  {(this.props.currentUser !== null) && (<p className="navItem">Hello {this.props.currentUser.email}</p>)}
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="#portfolio" className="navItem">Portfolio</HashLink>
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="/#index" className="navItem">Index</HashLink>
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="/#search" className="navItem">Search</HashLink>
                </MDBNavItem>
                <MDBNavItem className="hamburger1">
                  <HashLink smooth to="#report" className="navItem">Report</HashLink>
                </MDBNavItem>
              </MDBNavbarNav>
            </MDBCollapse>
          </MDBContainer>
        </MDBNavbar>
      )
    }
  }
}

//This class creates the page title
class PageTitle extends Component {
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

//This class creates the searchbar
class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = { whatIsTyped: "" }
  }

  //This function updates the state when the a new query is inputed to the form
  handleChange = (event) => {
    let value = event.target.value;
    this.setState({ whatIsTyped: value })
  }

  //This function overrides the default behavior when the form is submitted (enter key is pressed)
  handleSubmit = (event) => {
    event.preventDefault();
    this.props.changeState(this.state.whatIsTyped);
  }

  render() {
    let url = '/search';
    let message = 'Please enter a valid ticker';
    //First check if the ticker that the users put is valid, if it is valid redirect to search page.
    if (this.props.loaded === true) {
      this.props.defaultLoadedState();
      return <Redirect to={url} />
    }
    //If there is an error loading the data, then show an alert sign.
    return (
      <div>
        <section className="section section-dark section-search" id="search">
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
                {this.props.loaded === false && <AlertSign defaultLoadedState={this.props.defaultLoadedState} message={message} />}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
}

//This class creates the index section
class Indices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dia: "",
      sp: "",
      nas: "",
    }
  }

  componentDidMount() {
    let uri = "https://api.iextrading.com/1.0/stock/market/batch?symbols=dia,spy,qqq&types=quote"
    fetch(uri).then((response) => {
      return response.json()
    })
      .then((data) => {
        this.setState({ dia: data.DIA.quote })
        this.setState({ sp: data.SPY.quote })
        this.setState({ nas: data.QQQ.quote })
      })
      .catch(function (error) {
      })
  }

  render() {
    return (
      <div>
        <div className="pimg2" aria-label="Background image of money">
          <div className="ptext">
            <h2>
              <span className="border">
                Indices
            </span>
            </h2>
          </div>
        </div>
        <section className="section section-dark" id="index">
          <div className="container">
            <div className="row justify-content-center pt-3">
              <div className="col-sm-7 col-lg-3 indices">
                <div className="indexbox">
                  <div>{this.state.dia.symbol}</div>
                  <div>{this.state.dia.latestPrice}</div>
                  <div>{(this.state.sp.changePercent * 100).toFixed(3) + "%"}</div>
                </div>
              </div>
              <div className="col-sm-7 col-lg-3 indices">
                <div className="indexbox">
                  <div>{this.state.sp.companyName}</div>
                  <div>{this.state.sp.latestPrice}</div>
                  <div>{(this.state.dia.changePercent * 100).toFixed(3) + "%"}</div>
                </div>
              </div>
              <div className="col-sm-7 col-lg-3 indices">
                <div className="indexbox">
                  <div>{this.state.nas.companyName}</div>
                  <div>{this.state.nas.latestPrice}</div>
                  <div>{(this.state.nas.changePercent * 100).toFixed(3) + "%"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
}

//This class creates the entire portfolio section include the section image and the portfolio table
class Portfolio extends Component {
  render() {
    let companyRows = this.props.companyList.map((cur) => {
      return <PortfolioRow key={cur} companyData={cur} removeRow={this.props.removeRow} />
    })
    return (
      <div>
        <div className="pimg3" aria-label="Background image of money">
          <div className="ptext">
            <h2>
              <span className="border">
                Portfolio
              </span>
            </h2>
          </div>
        </div>
        <div>
          <section className="section section-dark portfolio" id="portfolio">
            <div className="container">
              <table className="table table-hover table-responsive-md">
                <thead className="text-light">
                  <tr className="handler">
                    <th scope="col">Company Name</th>
                    <th scope="col">Ticker Symbol</th>
                    <th scope="col">Price</th>
                    <th scope="col">Daily Change</th>
                    <th scope="col">Percentage</th>
                    <th scope="col">Volume</th>
                    <th scope="col">Remove</th>
                  </tr>
                </thead>
                <tbody className="stock">
                  {companyRows}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    )
  }
}

//This class creates a row of data in the portfolio when the user click the add stock button
class PortfolioRow extends Component {
  //Remove the current company from the portfolio list
  removeCurRow = () => {
    this.props.removeRow(this.props.companyData.stats.companyName);
  }
  render() {
    let percent = this.props.companyData.quotes.changePercent;
    return (
      <tr>
        <th>{this.props.companyData.stats.companyName}</th>
        <td>{this.props.companyData.stats.symbol}</td>
        <td>{this.props.companyData.quotes.latestPrice}</td>
        <td>{this.props.companyData.quotes.change}</td>
        <td>{((100 - 100 + percent) * 100).toFixed(2) + "%"}</td>
        <td>{this.props.companyData.quotes.latestVolume}</td>
        <td>
          <button type="button" onClick={this.removeCurRow} className="btn btn-danger remove-button"><i className="fas fa-trash">Remove</i></button>
        </td>
      </tr>
    )
  }
}

//This class creates the footer
class Footer extends Component {
  render() {
    return (
      <div>
        <footer>
          <div className="container pt-5">
            <p>This website is created by Eric Lin, Molly Li, Christopher Sofian, Samantha Chow, Phuong Le.</p>
            <address>
              <p>Contact me at <a href="mailto:me@here.com">chengyi9@uw.edu</a>, or at <a href="tel:555-123-4567">(626)
                        695-3295</a>.</p>
            </address>
            <p>&copy; 2018 The Author.</p>
            <p>Data Collected From https://iextrading.com/developer/docs/#stocks</p>
          </div>
        </footer>
      </div>
    )
  }
}

//This class creates the search page if the data is found
class Search extends Component {
  render() {
    return (
      <div>
        <NavBar currentUser={this.props.currentUser} signOut={this.props.signOut} addQueue={this.props.items} />
        <SearchHead currentUser={this.props.currentUser} stats={this.props.stats} signIn={this.props.signIn} signOut={this.props.signOut} signUp={this.props.signUp} />
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

//This class creates the landing page of the search page with the image and the buttons
class SearchHead extends Component {
  render() {
    return (
      <div>
        <div className="pimg5" aria-label="Image of a city">
          <div className="ptext">
            <h1>
              <span className="border-head">
                {this.props.stats.symbol}
              </span>
            </h1>
          </div>
        </div>
      </div>
    )
  }
}

//This class creates a stock chart of the monthly pric movement
class StockTable extends Component {
  render() {
    let stockData = [];
    let stockDate = [];
    for (let i = 0; i < this.props.chart.length; i++) {
      stockData.push(this.props.chart[i]["close"]);
      stockDate.push(this.props.chart[i]["date"])
    }
    let data = {
      labels: stockDate,
      datasets: [
        {
          borderColor: 'grey',
          borderWidth: 3,
          pointBackgroundColor: "green",
          pointBorderColor: "green",
          data: stockData
        },
      ]
    }

    let options = {
      title: {
        display: true,
        text: 'Year To Date Price Movement',
        fontSize: 30,
        fontColor: "Grey",
        fontStyle: "Bold",
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 10,
          bottom: 10
        }
      },

      legend: false,

      pan: {
        enabled: true,
        mode: 'x'
      },
      zoom: {
        enabled: true,
        mode: 'xy'
      },
      maintainAspectRatio: false
    }
    return (
      <div className="container">
        <div className="chart row justify-content-center" id="chart" role="table">
          <Line
            data={data}
            width={300}
            height={580}
            options={options}

          />
        </div>
      </div>
    )
  }
}
//This class create a table with stock statistics
class StockStats extends Component {
  statsInfo(stuff) {
    let name = "this.props.stats." + stuff;
    return eval(name);
  }
  quoteInfo(stuff) {
    let name = "this.props.quote." + stuff;
    return eval(name);
  }
  render() {
    return (
      <div>
        <section className="section section-dark table-chart">
          <div className="container">
            <div className="chart row justify-content-center" id="chart" role="table"></div>
          </div>
          <div className="container mt-5 table-responsive-sm">
            <table className="table table-hover table-striped table-sm table-responsive-sm table-responsive-md summary-table text-light">
              <thead>
                <tr>
                  <th scope="col">Company Name</th>
                  <th scope="col">Ticker Symbol</th>
                  <th scope="col">Price</th>
                  <th scope="col">Daily Change</th>
                  <th scope="col">Percentage</th>
                  <th scope="col">Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td id="name">{this.statsInfo("companyName")}</td>
                  <td id="ticker">{this.statsInfo("symbol")}</td>
                  <td id="price">{this.quoteInfo("latestPrice")}</td>
                  <td id="change">{this.quoteInfo("change")}</td>
                  <td id="percentage">{((100 - 100 + this.quoteInfo("changePercent")) * 100).toFixed(2) + "%"}</td>
                  <td id="volume">{this.quoteInfo("latestVolume")}</td>
                </tr>
              </tbody>
            </table>
            <table className="table table-hover table-sm table-responsive-sm table-responsive-md summary-table text-light">
              <thead>
                <tr>
                  <th scope="col">Market Cap</th>
                  <th scope="col">Share Outstanding</th>
                  <th scope="col">Beta</th>
                  <th scope="col">Trailing P/E</th>
                  <th scope="col">Price/Sales</th>
                  <th scope="col">Price/Book</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td id="cap">{this.statsInfo("marketcap")}</td>
                  <td id="outstanding">{this.statsInfo("sharesOutstanding")}</td>
                  <td id="beta">{(100 - 100 + this.statsInfo("beta")).toFixed(2)}</td>
                  <td id="trailing">{this.quoteInfo("peRatio")}</td>
                  <td id="sales">{(100 - 100 + this.statsInfo("priceToSales")).toFixed(2)}</td>
                  <td id="books">{(100 - 100 + this.statsInfo("priceToBook")).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <table className="table table-hover table-sm table-responsive-sm table-responsive-md summary-table text-light">
              <thead>
                <tr>
                  <th scope="col">Revenue</th>
                  <th scope="col">Gross Profit</th>
                  <th scope="col">EBITDA</th>
                  <th scope="col">Diluted EPS</th>
                  <th scope="col">Profit Margin</th>
                  <th scope="col">Cash</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td id="revenue">{this.statsInfo("revenue")}</td>
                  <td id="gross">{this.statsInfo("grossProfit")}</td>
                  <td id="ebitda">{this.statsInfo("EBITDA")}</td>
                  <td id="eps">{(100 - 100 + this.statsInfo("ttmEPS")).toFixed(2)}</td>
                  <td id="margin">{this.statsInfo("profitMargin") + "%"}</td>
                  <td id="cash">{this.statsInfo("cash")}</td>
                </tr>
              </tbody>
            </table>
            <table className="table table-hover table-sm table-responsive-sm table-responsive-md summary-table text-light">
              <thead>
                <tr>
                  <th scope="col">Return on Assets</th>
                  <th scope="col">Return on Equity</th>
                  <th scope="col">Institution Percentage</th>
                  <th scope="col">Dividend Yield</th>
                  <th scope="col">Dividend Rate</th>
                  <th scope="col">Ex-Dividend Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td id="asset">{this.statsInfo("returnOnAssets") + "%"}</td>
                  <td id="equity">{this.statsInfo("returnOnEquity") + "%"}</td>
                  <td id="institution">{this.statsInfo("institutionPercent") + "%"}</td>
                  <td id="yield">{(100 - 100 + this.statsInfo("dividendYield")).toFixed(2) + "%"}</td>
                  <td id="rate">{this.statsInfo("dividendRate") + "%"}</td>
                  <td id="ex">{this.statsInfo("exDividendDate")}</td>
                </tr>
              </tbody>
            </table>
            <div>
              <HashLink smooth to="/search#portfolio"><button type="button" onClick={this.props.addToQueue} className="btn btn-light mt-3"><i className="fa fa-plus fa-fw" aria-hidden="true"></i>
                Add Stock To Portfolio
                    </button>
              </HashLink>
            </div>
          </div>
        </section>
      </div >
    )
  }
}

//This class creates the entire stock news section, including the section image and the news card
class StockNews extends Component {
  render() {
    let news = this.props.news.map(eachNews => {
      return <StockCard key={eachNews.headline} stats={this.props.stats} logo={this.props.logo} news={eachNews} />
    })
    return (
      <div>
        <div className="pimg4" aria-label="Background image of money">
          <div className="ptext">
            <h2>
              <span className="border">
                News
              </span>
            </h2>
          </div>
        </div>
        <div>
          <section className="section section-dark news">
            <div className="container">
              <div className="row">
                {news}
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }
}

//This class creates individual News Card based on the data
class StockCard extends Component {
  render() {
    let time = this.props.news.datetime.substring(-1, 10) + " " + this.props.news.datetime.substring(11, 16)
    return (
      <div className="col-md-12 col-lg-4 col-xl-4 news1">
        <div className="card mb-4 border border-info rounded">
          <img className="card-img-top" src={this.props.logo.url} alt="Company logo" />
          <div className="card-body  bg-secondary text-white">
            <h3 className="card-title">{this.props.stats.companyName}</h3>
            <p className="card-text">{this.props.news.headline}</p>
            <a type="button" className="btn btn-outline-info" href={this.props.news.url}>Link</a>
          </div>
          <div className="card-footer">
            <small className="text-muted">Last Updated: {time}</small>
          </div>
        </div>
      </div>
    )
  }
}

// This class creates the comparison table
class ComparisonTable extends Component {

  render() {
    let items = this.props.items;
    if (items.length === 0) {
      return (
        ""
      )
    } else {
      return (
        <div>
          <div className="pimg6" aria-label="Background image of money">
            <div className="ptext">
              <h2>
                <span className="border">
                  Report
                </span>
              </h2>
            </div>
          </div>
          <section className="section section-dark" id="report">
            <div className="container">
              <div className="search-table-outter wrapper">
                <table className="com-table search-table inner">
                  <tbody>
                    <TableHeader items={items} />
                    <LocationRow items={items} />
                    <LocationRow items={items} />
                    <LocationRow items={items} />
                    <LocationRow items={items} />
                    <LocationRow items={items} />
                  </tbody>
                </table>
                <PrintButtonClass />
              </div>
            </div>
          </section>
        </div>
      );
    }
  }
}

// This class creates the table header for the comparison table
class TableHeader extends Component {
  render() {
    let items = this.props.items;
    return (
      <tr>
        <td>Options</td>
        {
          items.map(items => {
            return (
              <td key={items.stats.symbol}>{items.stats.symbol}</td>
            )
          })
        }
      </tr>
    )
  }
}

// This class creates a row for the comparison table 
class LocationRow extends Component {

  constructor(props) {
    super(props);
    this.select = this.select.bind(this);
    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false,
      value: "Company Name",
    };
  }

  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  select(event) {
    this.setState({
      value: event.target.innerText
    })
  }

  render() {
    let statsTable;
    let result;

    result = {
      companyName: "Company Name", marketcap: "Market Cap", beta: "Beta", week52high: "52 Weeks High",
      week52low: "52 Weeks Low", week52change: "52 Weeks Change", shortInterest: "Short Interest", shortDate: "Short Date", dividendRate: "Dividend Rate",
      dividendYield: "Dividend Yield", exDividendDate: "Ex-Dividend Date", latestEPS: "Latest EPS", latestEPSDate: "Latest EPS Date", sharesOutstanding: "Shares Outstanding", float: "Float", returnOnEquity: "Return On Equity", consensusEPS: "Consensus EPS", numberOfEstimates: "Number of Estimates",
      symbol: "Symbol", EBITDA: "EBITDA", revenue: "Revenue", grossProfit: "Gross Profit", cash: "Cash", debt: "Debt", ttmEPS: "TTMEPS", revenuePerShare: "Revenue Per Share", revenuePerEmployee: "Revenue Per Employee", peRatioHigh: "PE High", peRatioLow: "PE Low",
      returnOnAssets: "Return On Assets", profitMargin: "Profit Margin", priceToSales: "Price To Sales", priceToBook: "Price To Book", day200MovingAvg: "200 Days Average", day50MovingAvg: "50 Days Average", institutionPercent: "Institution Percent",
      year5ChangePercent: "5 Years Change %", year2ChangePercent: "2 Years Change %", year1ChangePercent: "1 Year Change %", ytdChangePercent: "YTD Change %", month6ChangePercent: "6 Months Change %",
      month3ChangePercent: "3 Months Change %", month1ChangePercent: "1 Month Change %", day5ChangePercent: "5 Days Change %", day30ChangePercent: "30 Days Change %"
    };

    let allValues = Object.values(result);
    let computerName;
    let computerValue;
    let statsArray;
    let statsTableArray = [];
    for (let i = 0; i < this.props.items.length; i++) {
      statsArray = this.props.items[i].stats;

      for (let j = 0; j < allValues.length; j++) {
        if (allValues[j] === this.state.value) {
          let humanName = allValues[j];
          computerName = (_.invert(result))[humanName];
          computerValue = statsArray[computerName];
          statsTableArray.push(computerValue)
        }
      }
    }

    statsTable = statsTableArray.map((items) => {
      return (
        <td key={Math.random()}>{items}</td>
      )
    });

    return (
      <tr>
        <td key={Math.random()}>
          <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle} >
            <DropdownToggle className="option btn-light">
              {this.state.value} <i className="fa fa-chevron-circle-down" aria-hidden="true"></i>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu">

              {allValues.map((item, index) => {
                return (<DropdownItem onClick={this.select}>{item}</DropdownItem>)
              })
              }
            </DropdownMenu>
          </Dropdown>
        </td>
        {statsTable}
      </tr>
    );
  }
}

// this class create a print button inside the comparison table
class PrintButtonClass extends Component {
  print() {
    window.print();
  }
  render() {
    return (
      <div className="print-button">
        <button className="btn btn-info btn-lg mt-4" data-toggle="button" type="button" onClick={this.print}>Print</button>
      </div>
    )
  }
}


export default App;