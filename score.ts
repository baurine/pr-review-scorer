// @see https://docs.aircode.io/guide/functions/
import aircode from 'aircode';

import {
  PullRequest,
  PullRequestAssignedEvent,
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
  PullRequestReviewEvent,
  PullRequestReviewRequestedEvent,
  PullRequestReviewRequestRemovedEvent,
  PullRequestReviewSubmittedEvent,
  PullRequestUnassignedEvent,
  Repository,
  Team,
  User,
} from '@octokit/webhooks-types';
import { getScore, getTypes } from './message';

const scoresTable = aircode.db.table('scores');
const reviewsTable = aircode.db.table('reviews');

async function initScores() {
  const c = await scoresTable.where().find();
  if (c.length === 0) {
    await scoresTable.save([
      {
        name_in_github: 'sanshuiyijing',
        name_in_company: 'Yijing Nie',
        init_score: 31.0,
        extra_score: 0,
      },
      {
        name_in_github: 'bosn',
        name_in_company: 'Bosn Ma',
        init_score: 31.0,
        extra_score: 0,
      },
      {
        name_in_github: 'shhdgit',
        name_in_company: 'Haihuang Su',
        init_score: 32.0,
        extra_score: 0,
      },
      {
        name_in_github: 'zhangc110033',
        name_in_company: 'eric',
        init_score: 31.5,
        extra_score: 0,
      },
      {
        name_in_github: 'baurine',
        name_in_company: 'Baurine Huang',
        init_score: 31.5,
        extra_score: 0,
      },
      {
        name_in_github: 'zoubingwu',
        name_in_company: 'Bingwu Zou',
        init_score: 31.5,
        extra_score: 0,
      },
      {
        name_in_github: 'awxxxxxx',
        name_in_company: 'Shuixiong Deng',
        init_score: 32.0,
        extra_score: 0,
      },
      {
        name_in_github: 'Yuiham',
        name_in_company: 'Ruihan Chen',
        init_score: 34.0,
        extra_score: 0,
      },
    ]);
  }
}

export async function listScores() {
  await initScores();
  const allItems = await scoresTable.where().find();
  allItems.sort(
    (a, b) => a.init_score + a.extra_score - (b.init_score + b.extra_score)
  );
  const scores = allItems
    .map((i) => `${i.name_in_company}(${i.init_score + i.extra_score})`)
    .join(' | ');
  return scores;
}

export async function saveReview(event: PullRequestReviewSubmittedEvent) {
  const { repository, sender, pull_request, review } = event;

  const reviewer = sender.login;
  const author = pull_request.user.login;
  if (reviewer === author) {
    return ''
  }
  
  // step 1, find reviewer
  const r = await scoresTable.where({ name_in_github: reviewer }).findOne();
  if (!r) {
    return '';
  }
  const nameInCompany = r.name_in_company;
  const preExtraScore = r.extra_score;

  // step 2, insert or update review record
  // const author = pull_request.user.login;
  const types = getTypes(pull_request as any);
  const score = getScore(pull_request as any);
  await reviewsTable
    .where({
      pr_url: pull_request.html_url,
      reviewer,
    })
    .set({
      pr_title: pull_request.title,
      types: types.join(','),
      score,
    })
    .setOnInsert({
      author,
    })
    .upsert(true)
    .save();

  // step 3, calculate all scores
  const scoresItems = await reviewsTable
    .where({
      reviewer,
    })
    .projection({ score: 1 })
    .find();
  let newExtraScore = 0;
  scoresItems.forEach((s) => (newExtraScore += s.score));

  // step 4, update scores table
  if (preExtraScore !== newExtraScore) {
    await scoresTable
      .where({ name_in_github: reviewer })
      .set({ extra_score: newExtraScore })
      .save();

    return `${nameInCompany} score: ${preExtraScore + r.init_score} --> ${
      newExtraScore + r.init_score
    }`;
  }
  return '';
}
