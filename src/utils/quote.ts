import { MeasurementUnit, TransportQuote } from '../types';

export const CLP_PER_SQUARE_METER = 20_000;

export type TransportUnit = MeasurementUnit;

export function computeTransportQuote(
  length: string,
  width: string,
  lengthUnit: TransportUnit,
  widthUnit: TransportUnit,
): TransportQuote | null {
  const l = Number(length.replace(',', '.'));
  const w = Number(width.replace(',', '.'));
  if (!l || !w || l <= 0 || w <= 0) return null;

  const lengthInMeters = lengthUnit === 'cm' ? l / 100 : l;
  const widthInMeters = widthUnit === 'cm' ? w / 100 : w;
  const squareMeters = lengthInMeters * widthInMeters;
  const total = squareMeters * CLP_PER_SQUARE_METER;
  return { squareMeters, total };
}