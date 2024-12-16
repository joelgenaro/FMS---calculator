import { FMSJournalType } from './journal-types.model';

export interface FMSJournalTypesMap {
  [sensorId: number]: FMSJournalType[];
}
