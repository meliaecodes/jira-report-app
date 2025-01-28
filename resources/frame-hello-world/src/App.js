import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { invoke, events } from "@forge/bridge";

function App() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState(null);

  const chartData = [
    {name: 'under 2 days', uv: 2, pv: 1, amt: 3 },
    {name: '2-4 days', uv: 9, pv: 1, amt: 10},
    {name: 'over 4 days', uv: 8, pv: 8, amt: 16},
  ];


  useEffect(() => {
    // resolver function declared in the containing UIKit app is
    // accessible within the Frame component
    invoke("getText", { example: "from Frame component" }).then(setData);
  }, [setData]);

  useEffect(() => {
    // listening to messages from the UIKit app
    // (https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/events/#on)
    const sub = events.on("message", (message) => {
      if (message && message.msg) {
        setMessage(message.msg);
      }
    });

    return () => {
      // clean up the subscription when the component is unmounted
      // (https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/events/#unsubscribe)
      sub.then((subscription) => subscription.unsubscribe());
    };
  }, [setMessage]);

  return (
    <div
      style={{
        padding: "1em",
        border: "1px solid #ccc",
        borderRadius: "4px",
        margin: "1em 0",
      }}
    >
      <p>[Frame] Recharts.org example</p>
      <p>{data ? data : "Loading..."}</p>
      <BarChart
          width={500}
          height={300}
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" stackId="a" fill="#8884d8" />
          <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
        </BarChart>


        {message && <p>Received message: {message}</p>}
    </div>
  );
}

export default App;
