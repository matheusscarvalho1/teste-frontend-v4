import "leaflet/dist/leaflet.css";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  IEquipment,
  IEquipmentModel,
  IEquipmentPositionHistory,
  IEquipmentState,
  IEquipmentStateHistory,
} from "./interface/Imap";

const AdjustMapPosition = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [positions, map]);

  return null;
};

const Map = () => {
  const [mapPosition, setMapPosition] = useState<IEquipmentPositionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateHistory, setStateHistory] = useState<IEquipmentStateHistory[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<IEquipmentState[]>([]);
  const [equipmentList, setEquipmentList] = useState<IEquipment[]>([]);
  const [equipmentModels, setEquipmentModel] = useState<IEquipmentModel[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");

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
          axios.get<IEquipmentPositionHistory[]>("/data/equipmentPositionHistory.json"),
          axios.get<IEquipmentStateHistory[]>("/data/equipmentStateHistory.json"),
          axios.get<IEquipmentState[]>("/data/equipmentState.json"),
          axios.get<IEquipment[]>("/data/equipment.json"),
          axios.get<IEquipmentModel[]>("data/equipmentModel.json"),
        ]);

        setMapPosition(positionsRes.data);
        setStateHistory(statesHistoryRes.data);
        setEquipmentStatus(statesRes.data);
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

  const latestPositionsWithStatus = mapPosition.map((equipment) => {

    const positionsSortedByDate = [...equipment.positions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestPosition = positionsSortedByDate[0];

    const equipmentStateHistory = stateHistory.find(
      (item) => item.equipmentId === equipment.equipmentId
    )?.states || [];

    const latestValidState  = equipmentStateHistory
      .filter((item) => new Date(item.date) <= new Date(latestPosition.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const statusInfo = equipmentStatus.find(
      (item) => item.id === latestValidState ?.equipmentStateId
    );

    const equipmentInfo = equipmentList.find(
      (item) => item.id === equipment.equipmentId
    );

    const modelInfo = equipmentModels.find(
      (item) => item.id === equipmentInfo?.equipmentModelId
    );

    return {
      equipmentId: equipment.equipmentId,
      lat: latestPosition.lat,
      lon: latestPosition.lon,
      date: latestPosition.date,
      stateName: statusInfo?.name ?? "Desconhecido",
      stateColor: statusInfo?.color ?? "#ccc",
      equipmentName: equipmentInfo?.name ?? "Sem nome",
      modelName: modelInfo?.name ?? "Sem modelo",
    };
  });


  const filteredEquipments = latestPositionsWithStatus.filter((item) => {
    const matchesStatus = filterStatus === "todos" || item.stateName === filterStatus;
    const matchesName = item.equipmentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesName;
  });

  const coordinates: [number, number][] = filteredEquipments.map((position) => [
    position.lat,
    position.lon,
  ]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold">Equipamentos localizados</h1>

      <div className="mt-3 flex h-2/3 w-3/4 gap-6">
        <div className="flex flex-col gap-2 w-[150px]">
            <h1 className="text-2xl">Filtros</h1>
            <Label>Nome do equipamento</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite..."
            />
          <Label>Status</Label>
          <Select onValueChange={(value) => setFilterStatus(value)} defaultValue="todos">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="todos">Todos os status</SelectItem>
              {equipmentStatus.map((state) => (
                <SelectItem key={state.id} value={state.name} className="hover:bg-gray-100">
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <MapContainer
            className="h-full w-full"
            center={[-19.15, -46.05]}
            zoom={10}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AdjustMapPosition positions={coordinates} />

            {filteredEquipments.map((item) => (
              <Marker key={item.equipmentId} position={[item.lat, item.lon]}>
                <Popup minWidth={250}>
                  <div className="max-h-60 overflow-y-auto text-sm">
                    <h3 className="mb-2 pb-1 text-sm font-semibold">Histórico de status</h3>

                    {mapPosition
                      .find((posData) => posData.equipmentId === item.equipmentId)
                      ?.positions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((pos, index) => {
                        const equipmentStateHistory = stateHistory.find(
                          (s) => s.equipmentId === item.equipmentId
                        )?.states || [];

                        const latestValidState = equipmentStateHistory
                          .filter((s) => new Date(s.date) <= new Date(pos.date))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                        const stateDetails = equipmentStatus.find(
                          (s) => s.id === latestValidState?.equipmentStateId
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
                              {stateDetails?.name === "Parado" ? (
                                <span className="text-red-500">⛔</span>
                              ) : stateDetails?.name === "Manutenção" ? (
                                <span className="text-yellow-500">🛠️</span>
                              ) : stateDetails?.name === "Operando" ? (
                                <span className="text-green-500">✅</span>
                              ) : (
                                <span className="text-gray-500">❓</span>
                              )}

                              <span
                                style={{
                                  color: stateDetails?.color ?? "#000",
                                  fontWeight: "bold",
                                }}
                              >
                                {stateDetails?.name ?? "Desconhecido"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                  <strong>Equipamento: </strong>{item.equipmentName}
                  <br />
                  <div>
                    <strong>Modelo:</strong> {item.modelName}<br />
                    <strong>Estado:</strong>&nbsp;
                    <span style={{ color: item.stateColor, fontWeight: "bold" }}>
                      {item.stateName}
                    </span>
                    <br />
                    <strong>Ultima atualização:</strong> {new Date(item.date).toLocaleString()}<br />
                    <strong>Latitude:</strong> {item.lat}<br />
                    <strong>Longitude:</strong> {item.lon}<br />
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Map;