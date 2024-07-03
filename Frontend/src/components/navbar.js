import React from 'react';
import './navbar.css';
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

class Navbar extends React.Component {
  handleClusterSelect = (cluster) => {
    this.props.setSelectedCluster(cluster);
  }

  render() {
    const { selectedCluster } = this.props;
    return (
      <nav className='my_navbar'>        
          {/* <NavLink exact to="/" activeClassName="active-link">View Weekly</NavLink>
          <NavLink to="/fetch-data" activeClassName="active-link">Custom Dates</NavLink> */}
          <div className="navbar-options">
          <NavLink exact to="/" className="nav-button" activeClassName="active-link">
            <button>View Weekly</button>
          </NavLink>
          <NavLink to="/fetch-data" className="nav-button" activeClassName="active-link">
            <button>Custom Dates</button>
          </NavLink>
        </div>

          <div className='title'>
          <h2>IW Event Calendar</h2>
          {/* <h2>IW EVENT CALENDAR</h2> */}
          </div>
          

          <div className='cluster-buttons'>
            <button
              className={`button-na99 ${selectedCluster === 'na99' ? 'active' : ''}`}
              onClick={() => this.handleClusterSelect('na99')}
            >
              NA99
            </button>

            <button
              className={`button-emea99 ${selectedCluster === 'emea99' ? 'active' : ''}`}
              onClick={() => this.handleClusterSelect('emea99')}
            >
              EMEA99
            </button>
          </div>  
      </nav> 
    );
  }
}

export default Navbar;

