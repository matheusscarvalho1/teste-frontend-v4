import "leaflet/dist/leaflet.css";

import axios from "axios";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export interface EquipmentPositionHistory {
  equipmentId: string;
  positions: Position[];
}
export interface Position {
  date: string;
  lat: number;
  lon: number;
}

const Map = () => {
  const [mapPosition, setMapPosition] = useState<EquipmentPositionHistory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapPosition = async () => {
      try {
        const response = await axios.get<EquipmentPositionHistory[]>(
          "/data/equipmentPositionHistory.json",
        );
        setMapPosition(response.data);
      } catch (err) {
        setError("Erro ao carregar equipamentos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapPosition();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  console.log(mapPosition);
  console.log(mapPosition[0].positions[0].lat, mapPosition[0].positions[0].lon);

  return (
    <div className="flex h-screen w-screen flex-col">
      <h1 className="text-3xl font-semibold">Mapa de Equipamentos</h1>
      <div className="h-2/3 w-3/4">
        <MapContainer
          className="h-full"
          center={[
            mapPosition[0].positions[0].lat,
            mapPosition[0].positions[0].lon,
          ]}
          zoom={10}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[
              mapPosition[0].positions[0].lat,
              mapPosition[0].positions[0].lon,
            ]}
          >
            <Popup>{mapPosition[0].equipmentId}</Popup>
          </Marker>
        </MapContainer>
        A
      </div>
    </div>
  );
};

export default Map;
