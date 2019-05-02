import React, { Component } from 'react';

//This class creates the index section
export class Indices extends Component {
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
  
          <section className="section section-dark index">
            <div className="container">
              <div className="row justify-content-center pt-3">
                <div className="col-sm-7 col-lg-3 indices">
                  <div className="indexbox">
                    <div><span>{this.state.dia.symbol}</span></div>
                    <div><span>{this.state.dia.latestPrice}</span></div>
                    <div><span>{(this.state.sp.changePercent * 100).toFixed(3) + "%"}</span></div>
                  </div>
                </div>
                <div className="col-sm-7 col-lg-3 indices">
                  <div className="indexbox">
                    <div><span>{this.state.sp.companyName}</span></div>
                    <div><span>{this.state.sp.latestPrice}</span></div>
                    <div><span>{(this.state.dia.changePercent * 100).toFixed(3) + "%"}</span></div>
                  </div>
                </div>
                <div className="col-sm-7 col-lg-3 indices">
                  <div className="indexbox">
                    <div><span>{this.state.nas.companyName}</span></div>
                    <div><span>{this.state.nas.latestPrice}</span></div>
                    <div><span>{(this.state.nas.changePercent * 100).toFixed(3) + "%"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )
    }
  }
  