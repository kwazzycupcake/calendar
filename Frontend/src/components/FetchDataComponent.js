import React, { useState, useEffect } from 'react';
import './fetch.css';

const FetchDataComponent = ({ selectedCluster }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [order, setOrder] = useState("ASC");
  const [sortColumn, setSortColumn] = useState();

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [selectedCluster]);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/fetchData?startDate=${startDate}&endDate=${endDate}&cluster=${selectedCluster}`);
      const jsonData = await response.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }

      const formattedData = jsonData.map(item => {
        const { dateObj: dateBegin, formattedDate: formattedDateBegin } = formatDate(item.DATE_BEGIN);
        const { dateObj: dateEnd, formattedDate: formattedDateEnd } = formatDate(item.DATE_END);
        const durationMs = dateEnd - dateBegin;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const duration = `${hours}h ${minutes}m`;

        return {
          ...item,
          DATE_BEGIN: formattedDateBegin,
          DATE_END: formattedDateEnd,
          DATE_CREATED1: formatDate(item.DATE_CREATED1).formattedDate,
          EVENT_DURATION: duration,
        };
      });

      setData(formattedData);
      setCurrentPage(0);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM UTC' : 'AM UTC';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');

    return {
      dateObj,
      formattedDate: `${day} ${month} ${year} ${formattedHours}:${formattedMinutes} ${ampm}`
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchData();
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(data.length / itemsPerPage) - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  

  const paginatedData = data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= halfVisiblePages) {
        for (let i = 0; i < maxVisiblePages - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      } else if (currentPage >= totalPages - halfVisiblePages - 1) {
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = totalPages - (maxVisiblePages - 1); i < totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = currentPage - halfVisiblePages; i <= currentPage + halfVisiblePages; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      }
    }

    return pageNumbers;
  };

  const sorting = (col) => {
    if (sortColumn === col) {
      const newOrder = order === "ASC" ? "DESC" : "ASC";
      setOrder(newOrder);
    } else {
      setSortColumn(col);
      setOrder("ASC");
    }

    const sortedData = [...data].sort((a, b) => {
      const valA = a[col].toLowerCase();
      const valB = b[col].toLowerCase();
      return order === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    setData(sortedData);
  };

  return (
    <div className='container'>
      <form className='filter-form' onSubmit={handleSubmit}>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={handleStartDateChange} required />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={handleEndDateChange} required />
        </label>
        
        <button type="submit">Get Events Data</button>
      </form>
      <div className='dropDown'>
        <label>Show
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </label>
      </div>
      {loading && <p style={{marginTop:"20px", color:"black"}}>Fetching Data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data.length > 0 && (
        <div >
          <table className="table table-striped">
            <thead>
              <tr>
                <th onClick={() => sorting("NAME1")}>Event Name</th>
                <th onClick={() => sorting("SCO_ID")}>Event ID</th>
                <th onClick={() => sorting("DATE_BEGIN")}>Start Date</th>
                <th onClick={() => sorting("EVENT_DURATION")}>Event Duration</th>
                <th onClick={() => sorting("VALUE2")}>Capacity</th>
                <th onClick={() => sorting("DOMAIN_NAME")}>Domain Name</th>
                {/* <th onClick={() => sorting("RecordCreated2")}>Account Creation Date</th> */}
                <th onClick={() => sorting("ACL_ID1")}>Account ID</th>
                <th onClick={() => sorting("NAME2")}>Account name</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={index}>
                  <td>{item.NAME1}</td>
                  <td>{item.SCO_ID}</td>
                  <td>{item.DATE_BEGIN}</td>
                  <td>{item.EVENT_DURATION}</td>
                  <td>{item.VALUE2}</td>
                  <td>{item.DOMAIN_NAME}</td>
                  {/* <td>{item.RecordCreated2}</td> */}
                  <td>{item.ACL_ID1}</td>
                  <td>{item.NAME2}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-buttons">
            <button onClick={handlePreviousPage} disabled={currentPage === 0}>Previous</button>
            {getPageNumbers().map((number, index) => (
              <button
                key={index}
                onClick={() => typeof number === 'number' && handlePageClick(number)}
                className={currentPage === number ? 'active' : ''}
                disabled={typeof number !== 'number'}
              >
                {number === '...' ? '...' : number + 1}
              </button>
            ))}
            <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FetchDataComponent;

