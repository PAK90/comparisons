var React = require('react');
var PropTypes = require('prop-types');
import _ from 'lodash';
var ProgressBar = require('react-progressbar.js')
var Circle = ProgressBar.Circle;

const calcPercentage = (item) => {
  // If the votes against are 0/falsey, it's 100% in favour.
  var overallPercent = (item.votesAgainst) ? ((item.votesFor) / (item.votesFor + item.votesAgainst)) : 1;

  // ...except if there's also 0 votes in favour.
  if ((!item.votesFor && !item.votesAgainst) || (!item.votesFor)) {
    overallPercent = 0;
  }
  return overallPercent;
}

const calcAllMatchups = (item) => {
  if (!item.pairsFor && item.pairsAgainst) return Object.keys(item.pairsAgainst).length;
  else if (item.pairsFor && !item.pairsAgainst) return Object.keys(item.pairsFor).length;
  else if (!item.pairsFor && !item.pairsAgainst) return 0;
  else {
    var For = Object.keys(item.pairsFor);
    var Against = Object.keys(item.pairsAgainst);
    // now count union number of keys
    return _.union(For, Against).length;
  }
}

const calcWinningMatchups = (item) => {
  if (!item.pairsFor) return 0;
  else if (item.pairsFor && !item.pairsAgainst) return Object.keys(item.pairsFor).length;
  else {
    var For = Object.keys(item.pairsFor);
    var Against = Object.keys(item.pairsAgainst);
    // for matchups this is winning, count pairsFor that don't exist in pairsAgainst,
    // and ones that exist in both but are higher in pairsFor.
    var totalFor = 0;
    _.forEach(For, (key) => {
      if (!item.pairsAgainst[key]) totalFor++;
      else if (item.pairsFor[key] > item.pairsAgainst[key]) totalFor++;
    })
    return totalFor;
  }
}

const ItemGrid = (props) => {
  var sortedItems = _.orderBy(props.items, (item) => {
    return calcPercentage(item);
  }, ['desc']); // TODO; multiple sorting options.
  return (
    <ul className='popular-list'>
      {sortedItems.map(function (item, index) {
        return (
          <li key={item.name} className='popular-item'>
            <div className='popular-rank'>#{index + 1}</div>
            <ul className='space-list-items'>
              <li><b>{item.name}</b></li>
              <li>{"Winning in " + calcWinningMatchups(item) +
                    " of " + calcAllMatchups(item) + " matchups so far"}</li>
              <li>{(calcPercentage(item) * 100).toFixed(1)}% success rate</li>
              <li><Circle progress={calcPercentage(item)}
                    initialAnimate={true}
                    text={(calcPercentage(item) * 100).toFixed(1) + "%"}
                    options={{strokeWidth: 7, trailColor: '#e32020', trailWidth: 2, easing: 'easeInOut',
                      from: {color: '#e32020'}, to: {color: '#2269ab'}, step: (state, circle) => {
                        circle.path.setAttribute('stroke', state.color);
                    }}}
                    containerStyle={{height: "55px", width: "55px", display: "inline-block"}}/></li>
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

ItemGrid.propTypes = {
  items: PropTypes.array.isRequired,
}

class Browse extends React.Component {
  render() {
    return (
      <div>
        {!this.props.items
          ? <p>LOADING!</p>
          : <ItemGrid items={this.props.items} />}
      </div>
    )
  }
}

Browse.propTypes = {
  items: PropTypes.array
}

module.exports = Browse;
