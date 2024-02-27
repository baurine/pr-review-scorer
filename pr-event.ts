// @see https://docs.aircode.io/guide/functions/
import aircode from 'aircode';
import { makeLarkSender } from './lark';
import { getTypeAndScore, pullRequest, pullRequestReview } from './message';
import { listScores, saveReview } from './score';

const larkBotUrl = process.env.LarkBot
const larkBotSender = makeLarkSender(larkBotUrl!)

const enable = process.env.Enable === 'true'

export default async function (params: any, context: any) {
  console.log('Received params:', params);
  const eventName = context.headers['x-github-event']
  console.log('Github Event Name:', eventName)

  if (!enable) {
    return {
      message: 'the feature is not enabled',
    };
  }

  let msg
  if (eventName === 'pull_request') {
    msg = pullRequest(params)
    
    const { action, pull_request } = params
    if ((action === 'opened' || action==='reopened') && pull_request.draft === false) {
      const scores = await listScores()
      msg += `\n---\ncurrent scores: ${scores}`
    }
    
    larkBotSender(msg)
  } else if (eventName === 'pull_request_review') {
    msg = pullRequestReview(params)

    if (!!msg) {
      const scoreMsg = await saveReview(params)
      if (scoreMsg !== '') {
        const {pull_request} = params
        msg += `\n${getTypeAndScore(pull_request)}, **${scoreMsg}**`

        const scores = await listScores()
        msg += `\n---\n**CURRENT SCORES**: ${scores}` 
      }
    }
    
    larkBotSender(msg)
  }
  
  return {
    message: msg,
  };
};
