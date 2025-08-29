export type ParkingResponse = {
  readonly id: string;
  readonly address: string;
  readonly name: string;
  readonly spotsCount: number;
  readonly ownerId: string;
  readonly code: string;
  readonly isFull: boolean;
  readonly maxSpots: number;
  readonly isNeighbourhood: boolean;
};
