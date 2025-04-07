import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";

interface GridProps {
  onSelect: (index: number) => void;
}

const Grid = ({ onSelect }: GridProps) => {
  const size = 5; // 5x5 grid
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
  const [scannedIPs, setScannedIPs] = useState<string[]>([]);

  const esp32Host = "http://172.20.10.13";

  const handleSubmit = async () => {
    if (selected !== null) {
      setHeights({ ...heights, [selected]: input });
      try {
        const response = await fetch(
          `${esp32Host}/setHeight?module=${selected}&height=${input}`,
          { method: "GET" }
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
    try {
      const response = await fetch(`${esp32Host}/getIPs`, { method: "GET" });
      const data = await response.json();
      console.log("ESP32 IP:", data);
      return data;
    } catch (error) {
      console.error("Error fetching IPs from ESP32:", error);
    }
  };

  const scanNetwork = async () => {
    const baseIp = "172.20.10."; // Adjust based on your network
    const activeIPs: string[] = [];
    const requests = [];
  
    // Helper function to add a timeout to a fetch request
    const fetchWithTimeout = (url: string, timeout = 2000) =>
      Promise.race([
        // Append a timestamp to bypass caching and disable cache with cache: "no-store"
        fetch(`${url}?t=${Date.now()}`, { 
          method: "HEAD", 
          mode: "no-cors",
          cache: "no-store" 
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeout)
        ),
      ]);
  
    for (let i = 1; i < 50; i++) {
      const ip = `${baseIp}${i}`;
      const request = fetchWithTimeout(`http://${ip}`)
        .then((res) => {
          // When using no-cors, responses are opaque.
          // If we get a response (opaque or ok), we assume the IP is active.
          if (res instanceof Response && (res.type === "opaque" || res.ok)) {
            activeIPs.push(ip);
          }
        })
        .catch(() => {
          // Ignore errors; many IPs may not respond
        });
      requests.push(request);
    }
    await Promise.all(requests);
    console.log("Active IPs:", activeIPs);
    setScannedIPs(activeIPs);
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
          onClick={() => scanNetwork()}
        >
          Scan Network
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
      {scannedIPs.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Scanned IPs:</h2>
          <ul>
            {scannedIPs.map((ip) => (
              <li key={ip}>{ip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
