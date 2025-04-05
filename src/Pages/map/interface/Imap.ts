// Representa uma posição geográfica com data, latitude e longitude
export interface IPosition {
  date: string;
  lat: number;
  lon: number;
}

// Representa o histórico de posições de um equipamento
export interface IEquipmentPositionHistory {
  equipmentId: string;
  positions: IPosition[];
}

// Representa um estado do equipamento
export interface IEquipmentState {
  id: string;
  name: string;
  color: string;
}

// Representa o valor por hora que um equipamento gera em um determinado estado
export interface IHourlyEarning {
  equipmentStateId: string;
  value: number;
}

// Representa o modelo do equipamento, que inclui os valores por hora para cada estado
export interface IEquipmentModel {
  id: string;
  name: string;
  hourlyEarnings: IHourlyEarning[];
}

// Representa um equipamento individual
export interface IEquipment {
  id: string;
  equipmentModelId: string;
  name: string;
}

// Representa uma mudança de estado no histórico
export interface IEquipmentStateEntry {
  date: string;
  equipmentStateId: string;
}

// Histórico de estados de um equipamento
export interface IEquipmentStateHistory {
  equipmentId: string;
  states: IEquipmentStateEntry[];
}
