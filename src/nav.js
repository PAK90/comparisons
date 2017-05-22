var React = require('react');
var NavLink = require('react-router-dom').NavLink; // allows change in style based on whether it's selected or not, as opposed to 'Link'

function Nav() {
  return (
    <ul className="nav">
      <li>
        <NavLink exact activeClassName="active" to="/">
          Home
        </NavLink>
      </li>
      <li>
        <NavLink activeClassName="active" to="/browse">
          Browse items
        </NavLink>
      </li>
    </ul>
  )
}

module.exports = Nav;
