var React = require('react');
var ReactRouter = require('react-router-dom');
var Router = ReactRouter.BrowserRouter;
var Route = ReactRouter.Route;
var Switch = ReactRouter.Switch;
var browserHistory = ReactRouter.BrowserHistory;
import _ from 'lodash';
var Home = require('./home');
var Browse = require('./browse');
var Nav = require('./nav');
const Rebase = require('re-base');
import * as firebase from 'firebase';
var firebaseui = require('firebaseui');
import Modal from 'react-modal';

// Initialize firebase
const config = {
  apiKey: "AIzaSyDJ30_ONRYF61qsRl8l6BLDLTOh6gJV3u8",
  authDomain: "whatiscooler-69221.firebaseapp.com",
  databaseURL: "https://whatiscooler-69221.firebaseio.com",
  storageBucket: "whatiscooler-69221.appspot.com",
};
var fbApp = firebase.initializeApp(config); // this initializes fb for all components, not just this one, it seems.
var rebase = Rebase.createClass(fbApp.database());

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
      modalIsOpen: false,
      loggedIn: false,
      currentUser: null
    };

    this.ui = new firebaseui.auth.AuthUI(firebase.auth());
    this.uiConfig = {
      'signInSuccessUrl': 'http://localhost:3333',
      'signInOptions': [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      'signInFlow': 'popup',
      callbacks: {
        signInSuccess: function(currentUser, credential, redirectUrl) {
          alert("Signed in as "+currentUser + " with credential " + credential);
          this.setState({"modalIsOpen": false});
        }.bind(this)
      }
    };

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.setState({"loggedIn": true, "currentUser": user.uid})
        alert("Logged in!")
      }
      else {
        this.setState({"loggedIn": false, "currentUser": null})
        alert("Logged out!")
      }
    }.bind(this));
  }

  componentDidMount () {
    rebase.bindToState('items', {
      context: this,
      state: 'items'
    });
  }

  openModal = () => {
    if (!this.state.loggedIn) {
      this.setState({ modalIsOpen: true });
    }
    else { // Else log them out.
      firebase.auth().signOut();
    }
  }

  afterOpenModal = () => {
    this.ui.start('#firebaseui-auth-container', this.uiConfig)
  }

  closeModal = () => {
    this.setState({modalIsOpen: false});
  }

  render() {
    return (
      <Router history={browserHistory}>
        <div className='container'>
          <div className="header">
            <h3>WhatIsCooler</h3>
            <Nav/>
            <button onClick={this.openModal}>{!this.state.loggedIn ? "Login" : "Log out"}</button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onAfterOpen={this.afterOpenModal}
              onRequestClose={this.closeModal}
              style={customStyles}
            >
              <div id="firebaseui-auth-container"/>
            </Modal>
          </div>
          <Switch>
            <Route exact path='/' render={(props) => <Home {...props} rebase={rebase} items={this.state.items}/>} />
            <Route path='/browse' render={() => <Browse items={_.values(this.state.items)}/>} />
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
