var React = require('react');
var ReactRouter = require('react-router-dom');
var Router = ReactRouter.BrowserRouter;
var Route = ReactRouter.Route;
var Switch = ReactRouter.Switch;
var Home = require('./home');
var Nav = require('./nav');
const Rebase = require('re-base');
import * as firebase from 'firebase';

// Initialize Firebase
const config = {
  apiKey: "AIzaSyDJ30_ONRYF61qsRl8l6BLDLTOh6gJV3u8",
  authDomain: "whatiscooler-69221.firebaseapp.com",
  databaseURL: "https://whatiscooler-69221.firebaseio.com",
  storageBucket: "whatiscooler-69221.appspot.com",
};
var fbApp = firebase.initializeApp(config); // this initializes fb for all components, not just this one, it seems.
var rebase = Rebase.createClass(fbApp.database());

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {}
    };
  }

  componentDidMount () {
    rebase.bindToState('items', {
      context: this,
      state: 'items',
      then: this.generateTwoRandoms
    })
  }

  render() {
    return (
      <Router>
        <div className='container'>
          <div className="header">
            <h3>WhatIsCooler.com</h3>
            <Nav/>
          </div>
          <Switch>
            <Route exact path='/' component={() => <Home items={this.state.items} rebase={rebase}/>} />
            <Route render={function () {
              return <p>Not Found</p>
            }} />
          </Switch>
        </div>
      </Router>
    )
  }
}

module.exports = App;