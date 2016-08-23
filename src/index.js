import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire';
require("./styles/customisations.scss");
import Thing from './thing.js';
import Progress from 'react-progressbar';
const Line = require('rc-progress').Line;

// Initialize Firebase
const config = {
  apiKey: "AIzaSyDJ30_ONRYF61qsRl8l6BLDLTOh6gJV3u8",
  authDomain: "whatiscooler-69221.firebaseapp.com",
  databaseURL: "https://whatiscooler-69221.firebaseio.com",
  storageBucket: "whatiscooler-69221.appspot.com",
};
firebase.initializeApp(config);

var App = React.createClass({
  mixins: [ReactFireMixin],

  getInitialState: function() {
    return {
      items: [],
      numberOfItems: 0,
      item1: 0,
      item2: 0
    };
  },

  generateTwoRandoms: function() {
    if (this.state.numberOfItems != 0) {
      var random1 = Math.floor(Math.random()*this.state.numberOfItems);
      var random2 = Math.floor(Math.random()*this.state.numberOfItems);
      if (random1 == random2) {
        this.generateTwoRandoms();
      }
      else {
        //return [random1, random2];
        this.setState({
          item1: random1,
          item2: random2
        })
      }
    }
    /*else {
      return [0,0];
    }*/
  },

  handleThingClick: function(item) {
    console.log(item)
    var otherItem = (item == this.state.item1) ? this.state.item2 : this.state.item1;
    // This gets the index of the item that was clicked.
    var clickUpdates = {};
    clickUpdates['items/'+this.state.items[item][".key"]+"/votesFor"] = this.state.items[item]["votesFor"] + 1;
    clickUpdates['items/'+this.state.items[item][".key"]+"/pairs/"+[this.state.items[otherItem][".key"]]] = this.state.items[item]["pairs"][this.state.items[otherItem][".key"]] + 1;
    clickUpdates['items/'+this.state.items[otherItem][".key"]+"/votesAgainst"] = this.state.items[otherItem]["votesAgainst"] + 1;
    var status = firebase.database().ref().update(clickUpdates);
  },

  componentWillMount: function() {
    // Get the base 'items' database reference.
    var fireRef = firebase.database().ref().child('items');
    //var waffleRef = fireRef.child('Waffle/category');
    // When anything in it changes, update the number of items.
    // TODO: change this to on children changing.
    fireRef.on('value', snap => {
      this.setState({
        numberOfItems: snap.numChildren()
      }, this.generateTwoRandoms); // generateTwoRandoms is called as the callback to the setState, so it doesn't do it with null data.
    });

    // Don't want to have to go through an object, so bind the items as an array. This also updates automatically (I think)
    this.bindAsArray(fireRef, "items");
  },

  render: function() {
    //var indices = this.generateTwoRandoms();
    // Here we access the item's "pairs" array, indexed on the key of the other item. (e.g. the Waffle pair entry of the Pancake item.)
    var rightVotes = this.state.items[0] ? this.state.items[this.state.item2]["pairs"][this.state.items[this.state.item1][".key"]] : 0;
    var leftVotes = this.state.items[0] ? this.state.items[this.state.item1]["pairs"][this.state.items[this.state.item2][".key"]] : 0;
    var votePercent = leftVotes/(rightVotes+leftVotes)*100;
    console.log(votePercent);
    return (
      <div className="body">
        <div className="header">
          <h3>WhatIsCooler.com</h3>
        </div>
        <div className="content">
          <h1>Choose which is cooler!</h1>
          <p>Remember, there is no right answer.</p>
          <div className="thingHolder">
            <div onClick={() => this.handleThingClick(this.state.item1)}><Thing thing={this.state.items[this.state.item1]} /></div>
            <div onClick={() => this.handleThingClick(this.state.item2)}><Thing thing={this.state.items[this.state.item2]} /></div>
          </div>
          <div className="progressContainer">
            <Line percent={votePercent} strokeColor="#28d56c" trailColor="#f92f47" strokeWidth="5"/>
          </div>
          <p>This matchup: left has {leftVotes} votes and right has {rightVotes}</p>
          <button className="randomButton" onClick={() => this.generateTwoRandoms()}>Random pair!</button>
        </div>
      </div>
    );
  }
})

ReactDOM.render(<App/>, document.querySelector("#myApp"));
