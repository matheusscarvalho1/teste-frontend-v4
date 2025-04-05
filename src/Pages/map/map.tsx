// Importa o CSS do Leaflet para que os elementos do mapa sejam estilizados corretamente
import "leaflet/dist/leaflet.css";

// Importa Axios para fazer requisições HTTP e os hooks do React
import axios from "axios";
import { useEffect, useState } from "react";
// Importa os componentes principais do React Leaflet
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import { Progress } from "../../components/ui/progress";
import {
  IEquipment,
  IEquipmentModel,
  IEquipmentPositionHistory,
  IEquipmentState,
  //IEquipmentStateEntry,
  IEquipmentStateHistory,
  //IHourlyEarning,
} from "./interface/Imap";

// Componente auxiliar que ajusta automaticamente os limites do mapa com base nas posições recebidas
const MapBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap(); // Hook do Leaflet para acessar o mapa atual

  useEffect(() => {
    if (positions.length > 0) {
      // Ajusta os limites do mapa para mostrar todas as posições
      map.fitBounds(positions);
    }
  }, [positions, map]);

  return null;
};

const Map = () => {
  const [mapPosition, setMapPosition] = useState<IEquipmentPositionHistory[]>(
    [],
  );
  const [stateHistory, setStateHistory] = useState<IEquipmentStateHistory[]>(
    [],
  );
  const [equipmentStates, setEquipmentStates] = useState<IEquipmentState[]>([]);
  const [equipmentList, setEquipmentList] = useState<IEquipment[]>([]);
  const [equipmentModels, setEquipmentModel] = useState<IEquipmentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para carregar os dados quando o componente for montado
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          positionsRes,
          statesHistoryRes,
          statesRes,
          equipmentRes,
          equipmentModelRes,
        ] = await Promise.all([
          axios.get<IEquipmentPositionHistory[]>(
            "/data/equipmentPositionHistory.json",
          ),
          axios.get<IEquipmentStateHistory[]>(
            "/data/equipmentStateHistory.json",
          ),
          axios.get<IEquipmentState[]>("/data/equipmentState.json"),
          axios.get<IEquipment[]>("/data/equipment.json"),
          axios.get<IEquipmentModel[]>("data/equipmentModel.json"),
        ]);

        setMapPosition(positionsRes.data);
        setStateHistory(statesHistoryRes.data);
        setEquipmentStates(statesRes.data);
        setEquipmentModel(equipmentModelRes.data);
        setEquipmentList(equipmentRes.data);
      } catch (err) {
        setError("Erro ao carregar dados dos equipamentos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Progress value={33} />;
  if (error) return <p>{error}</p>;

  // Para cada equipamento, pega a posição mais recente
  const latestPositionsWithState = mapPosition.map((equipment) => {
    const sortedPositions = [...equipment.positions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const latestPos = sortedPositions[0];
  
    const stateHistories = stateHistory.find(
      (s) => s.equipmentId === equipment.equipmentId,
    )?.states || [];
  
    const matchingState = stateHistories
      .filter((s) => new Date(s.date) <= new Date(latestPos.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
    const stateDetails = equipmentStates.find(
      (s) => s.id === matchingState?.equipmentStateId,
    );
  
    const equipmentInfo = equipmentList.find(
      (e) => e.id === equipment.equipmentId,
    );
  
    const modelInfo = equipmentModels.find(
      (m) => m.id === equipmentInfo?.equipmentModelId,
    );
  
    return {
      equipmentId: equipment.equipmentId,
      lat: latestPos.lat,
      lon: latestPos.lon,
      date: latestPos.date,
      stateName: stateDetails?.name ?? "Desconhecido",
      stateColor: stateDetails?.color ?? "#ccc",
      equipmentName: equipmentInfo?.name ?? "Sem nome",
      modelName: modelInfo?.name ?? "Sem modelo",
    };
  });

  // Extrai somente os pares [lat, lon] para serem usados nos limites do mapa
  const bounds: [number, number][] = latestPositionsWithState.map((position) => [
    position.lat,
    position.lon,
  ]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold">Mapa de Equipamentos</h1>
      <div className="mt-3 h-2/3 w-3/4">
        <MapContainer
          className="h-full"
          center={[-19.15, -46.05]}
          zoom={10}
          scrollWheelZoom={false}
        >
          {/* Camada de tiles (mapa base do OpenStreetMap) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ajusta os limites do mapa para incluir todos os marcadores */}
          <MapBounds positions={bounds} />

          {/* Renderiza um marcador para cada posição mais recente */}
          {latestPositionsWithState.map((item) => (
            <Marker key={item.equipmentId} position={[item.lat, item.lon]}>
              <Popup minWidth={250}>
                <div className="max-h-60 overflow-y-auto text-sm">
                  <h3 className="mb-2 pb-1 text-sm font-semibold">
                    Histórico de status
                  </h3>

                  {mapPosition
  .find((posData) => posData.equipmentId === item.equipmentId) // Corrigido
  ?.positions
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5)
  .map((pos, index) => {
    const stateHistories = stateHistory.find(
      (s) => s.equipmentId === item.equipmentId,
    )?.states || [];

    // Aqui, para cada posição, buscamos o último estado ANTES ou IGUAL à data da posição
    const matchingState = stateHistories
      .filter((s) => new Date(s.date) <= new Date(pos.date))
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0];

    const state = equipmentStates.find(
      (s) => s.id === matchingState?.equipmentStateId,
    );

    return (
      <div key={index} className="mb-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📅</span>
          {new Date(pos.date).toLocaleString()}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">📍</span>
          <div className="flex flex-col">
            <strong className="font-semibold">Lat: <span className="font-normal">{pos.lat}</span></strong>
            <strong className="font-semibold">Long: <span className="font-normal">{pos.lon}</span></strong>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {state?.name === "Parado" ? (
            <span className="text-red-500">⛔</span>
          ) : state?.name === "Manutenção" ? (
            <span className="text-yellow-500">🛠️</span>
          ) : state?.name === "Operando" ? (
            <span className="text-green-500">✅</span>
          ) : (
            <span className="text-gray-500">❓</span>
          )}

          <span
            style={{
              color: state?.color ?? "#000",
              fontWeight: "bold",
            }}
          >
            {state?.name ?? "Desconhecido"}
          </span>
        </div>
      </div>
    );
  })}
                </div>
              </Popup>
              <Tooltip
                direction="top"
                offset={[0, -20]}
                opacity={1}
                permanent={false}
              >
                <strong>Equipamento: </strong>
                {item.equipmentName}
                <br />
                <div>
                  <strong>Modelo:</strong> {item.modelName}
                  <br />
                  <strong>Estado:</strong>&nbsp;
                  <span
                    style={{
                      color: item.stateColor,
                      fontWeight: "bold",
                    }}
                  >
                    {item.stateName}
                  </span>
                  <br />
                  <strong>Ultima atualização:</strong>&nbsp;
                  {new Date(item.date).toLocaleString()}
                  <br />
                  <strong>Latitude:</strong> {item.lat}
                  <br />
                  <strong>Longitude:</strong> {item.lon}
                  <br />
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
