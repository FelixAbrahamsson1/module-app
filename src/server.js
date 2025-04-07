import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';

const app = express();
const PORT = 5050;
const ESP_PORT = 80;
// Endpoint on ESP32s
const PATH = '/getID';


app.use(cors()); // Allow React (different port) to access this API

const fetchWithTimeout = async (url, timeout = 2000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
  
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw new Error('Request timed out or failed');
    }
  };
  
const queryDevices = async (ips) => {
    const results = await Promise.allSettled(
        ips.map(async (ip) => {
        const url = `http://${ip}:${ESP_PORT}${PATH}`;
        try {
          const res = await fetchWithTimeout(url);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const data = await res.json();
          console.log(ip, data[0]);
          return { ip, id: data[0] };
        } catch (err) {
          return { ip, error: err.message || 'No response' };
        }
      })
    );
  
    // Filter successful results
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(r => Object.hasOwn(r, 'id'));
  };

app.get('/scan', async (req, res) => {
  const subnet = '172.20.10.';
  const start = 1;
  const end = 14;

  const ips = Array.from({ length: end - start + 1 }, (_, i) => `${subnet}${i + start}`);
  const results = await queryDevices(ips); // no arp — just test HTTP directly
  res.json(results);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
