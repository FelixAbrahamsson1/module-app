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

  const esp32Host = "http://172.20.10.3";

  const handleSubmit = async () => {
    if (selected !== null) {
      setHeights({ ...heights, [selected]: input });
      try {
        // Send an HTTPS GET request to the ESP32 with module and height parameters
        const response = await fetch(
          `${esp32Host}/setHeight?module=${selected}&height=${input}`,
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AMF</h1>
      <Tabs defaultValue="tab1" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div className="flex">
            <Grid onSelect={setSelected}/>
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
                <button className="bg-blue-500 text-black px-3 py-1 mt-2" onClick={handleSubmit}>
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
    </div>
  );
}
