// @see https://docs.aircode.io/guide/functions/
import aircode from 'aircode';
import { scoresTable } from './score';

export default async function (params: any, context: any) {
  console.log('Received params:', params);

  // await scoresTable.where({name_in_github: 'Yuiham'}).set({init_score: 43.5}).save()
  // await scoresTable.where({name_in_github: 'bosn'}).set({name_in_github: 'Bosn'}).save()
  
  return {
    message: 'Hi, AirCode.',
  };
};
