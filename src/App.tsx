import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";
import GridDisplay from "../components/ui/GridDisplay";

const test = 0;

const testModules = [
  { addr: 1, x: -1, y: 0, rotation: 0, is_placed: true },
  { addr: 2, x: 2, y: -1, rotation: 0, is_placed: true },
  { addr: 3, x: 1, y: 3, rotation: 0, is_placed: true },
];

interface GridProps {
  onSelect: (index: number) => void;
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



const size = 5; // 5x5 grid
type Device = {
  ip: string;
  id: number;
};

type Island = {
  ip: string;
  modules: Modules[];
};

export type Modules = {
  addr: number;
  x: number;
  y: number;
  rotation: number;
  is_placed: boolean;
}

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

  const [allHeight, setAllHeight] = useState<number>(0);


  const defaultIP = "172.20.10.14";

  const hasRunOnce = useRef(false);

  // Continuously refresh IPs
  useEffect(() => {
    // Call it once immediately
    if (!hasRunOnce.current) {
      handleGetIPs();
      hasRunOnce.current = true;
    }
  }, []);

  const setBottom = async () => {
    for (let i = islands[0].modules.length - 1; i >= 0; i--) {
      console.log(`Changing ${i + 1} / ${islands[0].modules.length}`);
      let hite = "0";
      handleSubmit(i + 1, hite);

      setAllHeight(parseInt(hite));
    }
  }

  const setTop = async () => {
    for (let i = islands[0].modules.length - 1; i >= 0; i--) {
      console.log(`Changing ${i + 1} / ${islands[0].modules.length}`);
      let hite = "3";
      handleSubmit(i + 1, hite);

      setAllHeight(parseInt(hite));
    }
  }



  const makeWaves = async () => {
    for (let i = islands[0].modules.length - 1; i >= 0; i--) {
      console.log(`Changing ${i + 1} / ${islands[0].modules.length}`);
      let hite = allHeight == 3 ? "0" : "3";
      handleSubmit(i + 1, hite);

      setAllHeight(parseInt(hite));
    }
  }

  const handleSubmit = async (module: number | null = null, num: string | null = null) => {
    if (selected !== null) {
      if (num == null) {
        num = input;
      }
      if (module == null) {
        module = selected;
      }

      setHeights({ ...heights, [module]: num });
      try {
        // Find earliest IP available
        let ip: string = "";
        for (let i = 0; i < size * size; i++) {
          if (islandMap[i] == undefined)
            continue;
          if (islands[islandMap[i]].ip != "" && islands[islandMap[i]].ip != undefined) {
            ip = islands[islandMap[i]].ip;
          }
          if (i >= module && ip != "")
            break;
        }

        if (ip == "") {
          ip = defaultIP;
        }
        let url = `http://${ip}/setHeight?module=${module}&height=${num}`;
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

  const becomeMaster = async (index: number, deviceMap: { [key: number]: string } | null = null) => {
    try {
      if (deviceMap == null)
        deviceMap = devices;
      if (deviceMap[index] != undefined) {
        let response = await fetch(
          `http://${deviceMap[index]}/becomeMaster`,
          {
            method: "GET",
          }
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const becomeSlave = async (index: number, deviceMap: { [key: number]: string } | null = null) => {
    try {
      if (deviceMap == null)
        deviceMap = devices;
      if (deviceMap[index] != undefined) {
        let response = await fetch(
          `http://${deviceMap[index]}/becomeSlave`,
          {
            method: "GET",
          }
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const beginGrid = async (index: number, deviceMap: { [key: number]: string } | null = null) => {
    console.log(`begin grid ${index}`);
    try {
      if (deviceMap == null)
        deviceMap = devices;
      if (deviceMap[index] != undefined) {
        let response = await fetch(
          `http://${deviceMap[index]}/beginGrid`,
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
      for (let i = 1; i < size * size; i++) {
        if (i != 1) {
          await becomeSlave(i, newDevices);
        }
      }

      await becomeMaster(1, newDevices);



      for (let i = 0; i < size * size; i++) {
        if (newDevices[i] != undefined && !newScanned.includes(i)) {
          console.log(`Talking to ${i} on ip ${newDevices[i]}`);
          // await fetch(`http://${newDevices[i]}/becomeMaster`);
          // console.log(`Made ${i} Master!`);
          newScanned.push(i);

          // await beginGrid(i);
          await beginGrid(i, newDevices);
          console.log(`Began ${i} Grid!`);

          await delay(5000);

          let presentModules: any[] | undefined = [];

          let j = 0;
          while (presentModules != undefined && presentModules.length == 0 && j < 1) {
            presentModules = await getGrid(i, newDevices);
            console.log(`Grid output: `);
            console.log(presentModules);

            j++;
            await delay(1000);
          }

          let modules: Modules[] = [];

          presentModules?.forEach((module) => {
            modules.push({ ...module });
            newScanned.push(module.addr);
            newIslandMap[module.addr] = newIslands.length;
          });


          newIslands.push({ ip: newDevices[i], modules: modules });
          console.log("ISLANDS Found:");
          console.log(newIslands);

          setIslands(newIslands);
          setIslandMap(newIslandMap);
          break;
        }

      }

      if (test) {
        let modules: Modules[] = [];

        testModules.forEach((module) => {
          modules.push({ ...module });
        });

        newIslands[0] = { ip: "0.0.0.0", modules: modules };
        console.log("ISLANDS Found:");
        console.log(newIslands);

        setIslands(newIslands);
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
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => makeWaves()}
        >
          Fun Button
        </button>
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => setBottom()}
        >
          Bring Down
        </button>
        <button
          className="bg-green-500 text-black px-4 py-2"
          onClick={() => setTop()}
        >
          Bring Up
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
            {islands[0] && (
              <GridDisplay
                modules={islands[0].modules}
                onTileClick={(addr: number) => setSelected(addr)}
              />
            )}
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
                  onClick={() => handleSubmit()}
                >
                  Submit
                </button>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="tab2">
          {islands[0] && (
            <GridDisplay
              modules={islands[0].modules}
              onTileClick={(addr: number) => setSelected(addr)}
            />
          )}
        </TabsContent>
        <TabsContent value="tab3">

          {/* // <GridDisplay
            //   modules={islands[0].modules}
            //   onTileClick={(addr: number) => setSelected(addr)}
            // /> */}
          <div className="flex">            <Grid onSelect={setSelected} />
          </div>

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
