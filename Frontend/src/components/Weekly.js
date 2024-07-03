

// To display weekly data and graphs
import React, { useState, useEffect, useRef} from 'react';
import ReactECharts from 'echarts-for-react';
import './weekly.css';

const Myfunc = ({ selectedCluster }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [order, setOrder] = useState("ASC");
  const [sortColumn, setSortColumn] = useState();
  const [graphData, setGraphData] = useState([]);


  const fetchDataForDateRange = async (startDate, endDate, cluster) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/fetchData?startDate=${startDate}&endDate=${endDate}&cluster=${selectedCluster}`);
      const jsonData = await response.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }

      
      setGraphData(jsonData);

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

      formattedData.sort((a, b) => new Date(a.DATE_BEGIN) - new Date(b.DATE_BEGIN));

      setData(formattedData);
      setLoading(false);
      setCurrentPage(0);

    } catch (error) {
      setError(error.message); // Set error message as string
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    end.setDate(currentDate.getDate()+6);
    setStartDate(start);
    setEndDate(end);
    fetchDataForDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0], selectedCluster);
  }, [currentDate, selectedCluster]);

  

  useEffect(() => {
    if (graphData.length > 0) {
      const { dates, maxCapacities, eventCounts } = parseDataForMaxCapacity(graphData);
      
      const formattedDates = dates.map(formatDateForDisplay);

      const initialOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const date = params[0].name;
            const capacity = params[0].value;
            const eventCount = eventCounts[params[0].dataIndex];
            return `${date}<br/>Maximum Capacity: ${capacity}<br/>Total Events: ${eventCount}`;
          }
        },
        
        xAxis: {
          type: 'category',
          data: formattedDates,
          name: 'Day',
        },
        yAxis: {
          type: 'value',
          name: 'Maximum Capacity',
          min: 0,
          max: 2000,
          interval: 500,
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            data: maxCapacities,
            type: 'bar',
            itemStyle: {
              color: '#75caa9',
              emphasis: {
                color: '#A8E6CE' // Change the color on hover
              }
            }
          },
        ],
      };

      setOption(initialOption);
    }
  }, [graphData]);

  const handlePrevWeek = () => {
    setCurrentDate(prevDate => {
      const newStartDate = new Date(prevDate);
      newStartDate.setDate(newStartDate.getDate() - 7);
      return newStartDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => {
      const newStartDate = new Date(prevDate);
      newStartDate.setDate(newStartDate.getDate() + 7);
      return newStartDate;
    });
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

 
  
  // Predefined array of colors
  const colors = ['#A8E6CE', '#DCEDC2', '#FFD3B5', '#FFAAA6', '#FF8C94', '#69D2E7', '#A7DBD8', '#E0E4CC', '#F38630', '#FA6900'];
  const [option, setOption] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const echartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);


  // week wise graph
  const parseDataForMaxCapacity = (data) => {
    const maxCapacityPerDay = {};
    const eventCountPerDay = {};
    data.forEach((event) => {
      if (event.DATE_BEGIN) {
        const date = event.DATE_BEGIN.split(' ')[0];
        const capacity = parseInt(event.VALUE2, 10);
        if (!maxCapacityPerDay[date] || capacity > maxCapacityPerDay[date]) {
          maxCapacityPerDay[date] = capacity;
        }
        if (!eventCountPerDay[date]) {
          eventCountPerDay[date] = 0;
        }
        eventCountPerDay[date] += 1;
      }
    });
  
    const sortedDates = Object.keys(maxCapacityPerDay).sort((a, b) => new Date(a) - new Date(b));
    const maxCapacities = sortedDates.map(date => maxCapacityPerDay[date]);
    const eventCounts = sortedDates.map(date => eventCountPerDay[date]);
  
    return { dates: sortedDates, maxCapacities, eventCounts };
  };


  // drill down graph
  const parseDataForEventsOnDate = (data, selectedDate) => {
    const convertDateFormat = (dateStr) => {
      const [day, monthStr, year] = dateStr.split(' ');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = (monthNames.indexOf(monthStr) + 1).toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    const formattedSelectedDate = convertDateFormat(selectedDate);
    const eventsOnDate = data.filter(event => {
      const date = event.DATE_BEGIN.split(' ')[0];
      return date === formattedSelectedDate;
    });
  
    const eventCapacities = eventsOnDate.map(event => {
      const startTime = event.DATE_BEGIN.split(' ')[1].slice(0, 5);
      const endTime = event.DATE_END.split(' ')[1].slice(0, 5);
      const duration = (new Date(`1970-01-01T${event.DATE_END.split(' ')[1]}`) - new Date(`1970-01-01T${event.DATE_BEGIN.split(' ')[1]}`)) / 60000;
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      const formattedDuration = `${hours}h ${minutes}m`;
      return {
        time: startTime,
        endTime: endTime,
        duration: formattedDuration, // Format the duration
        value: parseInt(event.VALUE2, 10),
        id: event.SCO_ID // Add event ID
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
  
    return eventCapacities;
  };

  
  // to display dates on the graph
  const formatDateForDisplay = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };
  

  const onChartReady = (chart) => {
    if (!chart) return;
  
    chart.on('click', (event) => {
      if (event.data && option) { 
        const selectedDate = option.xAxis.data[event.dataIndex];
        const eventCapacities = parseDataForEventsOnDate(graphData, selectedDate);
        
        const drilldownOption = {
          xAxis: { 
            type: 'category',
            data: eventCapacities.map(event => `${event.time}-${event.endTime}`), // Displaying formatted times on x-axis
            name: 'Time',
          },
          yAxis: {
            type: 'value',
            name: 'Capacity',
            min: 0,
            max: 1500,
            interval: 500,
            axisLabel: {
              formatter: '{value}'
            }
          },
          series: [
            {
              data: eventCapacities.map(event => ({
                value: event.value,
                id: event.id, // Include event ID
                time: event.time,
                endTime: event.endTime,
                duration: event.duration // Include duration
              })),
              type: 'bar',
              itemStyle: {
                color: '#A8E6CE'
              }
            },
          ],
          tooltip: {
            trigger: 'axis',
            formatter: function (params) {
              const event = params[0].data;
              // Start Time: ${event.time}<br>
              // End Time: ${event.endTime}<br></br>
              return `
                Duration: ${event.duration}<br>
                Event ID: ${event.id}<br>
                Capacity: ${event.value}
              `;
            }
          }
        };
  
        setSelectedDate(selectedDate);
        setDrilldownData(drilldownOption);
      }
      else {
        setSelectedDate(null); // Reset selectedDate when navigating back
        setDrilldownData(null); // Reset drilldownData when navigating back
      }
    });
    window.addEventListener('resize', chart.resize);
  
    // Clean up event listeners and references
    return () => {
      chart.off('click');
      window.removeEventListener('resize', chart.resize);
    };
  };
  


  // for the weekly option
  const DateRanges = (startDate, endDate) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formatSingleDate = (date) => {
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const formattedStartDate = formatSingleDate(new Date(startDate));
    const formattedEndDate = formatSingleDate(new Date(endDate));

    return `${formattedStartDate} - ${formattedEndDate}`;
  };

  
  // TABLE DATA 
  const groupDataByDay = () => {
    const arr = {};
    data.forEach(item => {
      
      const datee = item.DATE_BEGIN;
      const dateParts = datee.split(' ');
      const only_date = dateParts[0]+ ' '+ dateParts[1]+' '+ dateParts[2];
      if(!arr[only_date]){
        arr[only_date] = [];
      }
      arr[only_date].push(item);
    });
    return arr;
  };
  

  // Render function to display grouped data by day
  const renderGroupedData = () => {
    const groupedData = groupDataByDay();
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b)); // Sort dates chronologically

    return sortedDates.map(date => (
      <React.Fragment key={date}>
        <tr className="date-row">
          <th colSpan="8">{formatFullDate(date)}</th>
        </tr>
        <tr className="column-headers">
          <th>Event Name</th>
          <th>Event ID</th>
          <th>Start Time</th>
          <th>Event Duration</th>
          <th>Capacity</th>
          <th>Domain Name</th>
          {/* <th>Account Creation Date</th> */}
          <th>Account ID</th>
          <th>Account Name</th>
        </tr>
        {groupedData[date].map((item, index) => (
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
      </React.Fragment>
    ));
  };

  // Function to format date 
  const formatFullDate = (dateString) => {
    const dateObj = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  };

  return (
    <div>
      
      <div className='dates'>
        <button onClick={handlePrevWeek}>Last Week</button>
        <span>{DateRanges(startDate, endDate)}</span>
        <button onClick={handleNextWeek}>Next Week</button>
      </div>
      {loading && <p style={{color:"black", marginLeft: '23px', marginTop: '10px'}}>Loading....</p>}
  
      <div className='weekly-graphs'>
      <h5 style={{ marginTop: '30px', marginLeft:'20px'}}>Maximum Event Capacity of Each Day of the Week</h5>
      {option && (
        <ReactECharts ref={echartRef} option={option} onChartReady={onChartReady} style={{ height: 400 }} />
      )}
      {drilldownData && (
        <>
          <h5 style={{ marginLeft:'20px'}}>Event scheduled for {selectedDate}</h5>
          <ReactECharts option={drilldownData} 
          // style={{ height: 400 }} 
          />
        </>
      )}
      </div>

      <div className="container">
      {loading && <p style={{ color: "black" }}>Fetching Data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data.length > 0 && (
        <>
          <table className='table table-hover'>
            <tbody>
              {renderGroupedData()}
            </tbody>
          </table>          
        </>
      )}
    </div>

    </div>
  );
};

export default Myfunc;










