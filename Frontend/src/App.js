// import Navbar from "./components/navbar";
// import FetchDataComponent from "./components/FetchDataComponent";
// import MyFunc from "./components/tryy";
// import React, {useState} from 'react';
// import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
// import BasicBars from "./components/barChart";
// import BarGraph from "./components/dayChart";
// import EventDurationChart from "./components/dayChart";

// const App = () => {
//   const [selectedCluster, setSelectedCluster] = useState('na99');

//   return (
//     <div>
      
//       <Navbar setSelectedCluster={setSelectedCluster} selectedCluster={selectedCluster} />
//       <MyFunc selectedCluster={selectedCluster}/>
//       <FetchDataComponent selectedCluster={selectedCluster} /> 
//     </div>
//   );
// };

// export default App; 

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./components/navbar";
import FetchDataComponent from "./components/FetchDataComponent";
import MyFunc from "./components/Weekly";

const App = () => {
  const [selectedCluster, setSelectedCluster] = useState('na99');

  return (
    <Router>
      <div>
        <Navbar setSelectedCluster={setSelectedCluster} selectedCluster={selectedCluster} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<MyFunc selectedCluster={selectedCluster} />} />
            <Route path="/fetch-data" element={<FetchDataComponent selectedCluster={selectedCluster} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

