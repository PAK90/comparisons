'use strict';
import React from 'react';
import _ from 'lodash';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import styles from "./styles/customisations.scss";
import Thing from './thing.js';
import Searchbox from './searchbox.js';
const ProgressBar = require('react-progressbar.js');
import sha1 from 'sha1';
const base = require('1636');
const Raven = require('raven-js');
const queryString = require('query-string');
const ReactRouter = require('react-router-dom');

/*Raven.config('https://5190a531264b4bdcbc75fd7e8e414914@sentry.io/98304', {
  captureUnhandledRejections: true,
  autoBreadcrumbs: {
    console: false
  }
}).install();*/

var Home = React.createClass({
  mixins: [ReactFireMixin],

  getInitialState: function() {
    return {
      numberOfItems: 0,
      item1: 0,
      item2: 0,
      pair: null,
      //pairData: null,
      hasVoted: false,
      keepWinner: false,
      locked: false, // false, 1 or 2. denotes which item won't change when generating new pair.
      paused: false // the N second timer to prevent spammy voting.
    };
  },

  placeNewItem: function(isLeft, itemIndex) {
    if (itemIndex !== this.state.item1 && itemIndex !== this.state.item2) { // don't want duplicate items as pairs.
      isLeft ? this.setState({item1: itemIndex}, this.changeUrl(itemIndex, this.state.item2)) : this.setState({item2: itemIndex}, this.changeUrl(this.state.item1, itemIndex));
      // now focus on the other search box, which we know due to isLeft.
      document.getElementById(isLeft ? "search2" : "search1").focus();
    }
  },

  changeUrl: function(item1, item2) {
    var pair = [item1, item2].sort();
    var hash = sha1(pair[0].toString() + ',' + pair[1].toString());
    hash = base.to36(hash.slice(0, 9))
    // now update the url silently, without reloading the page.
    this.props.history.push('/?p=' + hash)
    console.log(hash);
    this.setState({pair: hash}, this.checkExistingWinner);
    // also update firebase with the new pair.
    this.props.rebase.fetch('pairs/' + hash, {
      context: this
    }).then(data => {
      if (_.isEmpty(data)) { // if it's a new pair, load new pair. if it's not, leave it.
        var newPair = {};
        newPair[this.state.item1] = true;
        newPair[this.state.item2] = true;
        this.props.rebase.post('pairs/' + hash, {
          data: newPair
        })
      }
    }).catch(error => {
      console.log(error);
    })
  },

  checkExistingWinner: function() {
    // check if already voted, and if yes, get which one won.
    if (this.props.userData && _.includes(_.keys(this.props.userData.pairs), this.state.pair)) {
      this.props.rebase.fetch('votes/' + this.props.userData.pairs[this.state.pair], {
        context: this
      }).then(data => {
        console.log(data);
        this.setState({existingWinner: data.winner, hasVoted: true});
      })
    }
    else this.setState({existingWinner: null});
  },

  generateTwoRandoms: function(winner) {
    if (this.state.numberOfItems !== 0 && !_.isEmpty(this.props.items)) {
      var random1 = (this.state.locked === 1 || winner === this.state.item1) ? this.state.item1
        : _.keys(this.props.items)[Math.floor(Math.random() * this.state.numberOfItems)];
      var random2 = (this.state.locked === 2 || winner === this.state.item2) ? this.state.item2
        : _.keys(this.props.items)[Math.floor(Math.random() * this.state.numberOfItems)];
      var perc = Math.random();
      console.log(perc);
      if (random1 === random2 || random1 === ".key" || random2 === ".key" || random1 === undefined || random2 === undefined) { // goddamn object .key prop.
        this.generateTwoRandoms(winner);
      }
      // with 95% chance, generate new pair if current pair has no mutual votes.
      else if (perc < 0.75 && (
        (this.props.items[random1].pairsFor === undefined || this.props.items[random1].pairsFor[random2] === undefined) &&
        (this.props.items[random2].pairsFor === undefined || this.props.items[random2].pairsFor[random1] === undefined) ) )
      {
        this.generateTwoRandoms(winner);
      }
      else {
        this.changeUrl(random1, random2);
        this.setState({
          item1: random1,
          item2: random2,
          hasVoted: false
        });
      }
    }
    else setTimeout(this.generateTwoRandoms.bind(this), 50); // this is annoying but has to be done, for now.
  },

  handleThingClick: function(item) {
    // no clicking allowed if paused, not logged in, or previously voted on this pair.
    if (this.state.paused || !this.props.user || _.includes(_.keys(this.props.userData.pairs), this.state.pair)) return;
    this.setState({paused: true}); // if we got in, prevent clicking.
    console.log(item)
    var otherItem = (item === this.state.item1) ? this.state.item2 : this.state.item1;
    setTimeout(function() {this.setState({paused: false});}.bind(this), 2000); // after 2 seconds, allow clicking.

    var itemRef = firebase.database().ref().child('items/' + item);
    var otherItemRef = firebase.database().ref().child('items/' + otherItem);
    var userRef = firebase.database().ref().child('users/' + this.props.user.uid);

    // get the new key immediately.
    var newVote = this.props.rebase.push('votes', {
      data: {left: this.state.item1, right: this.state.item2, voter: this.props.user.uid, voted: (new Date).getTime(),
              winner: item}
    });

    userRef.transaction(function(user) {
      if (user) {
        user.points++; // increment point count.
        if (!user.votes) {
          user.votes = {};
        }
        user.votes[newVote.key] = true;
        if (!user.pairs) {
          user.pairs = {};
        }
        user.pairs[this.state.pair] = newVote.key;
        // check if user voted on currently winning one.
        var votedVotes = (this.props.items[item] && this.props.items[item]["pairsFor"]) ? this.props.items[item]["pairsFor"][otherItem] : 0;
        var notVotedVotes = (this.props.items[otherItem] && this.props.items[otherItem]["pairsFor"]) ? this.props.items[otherItem]["pairsFor"][item] : 0;
        if (!votedVotes) votedVotes = 0;
        if (!notVotedVotes) notVotedVotes = 0;

        if (votedVotes === 0 && notVotedVotes === 0) {
          if (!user.firstVote) user.firstVote = 1;
          else user.firstVote++;
        }
        else if (votedVotes === notVotedVotes) {
          if (!user.tieVote) user.tieVote = 1;
          else user.tieVote++;
        }
        else if (votedVotes > notVotedVotes) {
          if (!user.guessRight) user.guessRight = 1;
          else user.guessRight++;
        }
        else if (votedVotes < notVotedVotes) {
          if (!user.guessWrong) user.guessWrong = 1;
          else user.guessWrong++;
        }
        else console.log("voted for " + item + ': ' + votedVotes + ", " + notVotedVotes);
      }
      return user;
    }.bind(this))

    itemRef.transaction(function(fbitem) {
      if (fbitem) {
        if (fbitem.pairsFor && fbitem.pairsFor[otherItem]) {
          fbitem.pairsFor[otherItem]++;
        }
        else if (fbitem.pairsFor) {
          fbitem.pairsFor[otherItem] = 1;
        }
        else {
          fbitem.pairsFor = {};
          fbitem.pairsFor[otherItem] = 1;
        }
        if (fbitem.votesFor) {
          fbitem.votesFor++;
        }
        else {
          fbitem.votesFor = 1;
        }
      }
      return fbitem;
    })

    otherItemRef.transaction(function(fbotherItem) {
      if (fbotherItem) {
        if (fbotherItem.pairsAgainst && fbotherItem.pairsAgainst[item]) {
          fbotherItem.pairsAgainst[item]++;
        }
        else if (fbotherItem.pairsAgainst) {
          fbotherItem.pairsAgainst[item] = 1;
        }
        else {
          fbotherItem.pairsAgainst = {};
          fbotherItem.pairsAgainst[item] = 1;
        }
        if (fbotherItem.votesAgainst) {
          fbotherItem.votesAgainst++;
        }
        else {
          fbotherItem.votesAgainst = 1;
        }
      }
      return fbotherItem;
    })

    // Generate a new pair.
    //this.state.keepWinner ? this.generateTwoRandoms(item) : this.generateTwoRandoms();
  },

  setItemsFromUrl: function() {
    // Get the current URL.
    console.log(location.search);
    if (location.search) { // if we already have a url.
      const parsedHash = queryString.parse(location.search);
      this.setState({pair: parsedHash.p}); // 'p' is the url code/prop/thing that holds the pair hash.
      this.props.rebase.fetch('pairs/' + parsedHash.p, {
        context: this
      }).then(data => {
        if (!_.isEmpty(data)) {
          this.setState({
            item1: _.keys(data)[0],
            item2: _.keys(data)[1],
            //pairData: data
          }, this.checkExistingWinner);
        }
        else this.generateTwoRandoms();
      }).catch(error => {
        //handle error
        console.log(error);
      })
    }
  },

  componentDidMount: function() {
    this.props.rebase.bindToState('itemCount', {
      context: this,
      state: 'numberOfItems',
      then: () => (location.search ? this.setItemsFromUrl() : this.generateTwoRandoms())
    });
    // we can immediately call generateTwoRandoms because items are passed as a prop! actually not true.
  },

  componentDidUpdate: function(prevProps) {
    // check if user data is not same as previous, if yes, then check for existing votes.
    if (this.props.userData && prevProps.userData !== this.props.userData) this.checkExistingWinner();
  },

  addItem: function(item, isLeft) {
    if (!item || !this.props.user || this.props.userData.points < 100) return;
    // increment the item count, and add the item. simple!
    // as a backup, check for item name in existing items OR if item is just whitespace.
    if (_.filter(this.props.items, ['name', item]).length || _.trim(item).length === 0) return;
    var countRef = firebase.database().ref().child('itemCount');
    countRef.transaction(function(count) {
      if (count) {
        count++;
      }
      return count;
    }).then((snap) => {console.log(snap); });

    // get the new key immediately, then push it to state.
    var newItem = this.props.rebase.push('items', {
      data: {name: item, addedBy: this.props.user.uid, added: (new Date).getTime(), mod: 1}
    });

    // subtract 100 points from user. also add new item id to their items list.
    var userRef = firebase.database().ref().child('users/' + this.props.user.uid);
    userRef.transaction(function(user) {
      if (user) {
        user.points = user.points - 100; // simple for now, increment point count.
        if (!user.items) {
          user.items = {};
        }
        user.items[newItem.key] = true;
      }
      return user;
    })
    this.setState(isLeft ? {"item1": newItem.key} : {"item2": newItem.key});
    this.changeUrl(newItem.key, isLeft ? this.state.item2 : this.state.item1);
  },

  render: function() {
    var leftVotes = (this.props.items[this.state.item1] && this.props.items[this.state.item1]["pairsFor"] && this.props.items[this.state.item1]["pairsFor"][this.state.item2]) ? this.props.items[this.state.item1]["pairsFor"][this.state.item2] : 0;
    var rightVotes = (this.props.items[this.state.item2] && this.props.items[this.state.item2]["pairsFor"] && this.props.items[this.state.item2]["pairsFor"][this.state.item1]) ? this.props.items[this.state.item2]["pairsFor"][this.state.item1] : 0;
    var leftPercent = leftVotes ? leftVotes / (leftVotes + rightVotes) : 0;
    var rightPercent = rightVotes ? rightVotes / (leftVotes + rightVotes) : 0;
    console.log(leftPercent, rightPercent);
    var Line = ProgressBar.Line;
    return (
      <div className="body">
        <div className="content">
          <h1>Choose which is cooler!</h1>
          <p>{this.state.numberOfItems + " items and " + (0.5 * (this.state.numberOfItems - 1) * this.state.numberOfItems) + " pairs in DB."}</p>
          <h2>{this.state.existingWinner && "You've already voted for " + this.props.items[this.state.existingWinner].name + " in this pair."}</h2>
          <div className="searchHolder">
            <Searchbox items={this.props.items} left={true} selected={this.placeNewItem} addItem={this.addItem} />
            <Searchbox items={this.props.items} left={false} selected={this.placeNewItem} addItem={this.addItem} />
          </div>
          <div className="thingHolder">
            <div onClick={() => this.handleThingClick(this.state.item1)}>
              <Thing thing={this.props.items[this.state.item1]} colour={styles.leftColour}  />
            </div>
            <div onClick={() => this.handleThingClick(this.state.item2)}>
              <Thing thing={this.props.items[this.state.item2]} colour={styles.rightColour}  />
            </div>
          </div>
          <div className="progressContainer">
          <div style={{transform: 'rotate(180deg)'}}>
            <Line progress={this.state.hasVoted ? leftPercent : 0} initialAnimate={true}
              options={{strokeWidth: 5, trailWidth: 5, color: styles.leftColour, trailColor: 'rgba(0,0,0,0)',
                duration: 2500, easing: 'easeInOut'}}
              /></div>
            <Line progress={this.state.hasVoted ? rightPercent : 0} initialAnimate={true}
              options={{strokeWidth: 5, trailWidth: 5, color: styles.rightColour, trailColor: 'rgba(0,0,0,0)',
                duration: 2500, easing: 'easeInOut'}}
              />
          </div>
          <div className="lockContainer">
            <button className="lockButton" onClick={() =>
              !this.state.locked ? this.setState({locked: 1}) : this.state.locked === 1 ? this.setState({locked: false}) : this.setState({locked: 1})}>
              {this.state.locked === 1 ? "Unlock 1" : "Lock 1"}</button>
            <input type="checkbox"
              onChange={() => this.setState({keepWinner: !this.state.keepWinner})}
              checked={this.state.keepWinner} /><label onClick={() => this.setState({keepWinner: !this.state.keepWinner})}>Keep winner</label>
            <button className="lockButton" onClick={() =>
              !this.state.locked ? this.setState({locked: 2}) : this.state.locked === 2 ? this.setState({locked: false}) : this.setState({locked: 2})}>
              {this.state.locked === 2 ? "Unlock 2" : "Lock 2"}</button>
          </div>
          <p>{this.state.hasVoted && ("Left has " + (leftVotes ? leftVotes : 0) + " votes and right has " + (rightVotes ? rightVotes : 0))}</p>
          <button className="randomButton" onClick={() => this.state.keepWinner ? this.generateTwoRandoms(this.state.existingWinner) : this.generateTwoRandoms()}>New pair!</button>
        </div>
      </div>
    );
  }
})

module.exports = Home;
