import { useState, useEffect, useRef } from "react";
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

type Island = {
  ip: string;
  ids: number[];
};

type Modules = {
  addr : number;
  x: number;
  y: number;
  rotation: number;
  is_placed: boolean;
}


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

const delay = (ms: number) => {
  return new Promise(res => setTimeout(res, ms));
};


export default function App() {
  const [selected, setSelected] = useState<number>(0);
  const [heights, setHeights] = useState<{ [key: number]: string }>({});
  const [input, setInput] = useState("");
  const [devices, setDevices] = useState<{ [key: number]: string }>({});
  // Map of module number to the module that is its master
  const [islandMap, setIslandMap] = useState<{ [key: number]: number }>({});
  const [islands, setIslands] = useState<Island[]>([]);


  const defaultIP = "172.20.10.14";

  const hasRunOnce = useRef(false);

  // Continuously refresh IPs
  useEffect(() => {
    // Call it once immediately
    if (!hasRunOnce.current) {
      handleGetIPs();
      hasRunOnce.current = true;
    }
    
    // Set up interval
    // const interval = setInterval(() => {
    //   handleGetIPs();
    // }, 10000); // 10,000 ms = 10s
  
    // Clean up on unmount
    // return () => clearInterval(interval);
  }, []);
  

  const handleSubmit = async () => {
    if (selected !== null) {
      setHeights({ ...heights, [selected]: input });
      try {
        // Find earliest IP available
        let ip: string = "";
        for (let i = 0; i < size * size; i++) {
          if (islandMap[i] == undefined)
            continue;
          if (islands[islandMap[i]].ip != "" && islands[islandMap[i]].ip != undefined) {
            ip = islands[islandMap[i]].ip;
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

  const getGrid = async (index: number, deviceMap: { [key: number]: string } | null = null) => {
    try {
      if (deviceMap == null)
        deviceMap = devices;
      if (deviceMap[index] != undefined) {
        let response = await fetch(
          `http://${deviceMap[index]}/getGrid`,
          {
            method: "GET",
          }
        );
        console.log(`Got ${index} Grid!`);
        let info: Modules[] = await response.json();

        return info;
      }
    } catch (err) {
      console.error("Error:", err);
      return [];
    }
  }

  const becomeMaster = async (index: number) => {
    try {
      if (devices[index] != undefined) {          
        let response = await fetch(
          `http://${devices[index]}/becomeMaster`,
          {
            method: "GET",
          }
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const becomeSlave = async (index: number) => {
    try {
      if (devices[index] != undefined) {          
        let response = await fetch(
          `http://${devices[index]}/becomeSlave`,
          {
            method: "GET",
          }
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const beginGrid = async (index: number) => {
    try {
      if (devices[index] != undefined) {          
        let response = await fetch(
          `http://${devices[index]}/beginGrid`,
          {
            method: "GET",
          }
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }


  const handleGetIPs = async () => {
    try {
      const res = await fetch("http://localhost:5050/scan");
      const data: Device[] = await res.json();
      console.log(data);

      const newDevices: { [key: number]: string } = {};
      data.forEach((device) => {
        if (device.id < size * size) {
          newDevices[device.id] = device.ip;
        }
      });

      setDevices(newDevices); // 🔥 One clean update

      const newScanned: number[] = [];
      const newIslands: Island[] = [];
      const newIslandMap: { [key: number]: number } = {};

      // for (let i = 4; i < size * size; i++) {
      //   if (newDevices[i] != undefined) {
      //     let response = await fetch(
      //       `http://${newDevices[i]}/becomeSlave`,
      //       {
      //         method: "GET",
      //       }
      //     );
      //     console.log(`Made ${i} Slave!`);
      //   }

      // }

      // await delay(1000);

      for (let i = 0; i < size * size; i++) {
        if (newDevices[i] != undefined && !newScanned.includes(i)) {
          let response = await fetch(
            `http://${newDevices[i]}/becomeMaster`,
            {
              method: "GET",
            }
          );
          console.log(`Made ${i} Master!`);
          newScanned.push(i);

          await beginGrid(i);
          console.log(`Began ${i} Grid!`);

          await delay(2000);

          let modules = await getGrid(i, newDevices);
          console.log(`Grid output: `);
          console.log(modules);

          let ids: number[] = [];

          modules?.forEach((module) => {
            ids.push(module.addr);
            newScanned.push(module.addr);
            // Record that this module maps to this island
            newIslandMap[module.addr] = newIslands.length;
          });

          newIslands.push({ip: newDevices[i], ids: ids});
          console.log("ISLANDS Found:");
          console.log(newIslands);

          setIslands(newIslands);
          setIslandMap(newIslandMap);
          break;
        }

      }


    } catch (err) {
      console.error("Error:", err);
    }
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
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => handleGetIPs()}
        >
          Scan Network
        </button>
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => getGrid(selected)}
        >
          Get Grid
        </button>
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => beginGrid(selected)}
        >
          Begin Grid
        </button> 
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => becomeMaster(selected)}
        >
          Become Master
        </button>
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => becomeSlave(selected)}
        >
          Become Slave
        </button>
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
            {Object.entries(devices).map(([id, ip]) => (
              <li key={id}>
                Module {id}: {ip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
