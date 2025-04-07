import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";

interface GridProps {
  onSelect: (index: number) => void;
}

const size = 5; // 5x5 grid
type Device = {
  ip: string;
  id: number;
};


const Grid = ({ onSelect }: GridProps) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {[...Array(size * size)].map((_, i) => (
        <div
          key={i}
          className="w-16 h-16 border flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => onSelect(i)}
        >
          {i}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [selected, setSelected] = useState<number | null>(null);
  const [heights, setHeights] = useState<{ [key: number]: string }>({});
  const [input, setInput] = useState("");
  const [devices, setDevices] = useState<{ [key: number]: string }>({});


  const defaultIP = "http://172.20.10.14";

  const handleSubmit = async () => {
    if (selected !== null) {
      setHeights({ ...heights, [selected]: input });
      try {
        // Find earliest IP available
        let ip : string = "";
        for (let i = 0; i < size * size; i++) {
          if (devices[i] != "" && devices[i] != undefined) {
            ip = devices[i];
          }
          if (i >= selected && ip != "")
            break;
        }

        if (ip == "") {
          ip = defaultIP;
        }
        let url = `http://${ip}/setHeight?module=${selected}&height=${input}`;
        console.log(url);
        // Send an HTTPS GET request to the ESP32 with module and height parameters
        const response = await fetch(
          url,
          {
            method: "GET",
          }
        );
        const data = await response.text();
        console.log("ESP32 response:", data);
      } catch (error) {
        console.error("Error sending request to ESP32:", error);
      }
    }
    setInput("");
  };

  const handleGetIPs = async () => {
  useEffect(() => {
    fetch('http://localhost:5050/scan')
      .then(res => res.json())
      .then((data: Device[]) => {
        console.log(data);
        data.forEach(device => {
          if (device.id < size * size)
          setDevices(prev => ({ ...prev, [device.id]: device.ip }));
        });
      })
      .catch(err => console.error('Error:', err));
  }, []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AMF</h1>
      <div className="flex mb-4">
        <button 
          className="bg-blue-500 text-black px-4 py-2 mr-2" 
          onClick={() => handleGetIPs()}
        >
          Get IPs
        </button>
<!--         <button 
          className="bg-green-500 text-black px-4 py-2" 
          onClick={() => scanNetwork()}
        >
          Scan Network
        </button> -->
      </div>
      <Tabs defaultValue="tab1" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div className="flex">
            <Grid onSelect={setSelected} />
            {selected !== null && (
              <Card className="p-4 ml-4">
                <p>Selected: {selected}</p>
                <p>Current Height: {heights[selected] || 0} inches</p>
                <input
                  type="number"
                  className="border p-1 mt-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  className="bg-blue-500 text-black px-3 py-1 mt-2" 
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="tab2">
          <Grid onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="tab3">
          <Grid onSelect={setSelected} />
        </TabsContent>
      </Tabs>
      {Object.keys(devices).length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Scanned IPs:</h2>
          <ul>
            {Object.entries(devices).map((ip) => (
              <li key={ip}>{ip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
